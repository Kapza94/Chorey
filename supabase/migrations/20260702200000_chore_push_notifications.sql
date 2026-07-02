-- Chore-loop push notifications, sent from the database via pg_net so they
-- fire no matter which device (parent app, kid app, RPC) performed the action:
--
--   1. parent creates a chore        → child:  "New chore for you"
--   2. child submits a chore         → parents: "<kid> finished a chore"
--   3. parent approves               → child:  "Cha-ching! ... approved"
--      parent sends back             → child:  "One more look ..."
--
-- Every notify path swallows its own errors: a push must never break the
-- chore action it rides on. Delivery is fire-and-forget through Expo's push
-- API (no auth needed; tokens themselves are the capability).
--
-- Also fixes register_child_push_token, which still normalized codes with the
-- pre-CHOREY digits-only rule — kids joining with CHOREY-XXXXXXXX codes were
-- silently never registered for reminders.

create extension if not exists pg_net;

-- ---------------------------------------------------------------------------
-- Delivery helpers
-- ---------------------------------------------------------------------------

/** POST a batch of Expo push messages. Never raises. */
create or replace function public.send_expo_push(messages jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if messages is null or jsonb_array_length(messages) = 0 then
    return;
  end if;

  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    body := messages,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
exception when others then
  null; -- a failed push must never fail the transaction that caused it
end;
$$;

revoke execute on function public.send_expo_push(jsonb) from public, anon, authenticated;

/** Push to every device a child has registered. Never raises. */
create or replace function public.push_to_child(
  input_child uuid,
  input_title text,
  input_body text,
  input_data jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.send_expo_push(
    (
      select jsonb_agg(jsonb_build_object(
        'to', t.token,
        'sound', 'default',
        'title', input_title,
        'body', input_body,
        'data', input_data
      ))
      from public.push_tokens t
      where t.child_profile_id = input_child
    )
  );
exception when others then
  null;
end;
$$;

revoke execute on function public.push_to_child(uuid, text, text, jsonb) from public, anon, authenticated;

/** Push to every parent device in a household. Never raises. */
create or replace function public.push_to_household_parents(
  input_household uuid,
  input_title text,
  input_body text,
  input_data jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.send_expo_push(
    (
      select jsonb_agg(jsonb_build_object(
        'to', t.token,
        'sound', 'default',
        'title', input_title,
        'body', input_body,
        'data', input_data
      ))
      from public.push_tokens t
      join public.household_members m on m.user_id = t.user_id
      where m.household_id = input_household
        and m.role = 'parent_admin'
    )
  );
exception when others then
  null;
end;
$$;

revoke execute on function public.push_to_household_parents(uuid, text, text, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1. New chore → child
--    One-off instances (template_id null) and new recurring templates each
--    notify once. Recurring period rollovers stay silent — a Monday refresh
--    creating five instances must not fire five pings.
-- ---------------------------------------------------------------------------

create or replace function public.notify_child_chore_assigned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.push_to_child(
    new.child_profile_id,
    'New chore for you 🧸',
    new.title || ' just landed on your list.',
    jsonb_build_object('type', 'chore_assigned')
  );
  return new;
end;
$$;

drop trigger if exists notify_child_on_oneoff_chore on public.chore_instances;
create trigger notify_child_on_oneoff_chore
after insert on public.chore_instances
for each row
when (new.status = 'assigned' and new.template_id is null)
execute function public.notify_child_chore_assigned();

drop trigger if exists notify_child_on_new_template on public.chore_templates;
create trigger notify_child_on_new_template
after insert on public.chore_templates
for each row
execute function public.notify_child_chore_assigned();

-- ---------------------------------------------------------------------------
-- 2. Chore submitted → parents   /  3. approved or sent back → child
-- ---------------------------------------------------------------------------

create or replace function public.notify_chore_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  kid_name text;
begin
  if new.status = 'submitted' and old.status in ('assigned', 'sent_back') then
    select display_name into kid_name
    from public.child_profiles where id = new.child_profile_id;

    perform public.push_to_household_parents(
      new.household_id,
      coalesce(kid_name, 'Your child') || ' finished a chore',
      '“' || new.title || '” is waiting for your OK.',
      jsonb_build_object('type', 'chore_submitted', 'choreId', new.id)
    );
  elsif new.status = 'approved' and old.status = 'submitted' then
    perform public.push_to_child(
      new.child_profile_id,
      'Cha-ching! 💰',
      '“' || new.title || '” was approved — the money is in your buckets.',
      jsonb_build_object('type', 'chore_approved', 'choreId', new.id)
    );
  elsif new.status = 'sent_back' and old.status = 'submitted' then
    perform public.push_to_child(
      new.child_profile_id,
      'One more look 👀',
      '“' || new.title || '” came back — finish it up and send it again.',
      jsonb_build_object('type', 'chore_sent_back', 'choreId', new.id)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists notify_on_chore_status_change on public.chore_instances;
create trigger notify_on_chore_status_change
after update of status on public.chore_instances
for each row
when (old.status is distinct from new.status)
execute function public.notify_chore_status_change();

-- ---------------------------------------------------------------------------
-- Parent device registration (mirrors the child RPC; parents are
-- authenticated so auth.uid() is the key).
-- ---------------------------------------------------------------------------

create or replace function public.register_parent_push_token(
  input_token text,
  input_platform text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'You must be signed in to register for notifications.';
  end if;

  insert into public.push_tokens (user_id, token, platform)
  values (caller, input_token, input_platform)
  on conflict (token) do update
    set user_id = excluded.user_id,
        child_profile_id = null,
        platform = excluded.platform,
        updated_at = now();
end;
$$;

revoke execute on function public.register_parent_push_token(text, text) from public, anon;
grant execute on function public.register_parent_push_token(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Fix: child token registration must accept CHOREY-XXXXXXXX codes.
-- ---------------------------------------------------------------------------

create or replace function public.register_child_push_token(
  input_access_code text,
  input_token text,
  input_platform text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_child uuid;
begin
  select code.child_profile_id
  into resolved_child
  from public.child_access_codes code
  where code.access_code = public.normalize_access_code(input_access_code)
  limit 1;

  if resolved_child is null then
    raise exception 'Unknown access code.';
  end if;

  insert into public.push_tokens (child_profile_id, token, platform)
  values (resolved_child, input_token, input_platform)
  on conflict (token) do update
    set child_profile_id = excluded.child_profile_id,
        platform = excluded.platform,
        user_id = null,
        updated_at = now();
end;
$$;

grant execute on function public.register_child_push_token(text, text, text)
  to anon, authenticated;
