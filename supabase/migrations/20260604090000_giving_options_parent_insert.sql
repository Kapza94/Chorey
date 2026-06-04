-- Let parent admins seed giving options directly (e.g. the charities chosen
-- during onboarding). Until now giving_options could only be populated via the
-- security-definer `approve_giving_suggestion` flow; onboarding needs to write
-- the family's starting charities straight in.

create policy "parent admins can add giving options"
on public.giving_options
for insert
to authenticated
with check (
  exists (
    select 1
    from public.household_members member
    where member.household_id = giving_options.household_id
      and member.user_id = auth.uid()
      and member.role = 'parent_admin'
  )
);

grant insert on public.giving_options to authenticated;
