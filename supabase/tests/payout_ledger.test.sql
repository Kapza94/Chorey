begin;

select plan(7);

select has_column('public', 'ledger_events', 'payout_id', 'ledger events can reference a payout');

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'create_ledger_event_when_payout_recorded'
      and tgrelid = 'public.payouts'::regclass
  ),
  'payout ledger trigger exists'
);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000001001', 'payout-parent@example.com');

insert into public.households (id, owner_user_id, name)
values (
  '00000000-0000-0000-0000-000000001002',
  '00000000-0000-0000-0000-000000001001',
  'Payout home'
);

insert into public.household_members (household_id, user_id, role)
values (
  '00000000-0000-0000-0000-000000001002',
  '00000000-0000-0000-0000-000000001001',
  'parent_admin'
);

insert into public.child_profiles (id, household_id, display_name)
values (
  '00000000-0000-0000-0000-000000001003',
  '00000000-0000-0000-0000-000000001002',
  'Pay kid'
);

-- A $100.00 approved chore credits 40/40/20: spend 4000, savings 4000, giving 2000.
insert into public.chore_instances (
  id,
  household_id,
  child_profile_id,
  title,
  reward_cents,
  status,
  created_by_user_id
)
values (
  '00000000-0000-0000-0000-000000001004',
  '00000000-0000-0000-0000-000000001002',
  '00000000-0000-0000-0000-000000001003',
  'Big chore',
  10000,
  'submitted',
  '00000000-0000-0000-0000-000000001001'
);

update public.chore_instances
set status = 'approved'
where id = '00000000-0000-0000-0000-000000001004';

-- A payout may not exceed the child's Spend balance (4000).
select throws_ok(
  $$ insert into public.payouts (household_id, child_profile_id, amount_cents, method)
     values (
       '00000000-0000-0000-0000-000000001002',
       '00000000-0000-0000-0000-000000001003',
       4001,
       'cash'
     ) $$,
  'P0001',
  'Payout exceeds the child''s Spend balance.',
  'payout above the spend balance is rejected'
);

insert into public.payouts (id, household_id, child_profile_id, amount_cents, method)
values (
  '00000000-0000-0000-0000-000000001005',
  '00000000-0000-0000-0000-000000001002',
  '00000000-0000-0000-0000-000000001003',
  1500,
  'cash'
);

select is(
  (
    select amount_cents::integer
    from public.ledger_events
    where payout_id = '00000000-0000-0000-0000-000000001005'
  ),
  -1500,
  'payout records a negative spend ledger event'
);

select is(
  (
    select coalesce(sum(amount_cents), 0)::integer
    from public.ledger_events
    where child_profile_id = '00000000-0000-0000-0000-000000001003'
      and bucket = 'spend'
  ),
  2500,
  'spend balance nets out the payout'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000001001', true);

select is(
  (
    select earned_cents::integer
    from public.list_household_kids('00000000-0000-0000-0000-000000001002')
  ),
  10000,
  'earned stays gross lifetime earnings after a payout'
);

select is(
  (
    select spend_cents::integer
    from public.list_household_kids('00000000-0000-0000-0000-000000001002')
  ),
  2500,
  'kids overview spend balance reflects the payout'
);

select * from finish();

rollback;
