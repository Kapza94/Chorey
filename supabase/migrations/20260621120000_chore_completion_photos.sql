-- Chore-completion photos. A child can attach one photo when they finish a
-- chore so the parent can see the work. Photos live in a private Storage bucket
-- and are auto-purged after 30 days (see the chore-photos edge function + its
-- README for the cron). The bytes never go through the DB — the edge function
-- uploads with the service role; here we only record the path and gate reads.

-- One photo per chore instance: the storage path and when it was uploaded.
-- photo_uploaded_at drives the 30-day purge.
alter table public.chore_instances
  add column if not exists photo_path text,
  add column if not exists photo_uploaded_at timestamptz;

-- Private bucket, 5 MB cap, images only. Children upload via the edge function
-- (service role), so no anon write policy is needed — there is no open write
-- endpoint on this bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chore-photos',
  'chore-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Parents read their own household's photos. Path is `<household_id>/<chore_id>.jpg`,
-- so the first folder segment scopes the read to households the user belongs to.
drop policy if exists "Household members read chore photos" on storage.objects;
create policy "Household members read chore photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'chore-photos'
  and exists (
    select 1
    from public.household_members m
    where m.user_id = auth.uid()
      and m.household_id::text = (storage.foldername(name))[1]
  )
);

-- The purge cron and the chore-photos edge function share a token kept in
-- Supabase Vault (created out-of-band on the live project). Only the service
-- role can read it, so the edge function authenticates the cron without a
-- hand-provisioned secret. Returns null when the secret isn't set (purge then
-- 401s harmlessly until it is).
create or replace function public.chore_photos_purge_token()
returns text
language sql
security definer
set search_path = ''
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'chore_photos_purge'
  limit 1
$$;

revoke all on function public.chore_photos_purge_token() from public, anon, authenticated;
grant execute on function public.chore_photos_purge_token() to service_role;
