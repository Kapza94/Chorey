begin;

select plan(6);

select has_table('public', 'savings_goals', 'savings goals table exists');

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000001301', 'goal-parent@example.com');

insert into public.households (id, owner_user_id, name)
values (
  '00000000-0000-0000-0000-000000001302',
  '00000000-0000-0000-0000-000000001301',
  'Goal home'
);

insert into public.household_members (household_id, user_id, role)
values (
  '00000000-0000-0000-0000-000000001302',
  '00000000-0000-0000-0000-000000001301',
  'parent_admin'
);

insert into public.child_profiles (id, household_id, display_name)
values (
  '00000000-0000-0000-0000-000000001303',
  '00000000-0000-0000-0000-000000001302',
  'Goal kid'
);

insert into public.child_access_codes (
  child_profile_id,
  household_id,
  access_code,
  created_by_user_id
)
values (
  '00000000-0000-0000-0000-000000001303',
  '00000000-0000-0000-0000-000000001302',
  '888888',
  '00000000-0000-0000-0000-000000001301'
);

select is(
  (select name from public.set_child_savings_goal('888888', ' New bike ', 6000)),
  'New bike',
  'child can set a savings goal by access code'
);

-- Setting again replaces the goal (one per kid, the point is focus).
select is(
  (select target_cents from public.set_child_savings_goal('888888', 'Telescope', 9000)),
  9000,
  'setting again replaces the single goal'
);

select is(
  (select count(*)::integer from public.savings_goals
   where child_profile_id = '00000000-0000-0000-0000-000000001303'),
  1,
  'a kid has at most one savings goal'
);

select is(
  (select name from public.get_child_savings_goal('888888')),
  'Telescope',
  'child can read their goal back'
);

-- Goal edits pause with the subscription.
update public.household_entitlements
set status = 'lapsed'
where household_id = '00000000-0000-0000-0000-000000001302';

select throws_ok(
  $$ select * from public.set_child_savings_goal('888888', 'Drums', 12000) $$,
  'P0001',
  'Chorey is paused.',
  'paused household blocks savings goal changes'
);

select * from finish();

rollback;
