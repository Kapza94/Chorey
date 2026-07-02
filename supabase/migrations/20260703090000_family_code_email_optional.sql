-- Family codes without email.
--
-- The invite email was only ever a display label: nothing is emailed
-- (delivery is the share sheet) and acceptance is possession of the code.
-- Asking for the co-parent's email was pure friction, so the create RPC
-- now takes just the household id and the email column becomes nullable.

alter table public.household_invites
  alter column email drop not null;

alter table public.household_invites
  drop constraint household_invites_email_check;

drop function if exists public.create_household_invite(uuid, text);

create function public.create_household_invite(
  input_household_id uuid
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
    null,
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

revoke execute on function public.create_household_invite(uuid) from public, anon;
grant execute on function public.create_household_invite(uuid) to authenticated;
