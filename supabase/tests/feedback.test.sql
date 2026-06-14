begin;

select plan(15);

select has_table('public', 'app_feedback', 'app_feedback table exists');
select has_column('public', 'app_feedback', 'kind', 'app_feedback has a kind');
select has_column('public', 'app_feedback', 'message', 'app_feedback has a message');
select has_column('public', 'app_feedback', 'status', 'app_feedback has a triage status');

select is(
  (select relrowsecurity from pg_class where oid = 'public.app_feedback'::regclass),
  true,
  'app_feedback has RLS enabled'
);

-- Private inbox: clients can neither read nor write the table directly.
select ok(
  not has_table_privilege('authenticated', 'public.app_feedback', 'SELECT'),
  'authenticated cannot read app_feedback directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.app_feedback', 'INSERT'),
  'authenticated cannot write app_feedback directly'
);

-- Fixtures: a parent in their own household, plus a household they don't belong to.
insert into auth.users (id, email)
values ('00000000-0000-0000-0000-0000000000a1', 'feedback-parent@example.com');

insert into public.households (id, owner_user_id, name)
values ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000a1', 'Feedback home');

insert into public.household_members (household_id, user_id, role)
values ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000a1', 'parent_admin');

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-0000000000b1', 'stranger@example.com');

insert into public.households (id, owner_user_id, name)
values ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b1', 'Someone else');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

-- A parent submits feedback for their own household.
select lives_ok(
  $$ select public.submit_app_feedback('feedback', '  Love the 40/40/20 split!  ', '00000000-0000-0000-0000-0000000000a2', 'ios', '1.0.0') $$,
  'a signed-in parent can submit feedback'
);

select is(
  (select message from public.app_feedback where user_id = '00000000-0000-0000-0000-0000000000a1' and kind = 'feedback'),
  'Love the 40/40/20 split!',
  'message is trimmed and stored'
);

select is(
  (select contact_email from public.app_feedback where user_id = '00000000-0000-0000-0000-0000000000a1' and kind = 'feedback'),
  'feedback-parent@example.com',
  'contact email is captured from auth, not the client'
);

select is(
  (select household_id from public.app_feedback where user_id = '00000000-0000-0000-0000-0000000000a1' and kind = 'feedback'),
  '00000000-0000-0000-0000-0000000000a2'::uuid,
  'household is attached when the caller is a member'
);

-- Submitting against a household the caller is NOT a member of drops the household.
select public.submit_app_feedback('contact', 'Need help', '00000000-0000-0000-0000-0000000000b2', 'android', '1.0.0');
select is(
  (select household_id from public.app_feedback where user_id = '00000000-0000-0000-0000-0000000000a1' and kind = 'contact'),
  null,
  'household is dropped when the caller is not a member'
);

select throws_ok(
  $$ select public.submit_app_feedback('spam', 'hi') $$,
  'Unknown feedback kind: spam',
  'unknown kinds are rejected'
);

select throws_ok(
  $$ select public.submit_app_feedback('feedback', '   ') $$,
  'A message is required.',
  'blank messages are rejected'
);

-- Repeat submissions are allowed up to a per-user hourly cap. Seed 20 within the
-- hour, then the next call is rejected.
insert into public.app_feedback (user_id, kind, message)
select '00000000-0000-0000-0000-0000000000a1', 'feedback', 'note ' || g
from generate_series(1, 20) g;

select throws_ok(
  $$ select public.submit_app_feedback('feedback', 'one more') $$,
  'You have sent a lot of messages recently — please try again later.',
  'submissions are capped per user per hour'
);

select * from finish();

rollback;
