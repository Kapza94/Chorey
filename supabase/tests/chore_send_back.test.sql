begin;

select plan(8);

select has_column(
  'public',
  'chore_instances',
  'sent_back_reason',
  'chores can store a send-back reason'
);

-- Seed: parent, household, child + access code, a submitted chore.
insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000b01', 'sb-parent@example.com');

insert into public.households (id, owner_user_id, name)
values ('00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-000000000b01', 'Send-back home');

insert into public.household_members (household_id, user_id, role)
values ('00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-000000000b01', 'parent_admin');

insert into public.child_profiles (id, household_id, display_name)
values ('00000000-0000-0000-0000-000000000b03', '00000000-0000-0000-0000-000000000b02', 'Theo');

insert into public.child_access_codes (child_profile_id, household_id, access_code, created_by_user_id)
values (
  '00000000-0000-0000-0000-000000000b03',
  '00000000-0000-0000-0000-000000000b02',
  'CHOREY-SEND0001',
  '00000000-0000-0000-0000-000000000b01'
);

insert into public.chore_instances (id, household_id, child_profile_id, title, reward_cents, status, created_by_user_id)
values (
  '00000000-0000-0000-0000-000000000b31',
  '00000000-0000-0000-0000-000000000b02',
  '00000000-0000-0000-0000-000000000b03',
  'Dishes',
  1000,
  'submitted',
  '00000000-0000-0000-0000-000000000b01'
);

-- A parent sends it back under RLS (not as the superuser).
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000b01', true);

select lives_ok(
  $$ update public.chore_instances
     set status = 'sent_back', sent_back_reason = 'Please redo'
     where id = '00000000-0000-0000-0000-000000000b31' $$,
  'parent can send a submitted chore back'
);

reset role;

select is(
  (select status::text from public.chore_instances where id = '00000000-0000-0000-0000-000000000b31'),
  'sent_back',
  'chore is sent back'
);

select is(
  (select sent_back_reason from public.chore_instances where id = '00000000-0000-0000-0000-000000000b31'),
  'Please redo',
  'the reason is stored'
);

select is(
  (select count(*)::integer from public.ledger_events where chore_instance_id = '00000000-0000-0000-0000-000000000b31'),
  0,
  'send-back creates no ledger events'
);

select is(
  (select sent_back_reason from public.list_child_chores('CHOREY-SEND0001') where id = '00000000-0000-0000-0000-000000000b31'),
  'Please redo',
  'the child sees the send-back reason'
);

select is(
  (select status::text from public.submit_child_chore('CHOREY-SEND0001', '00000000-0000-0000-0000-000000000b31')),
  'submitted',
  'the child can resubmit a sent-back chore'
);

select is(
  (select sent_back_reason from public.chore_instances where id = '00000000-0000-0000-0000-000000000b31'),
  null,
  'resubmitting clears the reason'
);

select * from finish();
rollback;
