-- Parents can rename themselves from the account sheet. The initial migration
-- granted only select + insert on profiles; editing a saved display_name needs
-- an update path. Still scoped to the row the user owns.

create policy "users can update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

grant update on public.profiles to authenticated;
