-- Family invite codes.
--
-- The opaque 64-hex invite token had three real-world failures:
--  1. Nothing ever emailed it — delivery is a share sheet, so a human-typeable
--     code (FAM-XXXXXXXX, same shape as kid access codes) beats a long link:
--     it can be texted, read over the phone, or entered from memory.
--  2. Accepting required the signed-in email to equal the invited email —
--     which permanently breaks "Sign in with Apple" + Hide My Email (the relay
--     address never matches). Acceptance is now possession-based, exactly like
--     kid access codes; the invited email stays as a display label only.
--  3. Order of app installs no longer matters: whoever has the code can join
--     after signing in with any method.
--
-- Security posture: codes are single-use, expire in 7 days, respect the
-- 4-parent-seat cap and per-day creation limits, and can only be redeemed by
-- an authenticated user. Hashes (never raw codes) are stored, as before.

-- Normalize whatever the user typed into the canonical hashed form:
-- uppercase, strip separators, tolerate a missing FAM prefix.
create or replace function public.normalize_invite_code(input_code text)
returns text
language sql
immutable
as $$
  select case
    when cleaned ~ '^FAM' then cleaned
    else 'FAM' || cleaned
  end
  from (
    select regexp_replace(upper(coalesce(input_code, '')), '[^A-Z0-9]', '', 'g') as cleaned
  ) c
$$;

revoke execute on function public.normalize_invite_code(text) from public, anon;
grant execute on function public.normalize_invite_code(text) to authenticated;

create or replace function public.create_household_invite(
  input_household_id uuid,
  input_email text
)
returns table (
  id uuid,
  email text,
  role public.household_role,
  status text,
  expires_at timestamptz,
  created_at timestamptz,
  invite_token text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  normalized_email text := lower(trim(coalesce(input_email, '')));
  -- Same generator style as kid access codes (CHOREY-XXXXXXXX).
  raw_code text := 'FAM-' || upper(substr(md5(random()::text || input_household_id::text || clock_timestamp()::text), 1, 8));
  active_parent_count integer;
  active_pending_count integer;
  created_today_count integer;
  inserted public.household_invites;
begin
  if caller is null then
    raise exception 'You must be signed in to invite a parent.';
  end if;

  if position('@' in normalized_email) <= 1 then
    raise exception 'Enter a valid email address.';
  end if;

  if not exists (
    select 1
    from public.household_members member
    where member.household_id = input_household_id
      and member.user_id = caller
      and member.role = 'parent_admin'
  ) then
    raise exception 'Only parent admins can invite parents.';
  end if;

  if not public.household_is_entitled(input_household_id) then
    raise exception 'Parent sharing is included with an active Chorey Family plan.';
  end if;

  select count(*) into active_parent_count
  from public.household_members member
  where member.household_id = input_household_id
    and member.role = 'parent_admin';

  select count(*) into active_pending_count
  from public.household_invites invite
  where invite.household_id = input_household_id
    and invite.accepted_at is null
    and invite.cancelled_at is null
    and invite.expires_at > now();

  if active_pending_count >= 3 then
    raise exception 'This family already has 3 pending parent invites.';
  end if;

  if active_parent_count + active_pending_count >= 4 then
    raise exception 'This family already has 4 parent seats reserved.';
  end if;

  if exists (
    select 1
    from public.household_invites invite
    where invite.household_id = input_household_id
      and invite.email = normalized_email
      and invite.accepted_at is null
      and invite.cancelled_at is null
      and invite.expires_at > now()
  ) then
    raise exception 'That parent already has a pending invite.';
  end if;

  select count(*) into created_today_count
  from public.household_invites invite
  where invite.household_id = input_household_id
    and invite.created_at >= now() - interval '1 day';

  if created_today_count >= 5 then
    raise exception 'Too many invites today. Try again tomorrow.';
  end if;

  insert into public.household_invites (
    household_id,
    email,
    token_hash,
    created_by_user_id
  )
  values (
    input_household_id,
    normalized_email,
    encode(extensions.digest(public.normalize_invite_code(raw_code), 'sha256'), 'hex'),
    caller
  )
  returning * into inserted;

  return query
  select
    inserted.id,
    inserted.email,
    inserted.role,
    public.household_invite_status(inserted.accepted_at, inserted.cancelled_at, inserted.expires_at),
    inserted.expires_at,
    inserted.created_at,
    raw_code;
end;
$$;

revoke execute on function public.create_household_invite(uuid, text) from public, anon;
grant execute on function public.create_household_invite(uuid, text) to authenticated;

create or replace function public.accept_household_invite(input_token text)
returns table (household_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  invite_row public.household_invites;
  active_parent_count integer;
begin
  if caller is null then
    raise exception 'You must be signed in to accept an invite.';
  end if;

  select *
  into invite_row
  from public.household_invites invite
  where invite.token_hash = encode(extensions.digest(public.normalize_invite_code(input_token), 'sha256'), 'hex')
    and invite.accepted_at is null
    and invite.cancelled_at is null
    and invite.expires_at > now()
  for update;

  if not found then
    raise exception 'Invite code not found or expired. Ask for a fresh code.';
  end if;

  -- Possession of the code is the proof (like kid access codes). No email
  -- match: Sign in with Apple's Hide My Email made that check unpassable.

  select count(*) into active_parent_count
  from public.household_members member
  where member.household_id = invite_row.household_id
    and member.role = 'parent_admin';

  if active_parent_count >= 4 then
    raise exception 'This family already has 4 parent accounts.';
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (invite_row.household_id, caller, 'parent_admin')
  on conflict on constraint household_members_pkey do update
  set role = 'parent_admin';

  update public.household_invites invite
  set accepted_at = now(),
      accepted_by_user_id = caller
  where invite.id = invite_row.id;

  return query select invite_row.household_id;
end;
$$;

revoke execute on function public.accept_household_invite(text) from public, anon;
grant execute on function public.accept_household_invite(text) to authenticated;
