begin;

select plan(5);

-- A household with a non-default split: 60 / 30 / 10.
insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000009901', 'split-parent@example.com');

insert into public.households (id, owner_user_id, name, split_spend, split_save, split_give)
values (
  '00000000-0000-0000-0000-000000009902',
  '00000000-0000-0000-0000-000000009901',
  'Split home',
  60, 30, 10
);

insert into public.household_members (household_id, user_id, role)
values (
  '00000000-0000-0000-0000-000000009902',
  '00000000-0000-0000-0000-000000009901',
  'parent_admin'
);

insert into public.child_profiles (id, household_id, display_name)
values (
  '00000000-0000-0000-0000-000000009903',
  '00000000-0000-0000-0000-000000009902',
  'Split kid'
);

-- A $10.00 approved chore should split 60/30/10 → spend 600, savings 300, giving 100.
insert into public.chore_instances (
  id, household_id, child_profile_id, title, reward_cents, status, created_by_user_id
)
values (
  '00000000-0000-0000-0000-000000009904',
  '00000000-0000-0000-0000-000000009902',
  '00000000-0000-0000-0000-000000009903',
  'Split chore',
  1000,
  'submitted',
  '00000000-0000-0000-0000-000000009901'
);

update public.chore_instances
set status = 'approved'
where id = '00000000-0000-0000-0000-000000009904';

select is(
  (select amount_cents from public.ledger_events
   where chore_instance_id = '00000000-0000-0000-0000-000000009904' and bucket = 'spend'),
  600,
  'spend is credited at the household''s 60%, not the old 40%'
);

select is(
  (select amount_cents from public.ledger_events
   where chore_instance_id = '00000000-0000-0000-0000-000000009904' and bucket = 'savings'),
  300,
  'savings is credited at the household''s 30%'
);

select is(
  (select amount_cents from public.ledger_events
   where chore_instance_id = '00000000-0000-0000-0000-000000009904' and bucket = 'giving'),
  100,
  'giving is credited at the household''s 10%'
);

select is(
  (select sum(amount_cents)::integer from public.ledger_events
   where chore_instance_id = '00000000-0000-0000-0000-000000009904'),
  1000,
  'every cent of the reward is distributed'
);

-- Giving has a floor: it can be lowered but never below 10%, even when the
-- split still sums to 100.
select throws_ok(
  $$ update public.households
     set split_spend = 65, split_save = 30, split_give = 5
     where id = '00000000-0000-0000-0000-000000009902' $$,
  '23514',
  null,
  'rejects a split that drops Giving below the 10% floor'
);

select * from finish();
rollback;
