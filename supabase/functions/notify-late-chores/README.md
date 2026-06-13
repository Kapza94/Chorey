# notify-late-chores

Sends an Expo push to a child when a recurring chore has gone late and they
still haven't done it. Idempotent: each overdue `chore_instances` row is stamped
`late_notified_at` so it is never pinged twice.

## Prerequisites

1. **EAS project id** — push tokens require one. Run `eas init`, which adds
   `extra.eas.projectId` to `app.json`. Until then the client registers no
   token and this function simply finds nothing to send.
2. **Migration applied** — `supabase/migrations/20260613150000_push_notifications.sql`
   (creates `push_tokens`, `register_child_push_token`, `get_late_chores_to_notify`,
   and `chore_instances.late_notified_at`).
3. **A device build** — remote push doesn't work in Expo Go; use an EAS dev
   build or TestFlight/Play build.

## Deploy

```bash
supabase functions deploy notify-late-chores --no-verify-jwt
```

It reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the function
environment (both are injected automatically for deployed functions).

## Schedule

Run it on a cron. Two options:

- **Supabase scheduled functions** (dashboard → Edge Functions → Schedules).
- **pg_cron + pg_net**, e.g. hourly:

```sql
select cron.schedule(
  'notify-late-chores-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.functions.supabase.co/notify-late-chores',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    )
  );
  $$
);
```

## Test manually

```bash
curl -X POST 'https://<PROJECT_REF>.functions.supabase.co/notify-late-chores' \
  -H 'Authorization: Bearer <SERVICE_ROLE_KEY>'
```

Response: `{ "notified": <chores>, "messages": <devices> }`.
