begin;

select plan(2);

-- Two unrelated households, each with its own parent.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000a0001', 'photo-a@example.com'),
  ('00000000-0000-0000-0000-0000000b0001', 'photo-b@example.com');

insert into public.households (id, owner_user_id, name) values
  ('00000000-0000-0000-0000-0000000a0002', '00000000-0000-0000-0000-0000000a0001', 'A home'),
  ('00000000-0000-0000-0000-0000000b0002', '00000000-0000-0000-0000-0000000b0001', 'B home');

insert into public.household_members (household_id, user_id, role) values
  ('00000000-0000-0000-0000-0000000a0002', '00000000-0000-0000-0000-0000000a0001', 'parent_admin'),
  ('00000000-0000-0000-0000-0000000b0002', '00000000-0000-0000-0000-0000000b0001', 'parent_admin');

-- One completion photo per household, foldered by household id.
insert into storage.objects (bucket_id, name) values
  ('chore-photos', '00000000-0000-0000-0000-0000000a0002/chore-a.jpg'),
  ('chore-photos', '00000000-0000-0000-0000-0000000b0002/chore-b.jpg');

-- Act as parent A.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000a0001","role":"authenticated"}',
  true
);

-- Parent A sees exactly one photo...
select is(
  (select count(*)::int from storage.objects where bucket_id = 'chore-photos'),
  1,
  'parent A sees only their own household photo'
);

-- ...and it's their household's, never household B's.
select is(
  (select (storage.foldername(name))[1]
   from storage.objects where bucket_id = 'chore-photos'),
  '00000000-0000-0000-0000-0000000a0002',
  'the visible photo belongs to household A, not B'
);

select * from finish();

rollback;
