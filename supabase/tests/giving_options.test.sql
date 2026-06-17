begin;

select plan(16);

select has_table('public', 'giving_options', 'giving options table exists');
select has_table('public', 'giving_suggestions', 'giving suggestions table exists');

select has_column('public', 'giving_options', 'name', 'giving options have names');
select has_column('public', 'giving_suggestions', 'status', 'giving suggestions have status');

select ok(
  to_regtype('public.giving_suggestion_status') is not null,
  'giving suggestion status enum exists'
);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000801', 'giving-parent@example.com');

insert into public.households (id, owner_user_id, name)
values (
  '00000000-0000-0000-0000-000000000802',
  '00000000-0000-0000-0000-000000000801',
  'Giving home'
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

insert into public.child_access_codes (
  child_profile_id,
  household_id,
  access_code,
  created_by_user_id
)
values (
  '00000000-0000-0000-0000-000000000803',
  '00000000-0000-0000-0000-000000000802',
  'CHOREY-GIVE0001',
  '00000000-0000-0000-0000-000000000801'
);

select is(
  (
    select name
    from public.suggest_giving_option('CHOREY-GIVE0001', ' Animal shelter ')
  ),
  'Animal shelter',
  'child can suggest giving option'
);

select is(
  (select count(*)::integer from public.list_child_giving_options('CHOREY-GIVE0001')),
  0,
  'pending suggestion is not selectable'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000801', true);

select is(
  (
    select name
    from public.list_household_giving_suggestions('00000000-0000-0000-0000-000000000802')
  ),
  'Animal shelter',
  'parent can list giving suggestions'
);

select is(
  (
    select name
    from public.approve_giving_suggestion(
      '00000000-0000-0000-0000-000000000802',
      (select id from public.giving_suggestions limit 1)
    )
  ),
  'Animal shelter',
  'parent can approve giving suggestion'
);

select is(
  (
    select status::text
    from public.giving_suggestions
    limit 1
  ),
  'approved',
  'approved suggestion is marked approved'
);

select is(
  (select count(*)::integer from public.list_child_giving_options('CHOREY-GIVE0001')),
  1,
  'approved giving option is selectable'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.giving_options'::regclass),
  true,
  'giving options has RLS enabled'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.giving_suggestions'::regclass),
  true,
  'giving suggestions has RLS enabled'
);

select ok(
  exists (
    select 1
    from pg_proc
    join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'public'
      and pg_proc.proname = 'suggest_giving_option'
  ),
  'giving suggest function exists'
);

select ok(
  exists (
    select 1
    from pg_proc
    join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'public'
      and pg_proc.proname = 'approve_giving_suggestion'
  ),
  'giving approval function exists'
);

-- A parent admin can seed a giving option directly (onboarding charities),
-- exercised under RLS as the authenticated parent (not the superuser).
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000801', true);

select lives_ok(
  $$ insert into public.giving_options (household_id, name)
     values ('00000000-0000-0000-0000-000000000802', 'City Food Bank') $$,
  'parent admin can seed a giving option directly'
);

reset role;

select * from finish();

rollback;
