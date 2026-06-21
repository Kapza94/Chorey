# chore-photos

One function, two actions:

- **upload** — a child uploads one photo for a chore they finished. Validates
  the access code, confirms the chore belongs to that child, stores the image at
  `<household_id>/<chore_id>.jpg` in the private `chore-photos` bucket, and
  stamps `chore_instances.photo_path` / `photo_uploaded_at`.
- **purge** — deletes photos older than 30 days and clears their `photo_path`.

Children aren't authenticated Supabase users, so this function (service role) is
the only write path into the bucket — there is no anon write policy. Parents
read their own household's photos directly via a Storage RLS policy (see
`supabase/migrations/20260621120000_chore_completion_photos.sql`).

## Prerequisites

- Migration `20260621120000_chore_completion_photos.sql` applied (adds the
  columns, the bucket, and the parent read policy).

## Deploy

```bash
supabase functions deploy chore-photos --no-verify-jwt
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically. The
purge action authorizes against `SUPABASE_SERVICE_ROLE_KEY`, so there is no
separate secret to set.

## Schedule the purge (pg_cron + pg_net, daily)

```sql
select cron.schedule(
  'purge-chore-photos-daily',
  '0 3 * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.functions.supabase.co/chore-photos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SUPABASE_SERVICE_ROLE_KEY>'
    ),
    body := jsonb_build_object('action', 'purge')
  );
  $$
);
```
