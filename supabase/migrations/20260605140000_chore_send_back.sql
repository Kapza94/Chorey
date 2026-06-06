-- Send-back: a parent can return a submitted chore to the child with a reason.
-- No ledger events are created — the ledger trigger only fires on 'approved'.

alter table public.chore_instances
  add column sent_back_reason text;

-- Broaden the parent approval policy so a submitted chore can also go back
-- (submitted -> approved | sent_back).
drop policy "parent admins can approve submitted chores" on public.chore_instances;

create policy "parent admins can resolve submitted chores"
on public.chore_instances
for update
to authenticated
using (
  status = 'submitted'
  and exists (
    select 1
    from public.household_members member
    where member.household_id = chore_instances.household_id
      and member.user_id = auth.uid()
      and member.role = 'parent_admin'
  )
)
with check (
  status in ('approved', 'sent_back')
  and exists (
    select 1
    from public.household_members member
    where member.household_id = chore_instances.household_id
      and member.user_id = auth.uid()
      and member.role = 'parent_admin'
  )
);

-- Allow a child to resubmit a sent-back chore, clearing the reason.
create or replace function public.submit_child_chore(
  input_access_code text,
  input_chore_id uuid
)
returns table (
  id uuid,
  title text,
  reward_cents integer,
  status public.chore_status
)
language sql
security definer
set search_path = public
as $$
  update public.chore_instances chore
  set status = 'submitted', sent_back_reason = null
  from public.child_access_codes code
  where code.access_code = regexp_replace(input_access_code, '\D', '', 'g')
    and chore.id = input_chore_id
    and chore.child_profile_id = code.child_profile_id
    and chore.status in ('assigned', 'sent_back')
  returning chore.id, chore.title, chore.reward_cents, chore.status
$$;

-- Surface the send-back reason on the child's chore list (return shape changes,
-- so drop + recreate).
drop function public.list_child_chores(text);

create function public.list_child_chores(input_access_code text)
returns table (
  id uuid,
  title text,
  reward_cents integer,
  status public.chore_status,
  sent_back_reason text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    chore.id,
    chore.title,
    chore.reward_cents,
    chore.status,
    chore.sent_back_reason
  from public.child_access_codes code
  join public.chore_instances chore
    on chore.child_profile_id = code.child_profile_id
  where code.access_code = regexp_replace(input_access_code, '\D', '', 'g')
  order by chore.created_at desc
$$;

grant execute on function public.list_child_chores(text) to anon, authenticated;
