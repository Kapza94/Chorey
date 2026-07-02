begin;

select plan(12);

insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-0000000f0001', 'owner@example.com'),
  ('00000000-0000-0000-0000-0000000f0002', 'coparent@example.com'),
  ('00000000-0000-0000-0000-0000000f0003', 'wrong@example.com');

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

-- Codes are returned once at creation, so stash them by label for later steps.
create temp table created_invites (
  label text primary key,
  invite_id uuid not null,
  token text not null
) on commit drop;
grant select, insert on created_invites to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000f0001', true);

insert into created_invites (label, invite_id, token)
select 'first', id, invite_token
from public.create_household_invite('00000000-0000-0000-0000-0000000f1001');

select ok(
  exists (select 1 from created_invites where label = 'first'),
  'parent admin can create a family code'
);

-- No email is collected anymore — the code is the whole invite.
select ok(
  (select email from public.household_invites
   where id = (select invite_id from created_invites where label = 'first')) is null,
  'family code invites store no email'
);

select is(
  (select status from public.list_household_invites('00000000-0000-0000-0000-0000000f1001') limit 1),
  'pending',
  'parent can list pending household invites'
);

insert into created_invites (label, invite_id, token)
select 'second', id, invite_token
from public.create_household_invite('00000000-0000-0000-0000-0000000f1001');

insert into created_invites (label, invite_id, token)
select 'third', id, invite_token
from public.create_household_invite('00000000-0000-0000-0000-0000000f1001');

select throws_ok(
  $$ select public.create_household_invite('00000000-0000-0000-0000-0000000f1001') $$,
  'This family already has 3 pending parent invites.'
);

select public.cancel_household_invite(
  '00000000-0000-0000-0000-0000000f1001',
  (select invite_id from created_invites where label = 'third')
);

select is(
  (select status from public.list_household_invites('00000000-0000-0000-0000-0000000f1001')
   where id = (select invite_id from created_invites where label = 'third')),
  'cancelled',
  'parent can cancel a pending invite'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000f0003', true);

-- Possession-based acceptance (like kid access codes): any signed-in parent
-- holding the code may join — there is no email lock.
-- (An email match would permanently break Sign in with Apple + Hide My Email.)
select is(
  (select household_id from public.accept_household_invite(
    (select token from created_invites where label = 'second')
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
    lower(' ' || replace((select token from created_invites where label = 'first'), '-', ' - ') || ' ')
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

-- Settings shows who's on the family plan: both parents, joined parent second,
-- and the caller flagged so the UI can say "You".
select is(
  (select count(*) from public.list_household_parents('00000000-0000-0000-0000-0000000f1001')),
  3::bigint,
  'household members can list the family''s parent accounts'
);

select is(
  (select is_you from public.list_household_parents('00000000-0000-0000-0000-0000000f1001')
   where user_id = '00000000-0000-0000-0000-0000000f0002'),
  true,
  'the caller is flagged as themselves in the parent list'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000f0009', true);

select is(
  (select count(*) from public.list_household_parents('00000000-0000-0000-0000-0000000f1001')),
  0::bigint,
  'outsiders cannot list another family''s parents'
);

reset role;

select * from finish();
rollback;
