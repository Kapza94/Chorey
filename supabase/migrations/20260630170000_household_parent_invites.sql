-- Co-parent / step-parent sharing.
--
-- Security model:
-- - One household may have at most 4 parent_admin members total.
-- - Pending invites reserve seats, so a household cannot invite past capacity.
-- - At most 3 pending invites may exist at once.
-- - At most 5 invite creations per household per day, even if cancelled.
-- - Raw tokens are returned once and never stored; DB stores SHA-256 hashes.
-- - Accepting requires a signed-in parent whose auth email matches the invite.

create table public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  email text not null check (position('@' in email) > 1),
  role public.household_role not null default 'parent_admin' check (role = 'parent_admin'),
  token_hash text not null unique,
  created_by_user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  accepted_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  cancelled_at timestamptz,
  constraint household_invites_done_once check (
    not (accepted_at is not null and cancelled_at is not null)
  )
);

create index household_invites_household_idx
  on public.household_invites (household_id, created_at desc);

create index household_invites_active_email_idx
  on public.household_invites (household_id, email)
  where accepted_at is null and cancelled_at is null;

alter table public.household_invites enable row level security;

create policy "parent admins can read household invites"
on public.household_invites
for select
to authenticated
using (
  exists (
    select 1
    from public.household_members member
    where member.household_id = household_invites.household_id
      and member.user_id = auth.uid()
      and member.role = 'parent_admin'
  )
);

grant select on public.household_invites to authenticated;

create or replace function public.household_invite_status(
  input_accepted_at timestamptz,
  input_cancelled_at timestamptz,
  input_expires_at timestamptz
)
returns text
language sql
stable
as $$
  select case
    when input_accepted_at is not null then 'accepted'
    when input_cancelled_at is not null then 'cancelled'
    when input_expires_at <= now() then 'expired'
    else 'pending'
  end
$$;

revoke execute on function public.household_invite_status(timestamptz, timestamptz, timestamptz) from public, anon;
grant execute on function public.household_invite_status(timestamptz, timestamptz, timestamptz) to authenticated;

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
  raw_token text := encode(extensions.gen_random_bytes(32), 'hex');
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
    encode(extensions.digest(raw_token, 'sha256'), 'hex'),
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
    raw_token;
end;
$$;

revoke execute on function public.create_household_invite(uuid, text) from public, anon;
grant execute on function public.create_household_invite(uuid, text) to authenticated;

create or replace function public.list_household_invites(input_household_id uuid)
returns table (
  id uuid,
  email text,
  role public.household_role,
  status text,
  expires_at timestamptz,
  created_at timestamptz,
  accepted_at timestamptz,
  cancelled_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    invite.id,
    invite.email,
    invite.role,
    public.household_invite_status(invite.accepted_at, invite.cancelled_at, invite.expires_at) as status,
    invite.expires_at,
    invite.created_at,
    invite.accepted_at,
    invite.cancelled_at
  from public.household_invites invite
  where invite.household_id = input_household_id
    and exists (
      select 1
      from public.household_members member
      where member.household_id = invite.household_id
        and member.user_id = auth.uid()
        and member.role = 'parent_admin'
    )
  order by invite.created_at desc
$$;

revoke execute on function public.list_household_invites(uuid) from public, anon;
grant execute on function public.list_household_invites(uuid) to authenticated;

create or replace function public.cancel_household_invite(
  input_household_id uuid,
  input_invite_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.household_invites invite
  set cancelled_at = now()
  where invite.id = input_invite_id
    and invite.household_id = input_household_id
    and invite.accepted_at is null
    and invite.cancelled_at is null
    and exists (
      select 1
      from public.household_members member
      where member.household_id = invite.household_id
        and member.user_id = auth.uid()
        and member.role = 'parent_admin'
    );

  if not found then
    raise exception 'Invite not found or already closed.';
  end if;
end;
$$;

revoke execute on function public.cancel_household_invite(uuid, uuid) from public, anon;
grant execute on function public.cancel_household_invite(uuid, uuid) to authenticated;

create or replace function public.accept_household_invite(input_token text)
returns table (household_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  caller_email text;
  invite_row public.household_invites;
  active_parent_count integer;
begin
  if caller is null then
    raise exception 'You must be signed in to accept an invite.';
  end if;

  select lower(email) into caller_email
  from auth.users
  where id = caller;

  select *
  into invite_row
  from public.household_invites invite
  where invite.token_hash = encode(extensions.digest(trim(coalesce(input_token, '')), 'sha256'), 'hex')
    and invite.accepted_at is null
    and invite.cancelled_at is null
    and invite.expires_at > now()
  for update;

  if not found then
    raise exception 'Invite not found or expired.';
  end if;

  if caller_email is null or caller_email <> invite_row.email then
    raise exception 'Invite must be accepted by the invited email address.';
  end if;

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
