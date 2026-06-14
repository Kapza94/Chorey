begin;

select plan(15);

select has_table('public', 'household_entitlements', 'household entitlements table exists');
select has_column('public', 'household_entitlements', 'status', 'entitlement has status');
select has_column('public', 'household_entitlements', 'revenuecat_customer_id', 'entitlement stores RevenueCat customer id');
select has_column('public', 'household_entitlements', 'plan', 'entitlement stores the chosen billing plan');
select has_column('public', 'household_entitlements', 'trial_ends_at', 'entitlement stores the trial end');

select ok(
  to_regtype('public.subscription_status') is not null,
  'subscription status enum exists'
);

select ok(
  to_regtype('public.subscription_plan') is not null,
  'subscription plan enum exists'
);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000901', 'entitlements-parent@example.com');

insert into public.households (id, owner_user_id, name)
values (
  '00000000-0000-0000-0000-000000000902',
  '00000000-0000-0000-0000-000000000901',
  'Entitlement home'
);

insert into public.household_members (household_id, user_id, role)
values (
  '00000000-0000-0000-0000-000000000902',
  '00000000-0000-0000-0000-000000000901',
  'parent_admin'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000901', true);

-- Subscription-only: a new household starts a 14-day full-feature trial
-- automatically — there is no entitlement-less (free) state.
select is(
  (
    select status::text
    from public.household_entitlements
    where household_id = '00000000-0000-0000-0000-000000000902'
  ),
  'trialing',
  'new household starts trialing automatically'
);

select ok(
  (
    select trial_ends_at > now() + interval '13 days'
    from public.household_entitlements
    where household_id = '00000000-0000-0000-0000-000000000902'
  ),
  'trial runs 14 days from household creation'
);

update public.household_entitlements
set status = 'active',
    plan = 'yearly',
    revenuecat_customer_id = 'rc_customer_1'
where household_id = '00000000-0000-0000-0000-000000000902';

select is(
  (
    select status::text || '/' || plan::text
    from public.household_entitlements
    where household_id = '00000000-0000-0000-0000-000000000902'
  ),
  'active/yearly',
  'entitlement applies to the household with the chosen plan'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'household_entitlements'
      and policyname = 'household members can read entitlements'
  ),
  'entitlement read policy exists'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.household_entitlements'::regclass),
  true,
  'household entitlements has RLS enabled'
);

select ok(
  has_table_privilege('authenticated', 'public.household_entitlements', 'SELECT'),
  'authenticated can select household entitlements through RLS'
);

select ok(
  not has_table_privilege('authenticated', 'public.household_entitlements', 'INSERT'),
  'authenticated clients cannot write entitlements directly'
);

-- Weekly is a first-class plan (added after the initial monthly/yearly enum).
select ok(
  'weekly' = any (enum_range(null::public.subscription_plan)::text[]),
  'weekly is a valid subscription plan'
);

select * from finish();

rollback;
