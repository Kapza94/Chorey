begin;

select plan(5);

-- The completion-photo columns exist on chore instances.
select has_column('public', 'chore_instances', 'photo_path',
  'chore_instances has photo_path');
select has_column('public', 'chore_instances', 'photo_uploaded_at',
  'chore_instances has photo_uploaded_at');

-- The bucket exists and is private (no public read — parents read via signed URL).
select is(
  (select count(*)::int from storage.buckets where id = 'chore-photos'),
  1,
  'chore-photos bucket exists'
);
select is(
  (select public from storage.buckets where id = 'chore-photos'),
  false,
  'chore-photos bucket is private'
);

-- Parents get a SELECT policy on storage.objects for their household's photos.
select is(
  (select count(*)::int
   from pg_policies
   where schemaname = 'storage'
     and tablename = 'objects'
     and policyname = 'Household members read chore photos'),
  1,
  'household read policy exists on storage.objects'
);

select * from finish();

rollback;
