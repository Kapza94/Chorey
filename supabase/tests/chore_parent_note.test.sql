begin;

select plan(4);

-- A household with a parent and an outsider, plus an approved chore.
insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-0000000d0001', 'note-parent@example.com'),
  ('00000000-0000-0000-0000-0000000d0009', 'note-outsider@example.com');

insert into public.households (id, owner_user_id, name)
values (
  '00000000-0000-0000-0000-0000000d0002',
  '00000000-0000-0000-0000-0000000d0001',
  'Note home'
);

insert into public.household_members (household_id, user_id, role)
values (
  '00000000-0000-0000-0000-0000000d0002',
  '00000000-0000-0000-0000-0000000d0001',
  'parent_admin'
);

insert into public.child_profiles (id, household_id, display_name)
values ('00000000-0000-0000-0000-0000000d0003', '00000000-0000-0000-0000-0000000d0002', 'Mia');

insert into public.chore_instances (id, household_id, child_profile_id, title, reward_cents, status, created_by_user_id)
values (
  '00000000-0000-0000-0000-0000000d0031',
  '00000000-0000-0000-0000-0000000d0002',
  '00000000-0000-0000-0000-0000000d0003',
  'Dishes',
  1000,
  'approved',
  '00000000-0000-0000-0000-0000000d0001'
);

-- The parent notes the (already approved) chore — the submitted-only RLS policy
-- would block a direct UPDATE, but the RPC writes only parent_note.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000d0001', true);

select lives_ok(
  $$ select public.set_chore_note('00000000-0000-0000-0000-0000000d0031', '  Great job  ') $$,
  'parent can note an approved chore'
);

reset role;

select is(
  (select parent_note from public.chore_instances where id = '00000000-0000-0000-0000-0000000d0031'),
  'Great job',
  'the note is trimmed and stored'
);

-- Clearing with blank text nulls the note.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000d0001', true);
select public.set_chore_note('00000000-0000-0000-0000-0000000d0031', '   ');
reset role;

select is(
  (select parent_note from public.chore_instances where id = '00000000-0000-0000-0000-0000000d0031'),
  null,
  'a blank note clears it'
);

-- An outsider cannot note someone else's chore.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000d0009', true);

select throws_ok(
  $$ select public.set_chore_note('00000000-0000-0000-0000-0000000d0031', 'sneaky') $$,
  'Chore not found or not yours to note.'
);

reset role;

select * from finish();
rollback;
