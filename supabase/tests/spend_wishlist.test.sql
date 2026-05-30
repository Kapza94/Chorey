begin;

select plan(21);

select has_table('public', 'wishlist_items', 'wishlist items table exists');
select has_table('public', 'purchase_requests', 'purchase requests table exists');

select has_column('public', 'wishlist_items', 'target_cents', 'wishlist item has target cents');
select has_column('public', 'wishlist_items', 'status', 'wishlist item has status');
select has_column('public', 'purchase_requests', 'status', 'purchase request has status');

select ok(
  to_regtype('public.wishlist_item_status') is not null,
  'wishlist item status enum exists'
);

select ok(
  to_regtype('public.purchase_request_status') is not null,
  'purchase request status enum exists'
);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000701', 'wishlist-parent@example.com');

insert into public.households (id, owner_user_id, name)
values (
  '00000000-0000-0000-0000-000000000702',
  '00000000-0000-0000-0000-000000000701',
  'Wishlist home'
);

insert into public.household_members (household_id, user_id, role)
values (
  '00000000-0000-0000-0000-000000000702',
  '00000000-0000-0000-0000-000000000701',
  'parent_admin'
);

insert into public.child_profiles (id, household_id, display_name)
values (
  '00000000-0000-0000-0000-000000000703',
  '00000000-0000-0000-0000-000000000702',
  'Mina'
);

insert into public.child_access_codes (
  child_profile_id,
  household_id,
  access_code,
  created_by_user_id
)
values (
  '00000000-0000-0000-0000-000000000703',
  '00000000-0000-0000-0000-000000000702',
  '123456',
  '00000000-0000-0000-0000-000000000701'
);

select is(
  (
    select name
    from public.create_child_wishlist_item('123456', ' Football ', 2500)
  ),
  'Football',
  'child can create wishlist item'
);

select is(
  (
    select count(*)::integer
    from public.list_child_wishlist_items('123456')
  ),
  1,
  'child can list own wishlist items'
);

select throws_ok(
  $$ select * from public.request_wishlist_purchase('123456', (select id from public.wishlist_items limit 1)) $$,
  'P0001',
  'Spend balance is too low.',
  'purchase request requires enough spend balance'
);

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
  '00000000-0000-0000-0000-000000000704',
  '00000000-0000-0000-0000-000000000702',
  '00000000-0000-0000-0000-000000000703',
  'Big chore',
  10000,
  'submitted',
  '00000000-0000-0000-0000-000000000701'
);

update public.chore_instances
set status = 'approved'
where id = '00000000-0000-0000-0000-000000000704';

select is(
  (
    select status::text
    from public.request_wishlist_purchase('123456', (select id from public.wishlist_items limit 1))
  ),
  'pending',
  'child can request purchase when spend balance covers target'
);

select is(
  (
    select status::text
    from public.wishlist_items
    limit 1
  ),
  'requested',
  'purchase request marks wishlist item requested'
);

select is(
  (select count(*)::integer from public.purchase_requests),
  1,
  'purchase request is recorded'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000701', true);

select is(
  (
    select item_name
    from public.list_household_purchase_requests('00000000-0000-0000-0000-000000000702')
  ),
  'Football',
  'parent can list household purchase requests'
);

select is(
  (
    select status::text
    from public.approve_purchase_request(
      '00000000-0000-0000-0000-000000000702',
      (select id from public.purchase_requests limit 1)
    )
  ),
  'approved',
  'parent can approve purchase request'
);

select is(
  (
    select status::text
    from public.wishlist_items
    limit 1
  ),
  'purchased',
  'approved purchase marks wishlist item purchased'
);

select is(
  (
    select sum(amount_cents)::integer
    from public.ledger_events
    where bucket = 'spend'
      and child_profile_id = '00000000-0000-0000-0000-000000000703'
  ),
  1500,
  'approved purchase deducts from spend ledger balance'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.wishlist_items'::regclass),
  true,
  'wishlist items has RLS enabled'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.purchase_requests'::regclass),
  true,
  'purchase requests has RLS enabled'
);

select ok(
  exists (
    select 1
    from pg_proc
    join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'public'
      and pg_proc.proname = 'create_child_wishlist_item'
  ),
  'wishlist create function exists'
);

select ok(
  exists (
    select 1
    from pg_proc
    join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'public'
      and pg_proc.proname = 'request_wishlist_purchase'
  ),
  'purchase request function exists'
);

select * from finish();

rollback;
