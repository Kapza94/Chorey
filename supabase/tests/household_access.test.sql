begin;

select plan(35);

select has_table('public', 'households', 'households table exists');
select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'household_members', 'household_members table exists');
select has_table('public', 'child_profiles', 'child_profiles table exists');
select has_table('public', 'chore_instances', 'chore instances table exists');
select has_table('public', 'child_access_codes', 'child access codes table exists');

select has_column('public', 'household_members', 'role', 'household members have roles');
select col_type_is('public', 'household_members', 'role', 'public.household_role', 'roles use household_role enum');

select has_column('public', 'child_profiles', 'household_id', 'child profiles belong to a household');
select has_column('public', 'child_profiles', 'display_name', 'child profiles have display names');
select has_column('public', 'chore_instances', 'reward_cents', 'chore instances have rewards');
select has_column('public', 'chore_instances', 'status', 'chore instances have status');
select has_column('public', 'child_access_codes', 'access_code', 'child access codes have codes');

select is(
  (select relrowsecurity from pg_class where oid = 'public.households'::regclass),
  true,
  'households has RLS enabled'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.household_members'::regclass),
  true,
  'household_members has RLS enabled'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.child_profiles'::regclass),
  true,
  'child_profiles has RLS enabled'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.chore_instances'::regclass),
  true,
  'chore_instances has RLS enabled'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.child_access_codes'::regclass),
  true,
  'child_access_codes has RLS enabled'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'child_profiles'
      and policyname = 'household members can read child profiles'
  ),
  'child profile read policy exists'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'households'
      and policyname = 'authenticated parents can create households'
  ),
  'household insert policy exists'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'households'
      and policyname = 'household owners can read households'
  ),
  'household owner read policy exists'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'household_members'
      and policyname = 'users can read their own memberships'
  ),
  'own membership read policy exists'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'household_members'
      and policyname = 'parents can link themselves as household admins'
  ),
  'self admin membership insert policy exists'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'users can create their own profile'
  ),
  'profile insert policy exists'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'child_profiles'
      and policyname = 'parent admins can create child profiles'
  ),
  'child profile insert policy exists'
);

select isnt(
  (
    select qual
    from pg_policies
    where schemaname = 'public'
      and tablename = 'household_members'
      and policyname = 'users can read their own memberships'
  ),
  null,
  'own membership read policy has a direct predicate'
);

select ok(
  has_table_privilege('authenticated', 'public.households', 'INSERT'),
  'authenticated can insert households through the API'
);

select ok(
  has_table_privilege('authenticated', 'public.households', 'SELECT'),
  'authenticated can select households through the API'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'chore_instances'
      and policyname = 'parent admins can create chores'
  ),
  'parent admin chore insert policy exists'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'chore_instances'
      and policyname = 'parent admins can approve submitted chores'
  ),
  'parent admin chore update policy exists'
);

select ok(
  has_table_privilege('authenticated', 'public.chore_instances', 'UPDATE'),
  'authenticated can update chores through the API'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'child_access_codes'
      and policyname = 'parent admins can create child access codes'
  ),
  'parent admin child access insert policy exists'
);

select ok(
  exists (
    select 1
    from pg_proc
    join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'public'
      and pg_proc.proname = 'resolve_child_access_code'
  ),
  'child access resolver function exists'
);

select ok(
  exists (
    select 1
    from pg_proc
    join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'public'
      and pg_proc.proname = 'list_child_chores'
  ),
  'child chore list function exists'
);

select ok(
  exists (
    select 1
    from pg_proc
    join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'public'
      and pg_proc.proname = 'submit_child_chore'
  ),
  'child chore submit function exists'
);

select * from finish();

rollback;
