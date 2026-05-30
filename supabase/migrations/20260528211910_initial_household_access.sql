create type public.household_role as enum ('parent_admin', 'child');

create type public.settlement_frequency as enum ('weekly', 'monthly');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  settlement_frequency public.settlement_frequency not null default 'weekly',
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.household_role not null,
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.child_profiles enable row level security;

create policy "users can read their own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "users can create their own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "authenticated parents can create households"
on public.households
for insert
to authenticated
with check (owner_user_id = auth.uid());

create policy "household owners can read households"
on public.households
for select
to authenticated
using (owner_user_id = auth.uid());

create policy "household members can read households"
on public.households
for select
to authenticated
using (
  exists (
    select 1
    from public.household_members member
    where member.household_id = households.id
      and member.user_id = auth.uid()
  )
);

create policy "users can read their own memberships"
on public.household_members
for select
to authenticated
using (user_id = auth.uid());

create policy "parents can link themselves as household admins"
on public.household_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and role = 'parent_admin'
  and exists (
    select 1
    from public.households household
    where household.id = household_members.household_id
      and household.owner_user_id = auth.uid()
  )
);

create policy "household members can read child profiles"
on public.child_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.household_members member
    where member.household_id = child_profiles.household_id
      and member.user_id = auth.uid()
  )
);

create policy "parent admins can create child profiles"
on public.child_profiles
for insert
to authenticated
with check (
  exists (
    select 1
    from public.household_members member
    where member.household_id = child_profiles.household_id
      and member.user_id = auth.uid()
      and member.role = 'parent_admin'
  )
);

grant usage on schema public to authenticated;
grant select, insert on public.profiles to authenticated;
grant select, insert on public.households to authenticated;
grant select, insert on public.household_members to authenticated;
grant select, insert on public.child_profiles to authenticated;
