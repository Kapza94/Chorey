-- In-app feedback + contact loop. Active families can send the founder a note
-- ("Send feedback") or a support request ("Contact us") straight from the
-- account sheet — direct signal, not just App Store reviews.
--
-- This is a private inbox: parents may *write* their own messages (through a
-- security-definer RPC) but no client can ever *read* the table. The owner reads
-- it from the Supabase dashboard (service_role / table owner bypasses RLS), so
-- the Table Editor — filtered on `feedback_inbox` — is the lightweight CRM.

create table public.app_feedback (
  id uuid primary key default gen_random_uuid(),
  -- contextual, nullable so a deleted account/household never drops the message
  household_id uuid references public.households(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  -- 'feedback' = unsolicited thoughts; 'contact' = a request expecting a reply
  kind text not null check (kind in ('feedback', 'contact')),
  message text not null check (char_length(message) between 1 and 4000),
  -- captured server-side from auth so we can reply to a contact request
  contact_email text,
  platform text,
  app_version text,
  -- triage state for the inbox: new -> read -> resolved
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.app_feedback enable row level security;

-- Intentionally NO select/insert/update/delete policies for authenticated or
-- anon. RLS with zero policies denies all client access; writes go exclusively
-- through submit_app_feedback() below. Only the table owner (dashboard) reads it.
-- Supabase default-grants table privileges to anon/authenticated, so revoke them
-- explicitly — defence in depth on top of the deny-all RLS.
revoke all on public.app_feedback from anon, authenticated;

-- Newest-first triage, with the open queue ('new') cheap to scan.
create index app_feedback_created_at_idx on public.app_feedback (created_at desc);
create index app_feedback_open_idx on public.app_feedback (status, created_at desc);

-- A signed-in parent submits feedback or a contact request. The caller's id and
-- email come from auth (never trusted from the client), and the household is
-- only attached when the caller actually belongs to it. Returns the new row id.
create function public.submit_app_feedback(
  input_kind text,
  input_message text,
  input_household_id uuid default null,
  input_platform text default null,
  input_app_version text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  caller_email text;
  resolved_household uuid;
  trimmed text := btrim(input_message);
  new_id uuid;
begin
  if caller is null then
    raise exception 'You must be signed in to send feedback.';
  end if;

  if input_kind not in ('feedback', 'contact') then
    raise exception 'Unknown feedback kind: %', input_kind;
  end if;

  if trimmed is null or char_length(trimmed) = 0 then
    raise exception 'A message is required.';
  end if;

  if char_length(trimmed) > 4000 then
    raise exception 'Message is too long (max 4000 characters).';
  end if;

  -- Repeat submissions are allowed (families have new thoughts over time), but a
  -- generous per-user cap stops the inbox being flooded by spam or a stuck loop.
  if (
    select count(*)
    from public.app_feedback
    where user_id = caller
      and created_at > now() - interval '1 hour'
  ) >= 20 then
    raise exception 'You have sent a lot of messages recently — please try again later.';
  end if;

  select email into caller_email from auth.users where id = caller;

  -- Only attach the household when the caller is a member of it.
  if input_household_id is not null then
    select member.household_id
    into resolved_household
    from public.household_members member
    where member.household_id = input_household_id
      and member.user_id = caller
    limit 1;
  end if;

  insert into public.app_feedback (
    household_id, user_id, kind, message, contact_email, platform, app_version
  )
  values (
    resolved_household, caller, input_kind, trimmed, caller_email,
    input_platform, input_app_version
  )
  returning id into new_id;

  return new_id;
end;
$$;

-- Parents (authenticated) can submit; anon (children) cannot.
revoke execute on function public.submit_app_feedback(text, text, uuid, text, text) from public, anon;
grant execute on function public.submit_app_feedback(text, text, uuid, text, text) to authenticated;

-- The founder reads the inbox straight from the app_feedback table in the
-- Supabase dashboard (service_role / table owner bypasses RLS). No reporting
-- view ships for now.
