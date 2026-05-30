create type public.chore_status as enum (
  'assigned',
  'submitted',
  'approved',
  'sent_back'
);

create table public.chore_instances (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  title text not null,
  reward_cents integer not null check (reward_cents >= 0),
  status public.chore_status not null default 'assigned',
  created_by_user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.chore_instances enable row level security;

create policy "household members can read chores"
on public.chore_instances
for select
to authenticated
using (
  exists (
    select 1
    from public.household_members member
    where member.household_id = chore_instances.household_id
      and member.user_id = auth.uid()
  )
);

create policy "parent admins can create chores"
on public.chore_instances
for insert
to authenticated
with check (
  created_by_user_id = auth.uid()
  and exists (
    select 1
    from public.household_members member
    where member.household_id = chore_instances.household_id
      and member.user_id = auth.uid()
      and member.role = 'parent_admin'
  )
  and exists (
    select 1
    from public.child_profiles child
    where child.id = chore_instances.child_profile_id
      and child.household_id = chore_instances.household_id
  )
);

grant select, insert on public.chore_instances to authenticated;
