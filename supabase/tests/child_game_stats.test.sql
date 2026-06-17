begin;

select plan(4);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000002201', 'game-parent@example.com');

insert into public.households (id, owner_user_id, name)
values (
  '00000000-0000-0000-0000-000000002202',
  '00000000-0000-0000-0000-000000002201',
  'Game home'
);

insert into public.household_members (household_id, user_id, role)
values (
  '00000000-0000-0000-0000-000000002202',
  '00000000-0000-0000-0000-000000002201',
  'parent_admin'
);

insert into public.child_profiles (id, household_id, display_name)
values (
  '00000000-0000-0000-0000-000000002203',
  '00000000-0000-0000-0000-000000002202',
  'Game kid'
);

insert into public.child_access_codes (
  child_profile_id,
  household_id,
  access_code,
  created_by_user_id
)
values (
  '00000000-0000-0000-0000-000000002203',
  '00000000-0000-0000-0000-000000002202',
  'CHOREY-GAME0001',
  '00000000-0000-0000-0000-000000002201'
);

-- Approved $1.00 chore → 10 base + 2 bonus = 12 points.
-- Approved $0.00 chore → still earns the 10 base points.
-- Submitted chore → no points until a parent approves.
-- Huge approved reward ($100.00) → bonus capped at 40 → 50 points.
insert into public.chore_instances (
  id, household_id, child_profile_id, title, reward_cents, status, created_by_user_id
)
values
  ('00000000-0000-0000-0000-000000002204', '00000000-0000-0000-0000-000000002202',
   '00000000-0000-0000-0000-000000002203', 'Feed the cat', 100, 'approved',
   '00000000-0000-0000-0000-000000002201'),
  ('00000000-0000-0000-0000-000000002205', '00000000-0000-0000-0000-000000002202',
   '00000000-0000-0000-0000-000000002203', 'Say thanks', 0, 'approved',
   '00000000-0000-0000-0000-000000002201'),
  ('00000000-0000-0000-0000-000000002206', '00000000-0000-0000-0000-000000002202',
   '00000000-0000-0000-0000-000000002203', 'Still waiting', 300, 'submitted',
   '00000000-0000-0000-0000-000000002201'),
  ('00000000-0000-0000-0000-000000002207', '00000000-0000-0000-0000-000000002202',
   '00000000-0000-0000-0000-000000002203', 'Giant job', 10000, 'approved',
   '00000000-0000-0000-0000-000000002201');

select is(
  (select total_points from public.get_child_game_stats('CHOREY-GAME0001')),
  72,
  'points mirror pointsForChore: 12 + 10 + 50, submitted chores excluded'
);

select is(
  (select approved_count from public.get_child_game_stats('CHOREY-GAME0001')),
  3,
  'approved_count only counts approved chores'
);

select is(
  (select total_points from public.get_child_game_stats('CHOREY-GAME 0001')),
  72,
  'access code is normalised before lookup'
);

select is(
  (select total_points from public.get_child_game_stats('CHOREY-00000000')),
  0,
  'unknown code reports zero points, not an error'
);

select * from finish();

rollback;
