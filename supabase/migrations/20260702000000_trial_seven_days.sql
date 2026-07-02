-- The full-feature trial is 7 days, not 14 — matching the App Store /
-- RevenueCat introductory offer that actually governs billing. The original
-- trigger granted `now() + interval '14 days'`, so the in-app "Free until
-- <date>" was a week longer than the store trial. Redefine the trigger to 7
-- days and pull still-running trials back in line.

create or replace function public.create_trial_entitlement_for_household()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.household_entitlements (household_id, status, trial_ends_at)
  values (new.id, 'trialing', now() + interval '7 days')
  on conflict (household_id) do nothing;

  return new;
end;
$$;

-- Shorten trials that were opened under the old 14-day grant to 7 days from
-- when they started. `trial_ends_at - interval '7 days'` recovers the original
-- start; clamp so we never push an end date into the past for someone who is
-- already more than 7 days in (they keep whatever time is left, down to now).
update public.household_entitlements
set trial_ends_at = greatest(now(), trial_ends_at - interval '7 days')
where status = 'trialing'
  and trial_ends_at is not null;
