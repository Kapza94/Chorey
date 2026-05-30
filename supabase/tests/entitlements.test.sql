begin;

select plan(11);

select has_table('public', 'household_entitlements', 'household entitlements table exists');
select has_column('public', 'household_entitlements', 'status', 'entitlement has status');
select has_column('public', 'household_entitlements', 'revenuecat_customer_id', 'entitlement stores RevenueCat customer id');

select ok(
  to_regtype('public.subscription_status') is not null,
  'subscription status enum exists'
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

insert into public.household_entitlements (
  household_id,
  revenuecat_customer_id,
  status
)
values (
  '00000000-0000-0000-0000-000000000902',
  'rc_customer_1',
  'active'
);

select is(
  (
    select status::text
    from public.household_entitlements
    where household_id = '00000000-0000-0000-0000-000000000902'
  ),
  'active',
  'paid entitlement applies to household'
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

select ok(
  not has_table_privilege('anon', 'public.household_entitlements', 'SELECT'),
  'anon cannot read entitlements'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.household_entitlements'::regclass
      and contype = 'p'
  ),
  'entitlements have primary key'
);

select * from finish();

rollback;
