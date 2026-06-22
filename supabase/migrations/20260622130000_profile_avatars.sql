-- Parent profile photos. A parent can upload an avatar from the account sheet.
-- Avatars are low-sensitivity and shown all over the app, so they live in a
-- PUBLIC bucket (no per-load signing); writes are locked to the owner by path.

alter table public.profiles
  add column if not exists avatar_path text;

-- Public bucket, 5 MB cap, images only. Path is `<user_id>/avatar.<ext>`, so the
-- first folder segment scopes writes to the owner.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- A user may write only objects under their own `<user_id>/` folder.
drop policy if exists "Users upload their own avatar" on storage.objects;
create policy "Users upload their own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update their own avatar" on storage.objects;
create policy "Users update their own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users delete their own avatar" on storage.objects;
create policy "Users delete their own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can read avatars (the bucket is public; this makes the intent explicit).
drop policy if exists "Avatars are publicly readable" on storage.objects;
create policy "Avatars are publicly readable"
on storage.objects
for select
to public
using (bucket_id = 'avatars');
