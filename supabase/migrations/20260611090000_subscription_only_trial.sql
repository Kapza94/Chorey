-- Chorey is subscription-only (one Chorey Family plan, 14-day full-feature
-- trial). A household with no entitlement record now resolves to *lapsed* in
-- the app, so every household must start life entitled: creating a household
-- creates a trialing entitlement. The plan (monthly/yearly) is chosen by the
-- parent before the trial starts; prices live in RevenueCat, never here.

create type public.subscription_plan as enum (
  'monthly',
  'yearly'
);

alter table public.household_entitlements
  add column plan public.subscription_plan,
  add column trial_ends_at timestamptz;

create function public.create_trial_entitlement_for_household()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.household_entitlements (household_id, status, trial_ends_at)
  values (new.id, 'trialing', now() + interval '14 days')
  on conflict (household_id) do nothing;

  return new;
end;
$$;

create trigger create_trial_entitlement_for_household
after insert on public.households
for each row
execute function public.create_trial_entitlement_for_household();

-- Existing households were created under the old freemium assumption with no
-- entitlement row; start their 14-day trial now instead of locking them out.
insert into public.household_entitlements (household_id, status, trial_ends_at)
select household.id, 'trialing', now() + interval '14 days'
from public.households household
where not exists (
  select 1
  from public.household_entitlements entitlement
  where entitlement.household_id = household.id
);
