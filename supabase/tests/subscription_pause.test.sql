begin;

select plan(11);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000001201', 'pause-parent@example.com');

insert into public.households (id, owner_user_id, name)
values (
  '00000000-0000-0000-0000-000000001202',
  '00000000-0000-0000-0000-000000001201',
  'Pause home'
);

insert into public.household_members (household_id, user_id, role)
values (
  '00000000-0000-0000-0000-000000001202',
  '00000000-0000-0000-0000-000000001201',
  'parent_admin'
);

insert into public.child_profiles (id, household_id, display_name)
values (
  '00000000-0000-0000-0000-000000001203',
  '00000000-0000-0000-0000-000000001202',
  'Pause kid'
);

insert into public.child_access_codes (
  child_profile_id,
  household_id,
  access_code,
  created_by_user_id
)
values (
  '00000000-0000-0000-0000-000000001203',
  '00000000-0000-0000-0000-000000001202',
  'CHOREY-PAUS0001',
  '00000000-0000-0000-0000-000000001201'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000001201', true);

-- While trialing, everything works.
select lives_ok(
  $$ insert into public.chore_instances (
       household_id, child_profile_id, title, reward_cents, status, created_by_user_id
     ) values (
       '00000000-0000-0000-0000-000000001202',
       '00000000-0000-0000-0000-000000001203',
       'Trial chore', 500, 'assigned',
       '00000000-0000-0000-0000-000000001201'
     ) $$,
  'entitled household can create chores'
);

select lives_ok(
  $$ select public.choose_subscription_plan(
       '00000000-0000-0000-0000-000000001202', 'yearly'
     ) $$,
  'parent admin can choose the billing plan'
);

select is(
  (
    select plan::text
    from public.household_entitlements
    where household_id = '00000000-0000-0000-0000-000000001202'
  ),
  'yearly',
  'chosen plan is recorded on the household entitlement'
);

-- A recurring template exists before the household lapses.
insert into public.chore_templates (
  household_id, child_profile_id, title, reward_cents, recurrence, created_by_user_id
)
values (
  '00000000-0000-0000-0000-000000001202',
  '00000000-0000-0000-0000-000000001203',
  'Daily template', 100, 'daily',
  '00000000-0000-0000-0000-000000001201'
);

-- The trial ends without renewal.
update public.household_entitlements
set status = 'lapsed'
where household_id = '00000000-0000-0000-0000-000000001202';

select throws_ok(
  $$ insert into public.chore_instances (
       household_id, child_profile_id, title, reward_cents, status, created_by_user_id
     ) values (
       '00000000-0000-0000-0000-000000001202',
       '00000000-0000-0000-0000-000000001203',
       'Paused chore', 500, 'assigned',
       '00000000-0000-0000-0000-000000001201'
     ) $$,
  'P0001',
  'Chorey is paused.',
  'paused household cannot create chores'
);

select throws_ok(
  $$ select * from public.submit_child_chore(
       'CHOREY-PAUS0001',
       (select id from public.chore_instances
        where child_profile_id = '00000000-0000-0000-0000-000000001203'
        limit 1)
     ) $$,
  'P0001',
  'Chorey is paused.',
  'paused household blocks child submission'
);

select throws_ok(
  $$ select * from public.create_child_wishlist_item('CHOREY-PAUS0001', 'Ball', 1000) $$,
  'P0001',
  'Chorey is paused.',
  'paused household blocks wishlist creation'
);

select throws_ok(
  $$ insert into public.payouts (household_id, child_profile_id, amount_cents, method)
     values (
       '00000000-0000-0000-0000-000000001202',
       '00000000-0000-0000-0000-000000001203',
       100, 'cash'
     ) $$,
  'P0001',
  'Chorey is paused.',
  'paused household blocks payouts'
);

select is(
  public.ensure_recurring_chore_instances('00000000-0000-0000-0000-000000001202'),
  0,
  'recurring generation quietly skips a paused household'
);

-- History stays readable for the kid and the parent.
select is(
  (select count(*)::integer from public.list_child_chores('CHOREY-PAUS0001')),
  1,
  'paused household keeps child chores readable'
);

select is(
  (select paused from public.resolve_child_access_code('CHOREY-PAUS0001')),
  true,
  'resolving an access code reports the pause to the kid app'
);

-- Reactivating picks up exactly where the household left off.
update public.household_entitlements
set status = 'active'
where household_id = '00000000-0000-0000-0000-000000001202';

select lives_ok(
  $$ insert into public.chore_instances (
       household_id, child_profile_id, title, reward_cents, status, created_by_user_id
     ) values (
       '00000000-0000-0000-0000-000000001202',
       '00000000-0000-0000-0000-000000001203',
       'Resumed chore', 500, 'assigned',
       '00000000-0000-0000-0000-000000001201'
     ) $$,
  'reactivated household can create chores again'
);

select * from finish();

rollback;
