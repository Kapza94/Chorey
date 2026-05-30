create policy "parent admins can approve submitted chores"
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
  status = 'approved'
  and exists (
    select 1
    from public.household_members member
    where member.household_id = chore_instances.household_id
      and member.user_id = auth.uid()
      and member.role = 'parent_admin'
  )
);

grant update on public.chore_instances to authenticated;
