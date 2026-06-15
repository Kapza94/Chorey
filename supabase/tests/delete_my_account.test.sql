begin;

select plan(10);

select has_function('public', 'delete_my_account', 'delete_my_account RPC exists');

select ok(
  not has_function_privilege('anon', 'public.delete_my_account()', 'EXECUTE'),
  'anon (children) cannot delete accounts'
);
select ok(
  has_function_privilege('authenticated', 'public.delete_my_account()', 'EXECUTE'),
  'authenticated parents can delete their account'
);

-- Parent A owns a household with a child and a co-parent B.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000c1', 'owner-a@example.com'),
  ('00000000-0000-0000-0000-0000000000c2', 'coparent-b@example.com'),
  ('00000000-0000-0000-0000-0000000000c3', 'owner-c@example.com');

insert into public.households (id, owner_user_id, name) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1', 'A home'),
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000c3', 'C home');

insert into public.household_members (household_id, user_id, role) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1', 'parent_admin'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c2', 'parent_admin'),
  -- A is also a co-parent in C's household.
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000c1', 'parent_admin');

insert into public.child_profiles (id, household_id, display_name) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000d1', 'Kid A'),
  ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000d3', 'Kid C');

-- A (a co-parent in C's household) created a recurring chore template there.
-- Deleting A must NOT destroy it — it belongs to a household A doesn't own.
insert into public.chore_templates
  (id, household_id, child_profile_id, title, reward_cents, recurrence, created_by_user_id)
values (
  '00000000-0000-0000-0000-0000000000f3',
  '00000000-0000-0000-0000-0000000000d3',
  '00000000-0000-0000-0000-0000000000e3',
  'Walk the dog',
  100,
  'daily',
  '00000000-0000-0000-0000-0000000000c1'
);

-- A deletes their account.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', true);
select lives_ok(
  $$ select public.delete_my_account() $$,
  'a signed-in parent can delete their own account'
);

select is(
  (select count(*)::int from auth.users where id = '00000000-0000-0000-0000-0000000000c1'),
  0,
  'the auth user is gone'
);

select is(
  (select count(*)::int from public.households where id = '00000000-0000-0000-0000-0000000000d1'),
  0,
  'the household A owned (and its child, via cascade) is deleted'
);

select is(
  (select count(*)::int from public.child_profiles where id = '00000000-0000-0000-0000-0000000000e1'),
  0,
  'the child profile cascades away'
);

-- C's household survives; only A's co-parent membership in it is removed.
select is(
  (
    select count(*)::int from public.households where id = '00000000-0000-0000-0000-0000000000d3'
  ) || '/' || (
    select count(*)::int from public.household_members
    where household_id = '00000000-0000-0000-0000-0000000000d3'
      and user_id = '00000000-0000-0000-0000-0000000000c1'
  ),
  '1/0',
  'a co-parent deleting themselves leaves the other household intact, minus their membership'
);

-- The chore template A created in C's household survives, with attribution nulled.
select is(
  (select count(*)::int from public.chore_templates where id = '00000000-0000-0000-0000-0000000000f3'),
  1,
  'content the deleted co-parent created in another household is preserved'
);
select is(
  (select created_by_user_id from public.chore_templates where id = '00000000-0000-0000-0000-0000000000f3'),
  null,
  'preserved content has its created_by attribution nulled, not cascaded away'
);

select * from finish();

rollback;
