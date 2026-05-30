begin;

select plan(18);

select has_table('public', 'settlement_periods', 'settlement periods table exists');
select has_table('public', 'settlement_bucket_statuses', 'settlement bucket statuses table exists');

select has_column('public', 'settlement_periods', 'household_id', 'settlement periods belong to households');
select has_column('public', 'settlement_periods', 'frequency', 'settlement periods store frequency');
select has_column('public', 'settlement_periods', 'starts_on', 'settlement periods have start date');
select has_column('public', 'settlement_periods', 'ends_on', 'settlement periods have end date');
select has_column('public', 'settlement_bucket_statuses', 'bucket', 'settlement statuses store bucket');
select has_column('public', 'settlement_bucket_statuses', 'status', 'settlement statuses store status');

select ok(
  to_regtype('public.settlement_bucket_status') is not null,
  'settlement bucket status enum exists'
);

select ok(
  exists (
    select 1
    from pg_proc
    join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'public'
      and pg_proc.proname = 'ensure_active_settlement_period'
  ),
  'active settlement period function exists'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.settlement_periods'::regclass),
  true,
  'settlement periods has RLS enabled'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.settlement_bucket_statuses'::regclass),
  true,
  'settlement bucket statuses has RLS enabled'
);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000501', 'settlement-parent@example.com');

insert into public.households (id, owner_user_id, name, settlement_frequency)
values (
  '00000000-0000-0000-0000-000000000601',
  '00000000-0000-0000-0000-000000000501',
  'Settlement home',
  'weekly'
);

insert into public.household_members (household_id, user_id, role)
values (
  '00000000-0000-0000-0000-000000000601',
  '00000000-0000-0000-0000-000000000501',
  'parent_admin'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000501', true);

select is(
  (
    select starts_on::text
    from public.ensure_active_settlement_period(
      '00000000-0000-0000-0000-000000000601',
      '2026-05-30'
    )
  ),
  '2026-05-30',
  'weekly active settlement starts on requested date'
);

select is(
  (
    select ends_on::text
    from public.ensure_active_settlement_period(
      '00000000-0000-0000-0000-000000000601',
      '2026-05-30'
    )
  ),
  '2026-06-05',
  'weekly active settlement lasts seven days'
);

select is(
  (
    select count(*)::integer
    from public.settlement_bucket_statuses status
    join public.settlement_periods period
      on period.id = status.settlement_period_id
    where period.household_id = '00000000-0000-0000-0000-000000000601'
  ),
  3,
  'active settlement creates three independent bucket statuses'
);

update public.settlement_bucket_statuses
set status = 'settled'
where settlement_period_id = (
  select id
  from public.settlement_periods
  where household_id = '00000000-0000-0000-0000-000000000601'
);

select is(
  (
    select count(*)::integer
    from public.settlement_bucket_statuses status
    join public.settlement_periods period
      on period.id = status.settlement_period_id
    where period.household_id = '00000000-0000-0000-0000-000000000601'
      and status.status = 'pending'
  ),
  0,
  'settling a period marks every bucket settled'
);

update public.households
set settlement_frequency = 'monthly'
where id = '00000000-0000-0000-0000-000000000601';

select is(
  (
    select frequency::text
    from public.ensure_active_settlement_period(
      '00000000-0000-0000-0000-000000000601',
      '2026-06-01'
    )
  ),
  'weekly',
  'frequency changes do not alter the current active period'
);

select is(
  (
    select ends_on::text
    from public.ensure_active_settlement_period(
      '00000000-0000-0000-0000-000000000601',
      '2026-06-01'
    )
  ),
  '2026-06-05',
  'frequency changes keep the current active period end date'
);

select * from finish();

rollback;
