-- Design data model: family locale + configurable split, per-kid budget cap +
-- cadence, and off-app payout records. Adopted from the Chorey design handoff.

-- 1. Household locale (country -> currency) and the 40/40/20 split (per family).
alter table public.households
  add column country text,
  add column currency text not null default 'USD',
  add column split_spend smallint not null default 40,
  add column split_save smallint not null default 40,
  add column split_give smallint not null default 20;

alter table public.households
  add constraint households_split_nonneg
  check (split_spend >= 0 and split_save >= 0 and split_give >= 0);

alter table public.households
  add constraint households_split_sums_100
  check (split_spend + split_save + split_give = 100);

-- 2. Per-kid budget cap + cadence, plus the onboarding profile bits (age, tone).
--    Reuses the existing weekly|monthly enum for cadence.
alter table public.child_profiles
  add column age smallint check (age is null or (age >= 0 and age <= 25)),
  add column tone text,
  add column budget_cents integer not null default 2500 check (budget_cents >= 0),
  add column cadence public.settlement_frequency not null default 'weekly';

-- 3. Off-app payouts. There is NO in-app money movement — parents pay directly
--    (cash / bank transfer / other) and Chorey just records it.
create type public.payout_method as enum ('cash', 'bank_transfer', 'other');

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  method public.payout_method not null default 'cash',
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.payouts enable row level security;

-- Parent admins can edit household financial settings (split, country, currency).
create policy "parent admins can update households"
on public.households
for update
to authenticated
using (
  exists (
    select 1
    from public.household_members member
    where member.household_id = households.id
      and member.user_id = auth.uid()
      and member.role = 'parent_admin'
  )
)
with check (
  exists (
    select 1
    from public.household_members member
    where member.household_id = households.id
      and member.user_id = auth.uid()
      and member.role = 'parent_admin'
  )
);

-- Parent admins can edit per-kid budget / cadence / profile.
create policy "parent admins can update child profiles"
on public.child_profiles
for update
to authenticated
using (
  exists (
    select 1
    from public.household_members member
    where member.household_id = child_profiles.household_id
      and member.user_id = auth.uid()
      and member.role = 'parent_admin'
  )
)
with check (
  exists (
    select 1
    from public.household_members member
    where member.household_id = child_profiles.household_id
      and member.user_id = auth.uid()
      and member.role = 'parent_admin'
  )
);

create policy "household members can read payouts"
on public.payouts
for select
to authenticated
using (
  exists (
    select 1
    from public.household_members member
    where member.household_id = payouts.household_id
      and member.user_id = auth.uid()
  )
);

create policy "parent admins can record payouts"
on public.payouts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.household_members member
    where member.household_id = payouts.household_id
      and member.user_id = auth.uid()
      and member.role = 'parent_admin'
  )
);

grant select, insert on public.payouts to authenticated;
