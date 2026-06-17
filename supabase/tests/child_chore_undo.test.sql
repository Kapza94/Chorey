begin;

select plan(9);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000c01', 'undo-parent@example.com');

insert into public.households (id, owner_user_id, name)
values (
  '00000000-0000-0000-0000-000000000c02',
  '00000000-0000-0000-0000-000000000c01',
  'Undo home'
);

insert into public.household_members (household_id, user_id, role)
values (
  '00000000-0000-0000-0000-000000000c02',
  '00000000-0000-0000-0000-000000000c01',
  'parent_admin'
);

insert into public.child_profiles (id, household_id, display_name)
values
  ('00000000-0000-0000-0000-000000000c03', '00000000-0000-0000-0000-000000000c02', 'Mia'),
  ('00000000-0000-0000-0000-000000000c04', '00000000-0000-0000-0000-000000000c02', 'Theo');

insert into public.child_access_codes (
  child_profile_id,
  household_id,
  access_code,
  created_by_user_id
)
values
  (
    '00000000-0000-0000-0000-000000000c03',
    '00000000-0000-0000-0000-000000000c02',
    'CHOREY-UNDO0001',
    '00000000-0000-0000-0000-000000000c01'
  ),
  (
    '00000000-0000-0000-0000-000000000c04',
    '00000000-0000-0000-0000-000000000c02',
    'CHOREY-UNDO0002',
    '00000000-0000-0000-0000-000000000c01'
  );

insert into public.chore_instances (
  id,
  household_id,
  child_profile_id,
  title,
  reward_cents,
  status,
  created_by_user_id
)
values
  (
    '00000000-0000-0000-0000-000000000c11',
    '00000000-0000-0000-0000-000000000c02',
    '00000000-0000-0000-0000-000000000c03',
    'Submitted',
    100,
    'submitted',
    '00000000-0000-0000-0000-000000000c01'
  ),
  (
    '00000000-0000-0000-0000-000000000c12',
    '00000000-0000-0000-0000-000000000c02',
    '00000000-0000-0000-0000-000000000c03',
    'Assigned',
    200,
    'assigned',
    '00000000-0000-0000-0000-000000000c01'
  ),
  (
    '00000000-0000-0000-0000-000000000c13',
    '00000000-0000-0000-0000-000000000c02',
    '00000000-0000-0000-0000-000000000c03',
    'Approved',
    300,
    'approved',
    '00000000-0000-0000-0000-000000000c01'
  ),
  (
    '00000000-0000-0000-0000-000000000c14',
    '00000000-0000-0000-0000-000000000c02',
    '00000000-0000-0000-0000-000000000c04',
    'Other child',
    400,
    'submitted',
    '00000000-0000-0000-0000-000000000c01'
  );

select has_function(
  'public',
  'undo_child_chore_submission',
  array['text', 'uuid'],
  'child undo RPC exists'
);

select is(
  (
    select status::text
    from public.undo_child_chore_submission(
      'chorey-undo0001',
      '00000000-0000-0000-0000-000000000c11'
    )
  ),
  'assigned',
  'assigned child can undo a submitted chore'
);

select is(
  (
    select status::text
    from public.chore_instances
    where id = '00000000-0000-0000-0000-000000000c11'
  ),
  'assigned',
  'undo persists the assigned status'
);

select is(
  (
    select count(*)::integer
    from public.ledger_events
    where chore_instance_id = '00000000-0000-0000-0000-000000000c11'
  ),
  0,
  'undo creates no ledger event'
);

select is_empty(
  $$ select * from public.undo_child_chore_submission(
    'CHOREY-00000000',
    '00000000-0000-0000-0000-000000000c14'
  ) $$,
  'invalid access code cannot undo'
);

select is_empty(
  $$ select * from public.undo_child_chore_submission(
    'CHOREY-UNDO0001',
    '00000000-0000-0000-0000-000000000c14'
  ) $$,
  'one child cannot undo another child chore'
);

select is_empty(
  $$ select * from public.undo_child_chore_submission(
    'CHOREY-UNDO0001',
    '00000000-0000-0000-0000-000000000c12'
  ) $$,
  'assigned chore cannot be undone'
);

select is_empty(
  $$ select * from public.undo_child_chore_submission(
    'CHOREY-UNDO0001',
    '00000000-0000-0000-0000-000000000c13'
  ) $$,
  'approved chore cannot be undone'
);

select is(
  (
    select status::text
    from public.chore_instances
    where id = '00000000-0000-0000-0000-000000000c13'
  ),
  'approved',
  'approval wins an undo race'
);

select * from finish();
rollback;
