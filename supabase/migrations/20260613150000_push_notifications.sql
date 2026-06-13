-- Push notifications. Stores Expo push tokens per child (and optionally per
-- parent) so a scheduled job can nudge a child when a daily chore goes late.
-- Children aren't Supabase-authenticated, so they register their token through
-- a security-definer RPC keyed by their access code.

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  child_profile_id uuid references public.child_profiles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  token text not null unique,
  platform text,
  updated_at timestamptz not null default now(),
  -- a token belongs to exactly one of: a child or a parent user.
  constraint push_tokens_owner check (
    child_profile_id is not null or user_id is not null
  )
);

alter table public.push_tokens enable row level security;

-- Parents manage their own device tokens.
create policy "users manage their own push tokens"
on public.push_tokens
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Parents can read tokens of children in their household (e.g. for diagnostics).
create policy "household members read child push tokens"
on public.push_tokens
for select
to authenticated
using (
  child_profile_id is not null
  and exists (
    select 1
    from public.child_profiles child
    join public.household_members member
      on member.household_id = child.household_id
    where child.id = push_tokens.child_profile_id
      and member.user_id = auth.uid()
  )
);

grant select, insert, update, delete on public.push_tokens to authenticated;

-- When a daily chore goes late we notify once; this records that moment so the
-- scheduled job never double-pings the same overdue instance.
alter table public.chore_instances
  add column late_notified_at timestamptz;

-- A child registers (or refreshes) their device's Expo push token via their
-- access code. Re-registering the same token just re-points it at this child.
create function public.register_child_push_token(
  input_access_code text,
  input_token text,
  input_platform text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_child uuid;
begin
  select code.child_profile_id
  into resolved_child
  from public.child_access_codes code
  where code.access_code = regexp_replace(input_access_code, '\D', '', 'g')
  limit 1;

  if resolved_child is null then
    raise exception 'Unknown access code.';
  end if;

  insert into public.push_tokens (child_profile_id, token, platform)
  values (resolved_child, input_token, input_platform)
  on conflict (token) do update
    set child_profile_id = excluded.child_profile_id,
        platform = excluded.platform,
        user_id = null,
        updated_at = now();
end;
$$;

grant execute on function public.register_child_push_token(text, text, text)
  to anon, authenticated;

-- Overdue, not-yet-notified recurring chores joined to the child's push tokens.
-- One row per (chore, device token). Used by the scheduled notifier; restricted
-- to the service role so it never leaks tokens to clients.
create function public.get_late_chores_to_notify()
returns table (
  chore_id uuid,
  child_profile_id uuid,
  title text,
  token text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    chore.id,
    chore.child_profile_id,
    chore.title,
    token.token
  from public.chore_instances chore
  join public.chore_templates template
    on template.id = chore.template_id
  join public.push_tokens token
    on token.child_profile_id = chore.child_profile_id
  where chore.status in ('assigned', 'sent_back')
    and chore.late_notified_at is null
    and chore.period_key < to_char(
      date_trunc(
        public.recurrence_trunc_unit(template.recurrence),
        now() at time zone 'utc'
      ),
      'YYYY-MM-DD'
    )
$$;

revoke execute on function public.get_late_chores_to_notify() from public;
revoke execute on function public.get_late_chores_to_notify() from anon;
revoke execute on function public.get_late_chores_to_notify() from authenticated;
grant execute on function public.get_late_chores_to_notify() to service_role;
