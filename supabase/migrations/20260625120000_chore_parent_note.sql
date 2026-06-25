-- Parent note on a chore. A parent can jot a short note on any of their
-- household's chores — most usefully on a *done* chore, to record what was
-- done or leave a "nice work". Done chores are 'approved', which the existing
-- submitted-only update policy deliberately freezes, and RLS can't scope an
-- UPDATE to a single column. So the write goes through a security-definer RPC
-- that touches only parent_note and leaves status/reward untouched.

alter table public.chore_instances
  add column if not exists parent_note text;

create or replace function public.set_chore_note(
  input_chore_id uuid,
  input_note text
)
returns table (id uuid, parent_note text)
language plpgsql
security definer
set search_path = public
as $$
declare
  trimmed text := nullif(trim(coalesce(input_note, '')), '');
begin
  return query
  update public.chore_instances chore
  set parent_note = trimmed
  where chore.id = input_chore_id
    and exists (
      select 1
      from public.household_members member
      where member.household_id = chore.household_id
        and member.user_id = auth.uid()
        and member.role = 'parent_admin'
    )
  returning chore.id, chore.parent_note;

  if not found then
    raise exception 'Chore not found or not yours to note.';
  end if;
end;
$$;

revoke execute on function public.set_chore_note(uuid, text) from public, anon;
grant execute on function public.set_chore_note(uuid, text) to authenticated;
