create type public.subscription_status as enum (
  'trialing',
  'active',
  'lapsed'
);

create table public.household_entitlements (
  household_id uuid primary key references public.households(id) on delete cascade,
  revenuecat_customer_id text,
  status public.subscription_status not null,
  current_period_ends_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.household_entitlements enable row level security;

revoke all on public.household_entitlements from anon;
revoke all on public.household_entitlements from authenticated;

create policy "household members can read entitlements"
on public.household_entitlements
for select
to authenticated
using (
  exists (
    select 1
    from public.household_members member
    where member.household_id = household_entitlements.household_id
      and member.user_id = auth.uid()
  )
);

grant select on public.household_entitlements to authenticated;
