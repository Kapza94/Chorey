begin;

select plan(3);

select has_column('public', 'profiles', 'avatar_path', 'profiles store an avatar path');

select is(
  (select public from storage.buckets where id = 'avatars'),
  true,
  'the avatars bucket exists and is public'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users upload their own avatar'
  ),
  'owner-only avatar upload policy exists'
);

select * from finish();
rollback;
