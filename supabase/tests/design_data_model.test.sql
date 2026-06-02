begin;

select plan(14);

-- Structure: household locale + split columns.
select has_column('public', 'households', 'country', 'household has country');
select has_column('public', 'households', 'currency', 'household has currency');
select has_column('public', 'households', 'split_spend', 'household has split_spend');
select has_column('public', 'households', 'split_save', 'household has split_save');
select has_column('public', 'households', 'split_give', 'household has split_give');

-- Structure: per-kid budget + cadence.
select has_column('public', 'child_profiles', 'budget_cents', 'child has budget_cents');
select has_column('public', 'child_profiles', 'cadence', 'child has cadence');

-- Structure: payouts.
select has_table('public', 'payouts', 'payouts table exists');
select ok(
  to_regtype('public.payout_method') is not null,
  'payout_method enum exists'
);

-- Fixtures.
insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000801', 'payout-parent@example.com');

insert into public.households (id, owner_user_id, name)
values (
  '00000000-0000-0000-0000-000000000802',
  '00000000-0000-0000-0000-000000000801',
  'Payout home'
);

insert into public.household_members (household_id, user_id, role)
values (
  '00000000-0000-0000-0000-000000000802',
  '00000000-0000-0000-0000-000000000801',
  'parent_admin'
);

insert into public.child_profiles (id, household_id, display_name)
values (
  '00000000-0000-0000-0000-000000000803',
  '00000000-0000-0000-0000-000000000802',
  'Mina'
);

-- Defaults: new household ships with the 40/40/20 split and USD.
select results_eq(
  $$ select split_spend, split_save, split_give, currency
     from public.households
     where id = '00000000-0000-0000-0000-000000000802' $$,
  $$ values (40::smallint, 40::smallint, 20::smallint, 'USD') $$,
  'household defaults to 40/40/20 split and USD'
);

-- Default: new child ships with a weekly cadence and a budget cap.
select results_eq(
  $$ select cadence::text, budget_cents
     from public.child_profiles
     where id = '00000000-0000-0000-0000-000000000803' $$,
  $$ values ('weekly', 2500) $$,
  'child defaults to weekly cadence and a budget cap'
);

-- A valid off-app payout records.
select lives_ok(
  $$ insert into public.payouts (household_id, child_profile_id, amount_cents, method)
     values (
       '00000000-0000-0000-0000-000000000802',
       '00000000-0000-0000-0000-000000000803',
       1850,
       'cash'
     ) $$,
  'records a positive payout'
);

-- A non-positive payout is rejected.
select throws_ok(
  $$ insert into public.payouts (household_id, child_profile_id, amount_cents, method)
     values (
       '00000000-0000-0000-0000-000000000802',
       '00000000-0000-0000-0000-000000000803',
       0,
       'cash'
     ) $$,
  '23514',
  null,
  'rejects a zero-amount payout'
);

-- A split that does not sum to 100 is rejected.
select throws_ok(
  $$ update public.households
     set split_spend = 50, split_save = 30, split_give = 30
     where id = '00000000-0000-0000-0000-000000000802' $$,
  '23514',
  null,
  'rejects a split that does not sum to 100'
);

select * from finish();
rollback;
