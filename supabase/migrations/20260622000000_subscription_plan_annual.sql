-- The app now uses "annual" as the canonical plan name (replacing "yearly").
-- PostgreSQL enums are append-only, so both values stay in the type; the app
-- and webhook write "annual" going forward.
alter type public.subscription_plan add value if not exists 'annual';
