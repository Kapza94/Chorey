begin;

select plan(8);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-0000000e0001', 'wish-parent@example.com');

insert into public.households (id, owner_user_id, name)
values (
  '00000000-0000-0000-0000-0000000e0002',
  '00000000-0000-0000-0000-0000000e0001',
  'Wish home'
);

insert into public.household_members (household_id, user_id, role)
values (
  '00000000-0000-0000-0000-0000000e0002',
  '00000000-0000-0000-0000-0000000e0001',
  'parent_admin'
);

insert into public.child_profiles (id, household_id, display_name)
values ('00000000-0000-0000-0000-0000000e0003', '00000000-0000-0000-0000-0000000e0002', 'Mia');

insert into public.child_access_codes (child_profile_id, household_id, access_code, created_by_user_id)
values (
  '00000000-0000-0000-0000-0000000e0003',
  '00000000-0000-0000-0000-0000000e0002',
  'CHOREY-WISH0001',
  '00000000-0000-0000-0000-0000000e0001'
);

insert into public.wishlist_items (id, household_id, child_profile_id, name, target_cents)
values (
  '00000000-0000-0000-0000-0000000e0010',
  '00000000-0000-0000-0000-0000000e0002',
  '00000000-0000-0000-0000-0000000e0003',
  'Skateboard',
  6500
);

-- A second child (same household) and an outsider parent (different household)
-- to prove isolation.
insert into public.child_profiles (id, household_id, display_name)
values ('00000000-0000-0000-0000-0000000e0004', '00000000-0000-0000-0000-0000000e0002', 'Theo');

insert into public.child_access_codes (child_profile_id, household_id, access_code, created_by_user_id)
values (
  '00000000-0000-0000-0000-0000000e0004',
  '00000000-0000-0000-0000-0000000e0002',
  'CHOREY-WISH0002',
  '00000000-0000-0000-0000-0000000e0001'
);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-0000000e0009', 'wish-outsider@example.com');

insert into public.households (id, owner_user_id, name)
values ('00000000-0000-0000-0000-0000000e000a', '00000000-0000-0000-0000-0000000e0009', 'Other home');

insert into public.household_members (household_id, user_id, role)
values (
  '00000000-0000-0000-0000-0000000e000a',
  '00000000-0000-0000-0000-0000000e0009',
  'parent_admin'
);

-- The child posts a note on their wish (security-definer RPC, access-code keyed).
select lives_ok(
  $$ select public.add_wish_note('CHOREY-WISH0001', '00000000-0000-0000-0000-0000000e0010', '  Can I get this? ') $$,
  'child can add a note to their own wish'
);

select is(
  (select author_kind from public.wish_notes where wishlist_item_id = '00000000-0000-0000-0000-0000000e0010'),
  'child',
  'the note is attributed to the child and trimmed'
);

-- The parent replies under RLS/auth.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000e0001', true);

select lives_ok(
  $$ select public.add_parent_wish_note('00000000-0000-0000-0000-0000000e0010', 'Finish your chores first') $$,
  'parent can reply on a wish in their household'
);

reset role;

-- now() is frozen within a transaction, so the child-seen mark and the parent
-- note's created_at would tie. Push the seen mark into the past so the parent
-- note genuinely reads as newer (mirrors real life: the parent replied later).
update public.wishlist_items
set child_notes_seen_at = '2000-01-01T00:00:00Z'
where id = '00000000-0000-0000-0000-0000000e0010';

-- The parent reply is unseen by the child, so the wish flags has_unread.
select is(
  (select has_unread from public.list_child_wishlist_items('CHOREY-WISH0001')
     where id = '00000000-0000-0000-0000-0000000e0010'),
  true,
  'an unseen parent note flags the wish as unread for the child'
);

-- Reading the thread returns both notes and clears the child's unread mark.
select is(
  (select count(*) from public.list_wish_notes('CHOREY-WISH0001', '00000000-0000-0000-0000-0000000e0010')),
  2::bigint,
  'the thread returns both notes in order'
);

select is(
  (select has_unread from public.list_child_wishlist_items('CHOREY-WISH0001')
     where id = '00000000-0000-0000-0000-0000000e0010'),
  false,
  'opening the thread clears the child unread flag'
);

-- A different child cannot read someone else's wish thread.
select throws_ok(
  $$ select public.list_wish_notes('CHOREY-WISH0002', '00000000-0000-0000-0000-0000000e0010') $$,
  'Wish not found.'
);

-- A parent from another household cannot post on this wish.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000e0009', true);

select throws_ok(
  $$ select public.add_parent_wish_note('00000000-0000-0000-0000-0000000e0010', 'sneaky') $$,
  'Wish not found or not in your household.'
);

reset role;

select * from finish();
rollback;
