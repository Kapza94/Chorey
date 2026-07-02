begin;

select plan(10);

insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-0000000f0001', 'owner@example.com'),
  ('00000000-0000-0000-0000-0000000f0002', 'coparent@example.com'),
  ('00000000-0000-0000-0000-0000000f0003', 'wrong@example.com'),
  ('00000000-0000-0000-0000-0000000f0004', 'step1@example.com'),
  ('00000000-0000-0000-0000-0000000f0005', 'step2@example.com');

insert into public.households (id, owner_user_id, name)
values (
  '00000000-0000-0000-0000-0000000f1001',
  '00000000-0000-0000-0000-0000000f0001',
  'Invite home'
);

insert into public.household_members (household_id, user_id, role)
values (
  '00000000-0000-0000-0000-0000000f1001',
  '00000000-0000-0000-0000-0000000f0001',
  'parent_admin'
);

select has_table('public', 'household_invites', 'household invites table exists');

create temp table created_invites (
  email text primary key,
  token text not null
) on commit drop;
grant select, insert on created_invites to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000f0001', true);

insert into created_invites (email, token)
select email, invite_token
from public.create_household_invite('00000000-0000-0000-0000-0000000f1001', ' CoParent@Example.com ');

select ok(
  exists (select 1 from created_invites where email = 'coparent@example.com'),
  'parent admin can create a co-parent invite'
);

select is(
  (select email from public.household_invites where household_id = '00000000-0000-0000-0000-0000000f1001'),
  'coparent@example.com',
  'invite email is normalized'
);

select is(
  (select status from public.list_household_invites('00000000-0000-0000-0000-0000000f1001') limit 1),
  'pending',
  'parent can list pending household invites'
);

select throws_ok(
  $$ select public.create_household_invite('00000000-0000-0000-0000-0000000f1001', 'coparent@example.com') $$,
  'That parent already has a pending invite.'
);

insert into created_invites (email, token)
select email, invite_token
from public.create_household_invite('00000000-0000-0000-0000-0000000f1001', 'step1@example.com');

insert into created_invites (email, token)
select email, invite_token
from public.create_household_invite('00000000-0000-0000-0000-0000000f1001', 'step2@example.com');

select throws_ok(
  $$ select public.create_household_invite('00000000-0000-0000-0000-0000000f1001', 'extra@example.com') $$,
  'This family already has 3 pending parent invites.'
);

select public.cancel_household_invite(
  '00000000-0000-0000-0000-0000000f1001',
  (select id from public.household_invites where email = 'step2@example.com')
);

select is(
  (select status from public.list_household_invites('00000000-0000-0000-0000-0000000f1001') where email = 'step2@example.com'),
  'cancelled',
  'parent can cancel a pending invite'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000f0001', true);

insert into created_invites (email, token)
select email, invite_token
from public.create_household_invite('00000000-0000-0000-0000-0000000f1001', 'other-target@example.com');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000f0003', true);

-- Possession-based acceptance (like kid access codes): any signed-in parent
-- holding the code may join — the invited email is a label, not a lock.
-- (An email match would permanently break Sign in with Apple + Hide My Email.)
select is(
  (select household_id from public.accept_household_invite(
    (select token from created_invites where email = 'other-target@example.com')
  )),
  '00000000-0000-0000-0000-0000000f1001'::uuid,
  'any signed-in parent with the code can join (no email lock)'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000f0002', true);

-- Codes are forgiving to type: lowercase, spaces, and a stray dash all land.
select is(
  (select household_id from public.accept_household_invite(
    lower(' ' || replace((select token from created_invites where email = 'coparent@example.com'), '-', ' - ') || ' ')
  )),
  '00000000-0000-0000-0000-0000000f1001'::uuid,
  'invited parent accepts with a sloppily-typed code and joins the household'
);

select is(
  (select count(*) from public.household_members
   where household_id = '00000000-0000-0000-0000-0000000f1001'
     and user_id = '00000000-0000-0000-0000-0000000f0002'
     and role = 'parent_admin'),
  1::bigint,
  'accepted invite creates a parent admin membership for the invited user'
);

reset role;

select * from finish();
rollback;
