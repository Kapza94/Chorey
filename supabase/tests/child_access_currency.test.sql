begin;

select plan(2);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000001101', 'currency-parent@example.com');

insert into public.households (id, owner_user_id, name, currency)
values (
  '00000000-0000-0000-0000-000000001102',
  '00000000-0000-0000-0000-000000001101',
  'Currency home',
  'RSD'
);

insert into public.household_members (household_id, user_id, role)
values (
  '00000000-0000-0000-0000-000000001102',
  '00000000-0000-0000-0000-000000001101',
  'parent_admin'
);

insert into public.child_profiles (id, household_id, display_name)
values (
  '00000000-0000-0000-0000-000000001103',
  '00000000-0000-0000-0000-000000001102',
  'Dinar kid'
);

insert into public.child_access_codes (
  child_profile_id,
  household_id,
  access_code,
  created_by_user_id
)
values (
  '00000000-0000-0000-0000-000000001103',
  '00000000-0000-0000-0000-000000001102',
  '654321',
  '00000000-0000-0000-0000-000000001101'
);

select is(
  (select currency from public.resolve_child_access_code('654321')),
  'RSD',
  'resolving an access code returns the household currency'
);

select is(
  (select child_name from public.resolve_child_access_code('654 321')),
  'Dinar kid',
  'resolve still normalizes the code and returns the child'
);

select * from finish();

rollback;
