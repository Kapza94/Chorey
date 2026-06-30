begin;

select plan(12);

-- function exists
select ok(
  exists (
    select 1
    from pg_proc
    join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'public'
      and pg_proc.proname = 'list_household_kids'
  ),
  'list_household_kids function exists'
);

-- Seed: a parent, a household, two kids.
insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000a01', 'kids-parent@example.com');

insert into public.households (id, owner_user_id, name)
values (
  '00000000-0000-0000-0000-000000000a02',
  '00000000-0000-0000-0000-000000000a01',
  'Aggregate home'
);

insert into public.household_members (household_id, user_id, role)
values (
  '00000000-0000-0000-0000-000000000a02',
  '00000000-0000-0000-0000-000000000a01',
  'parent_admin'
);

insert into public.child_profiles (id, household_id, display_name)
values
  ('00000000-0000-0000-0000-000000000a03', '00000000-0000-0000-0000-000000000a02', 'Aria'),
  ('00000000-0000-0000-0000-000000000a04', '00000000-0000-0000-0000-000000000a02', 'Bram');

-- Aria: one approved (fires the 40/40/20 ledger trigger), one submitted, one assigned.
insert into public.chore_instances (id, household_id, child_profile_id, title, reward_cents, status, created_by_user_id)
values
  ('00000000-0000-0000-0000-000000000a31', '00000000-0000-0000-0000-000000000a02', '00000000-0000-0000-0000-000000000a03', 'Dishes', 1000, 'submitted', '00000000-0000-0000-0000-000000000a01'),
  ('00000000-0000-0000-0000-000000000a32', '00000000-0000-0000-0000-000000000a02', '00000000-0000-0000-0000-000000000a03', 'Vacuum', 500, 'submitted', '00000000-0000-0000-0000-000000000a01'),
  ('00000000-0000-0000-0000-000000000a33', '00000000-0000-0000-0000-000000000a02', '00000000-0000-0000-0000-000000000a03', 'Trash', 300, 'assigned', '00000000-0000-0000-0000-000000000a01');

update public.chore_instances
set status = 'approved'
where id = '00000000-0000-0000-0000-000000000a31';

-- Act as the signed-in parent for the security-definer reads.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000a01', true);

select is(
  (select count(*)::integer from public.list_household_kids('00000000-0000-0000-0000-000000000a02')),
  2,
  'returns a row per kid in the household'
);

select is(
  (select earned_cents::integer from public.list_household_kids('00000000-0000-0000-0000-000000000a02') where child_profile_id = '00000000-0000-0000-0000-000000000a03'),
  1000,
  'earned_cents sums the approved chore reward'
);

select is(
  (select spend_cents::integer from public.list_household_kids('00000000-0000-0000-0000-000000000a02') where child_profile_id = '00000000-0000-0000-0000-000000000a03'),
  400,
  'spend bucket is 40% of the approved reward'
);

select is(
  (select savings_cents::integer from public.list_household_kids('00000000-0000-0000-0000-000000000a02') where child_profile_id = '00000000-0000-0000-0000-000000000a03'),
  400,
  'savings bucket is 40% of the approved reward'
);

select is(
  (select giving_cents::integer from public.list_household_kids('00000000-0000-0000-0000-000000000a02') where child_profile_id = '00000000-0000-0000-0000-000000000a03'),
  200,
  'giving bucket is 20% of the approved reward'
);

select is(
  (select chores_total::integer from public.list_household_kids('00000000-0000-0000-0000-000000000a02') where child_profile_id = '00000000-0000-0000-0000-000000000a03'),
  3,
  'chores_total counts every assigned chore'
);

select is(
  (select chores_done::integer from public.list_household_kids('00000000-0000-0000-0000-000000000a02') where child_profile_id = '00000000-0000-0000-0000-000000000a03'),
  1,
  'chores_done counts only approved chores'
);

select is(
  (select pending_approvals::integer from public.list_household_kids('00000000-0000-0000-0000-000000000a02') where child_profile_id = '00000000-0000-0000-0000-000000000a03'),
  1,
  'pending_approvals counts only submitted chores'
);

select is(
  (select assigned_cents::integer from public.list_household_kids('00000000-0000-0000-0000-000000000a02') where child_profile_id = '00000000-0000-0000-0000-000000000a03'),
  800,
  'assigned_cents sums committed, not-yet-earned chores (excludes approved): 500 + 300'
);

-- A kid with no activity still appears, with zeroed aggregates.
select is(
  (select chores_total::integer from public.list_household_kids('00000000-0000-0000-0000-000000000a02') where child_profile_id = '00000000-0000-0000-0000-000000000a04'),
  0,
  'a kid with no chores still appears with zero totals'
);

-- A non-member gets nothing back.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000a09', true);

select is(
  (select count(*)::integer from public.list_household_kids('00000000-0000-0000-0000-000000000a02')),
  0,
  'a non-member sees no kids'
);

select * from finish();
rollback;
