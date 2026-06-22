# Subscriptions — session handoff (2026-06-22)

Pick up here. Full how-to is in **`docs/subscriptions-setup.md`** — this file is
just current state + next actions + the prompt to resume.

## Git state
- On branch **`docs/subscriptions-setup`** (off `dev`).
- Uncommitted / untracked:
  - `docs/subscriptions-setup.md` — the runbook (keep, commit it)
  - `docs/SUBSCRIPTIONS-HANDOFF.md` — this file (keep, commit it)
  - `src/app/preview-paywall.tsx` — **TEMP throwaway** route for screenshotting
    the paywall. **DELETE before merging** (it must not ship).
- Photos feature already shipped earlier: merged to `dev`, pushed, deployed to prod.

## Production Supabase
- Project ref: **`xvcxxduhrvxrqcmcteob`**
- `revenuecat-webhook` edge function: **deployed** (verify_jwt off), ACTIVE.
  URL: `https://xvcxxduhrvxrqcmcteob.supabase.co/functions/v1/revenuecat-webhook`
  → It returns 500 until `REVENUECAT_WEBHOOK_AUTH` secret is set (see below).
- `chore-photos` function + 30-day purge cron: deployed & verified (photos feature).

## What's DONE
- App subscription code is complete — **no code changes needed**. The app reads
  plans dynamically from RevenueCat's *current* offering by package type.
- RevenueCat webhook deployed to prod.
- Runbook written (`docs/subscriptions-setup.md`).
- Placeholder App Store review screenshots generated in `~/Downloads`:
  `Chorey_Subscription_Weekly.png`, `_Monthly.png`, `_Yearly.png` (1290×2796).

## What's IN PROGRESS (you / dashboards)
Creating the 3 auto-renewable subscriptions in App Store Connect.
Group can be named anything ("Premium" is fine). Product IDs are your choice but
must contain the cadence word and match RevenueCat exactly. Suggested:
`weekly_subscription`, `monthly_subscription`, `yearly_subscription`.

## NEXT STEPS (in order)
1. **App Store Connect** — finish all 3 subscriptions; for each set price +
   localization (display name/description) + upload the matching review
   screenshot so status = **Ready to Submit**. Add a group display name.
2. **RevenueCat** — Products (3, exact IDs) → Entitlement **`chorey_family`**
   (attach all 3) → Offering marked **Current** with packages `$rc_weekly` /
   `$rc_monthly` / `$rc_annual` → copy the Apple **`appl_…`** API key.
3. **`.env.local`** — replace `EXPO_PUBLIC_REVENUECAT_IOS_KEY=test_PCHC…` with
   the real `appl_…` key. Rebuild after (env is baked at build time).
4. **Webhook secret** — pick a random string; set it BOTH in Supabase
   (Dashboard → Edge Functions → Manage secrets → `REVENUECAT_WEBHOOK_AUTH`) and
   in RevenueCat (Integrations → Webhooks → that URL + Authorization header =
   same string).
5. **Sandbox** — create a sandbox tester (Users and Access → Sandbox), sign in
   on the device (Settings → App Store → Sandbox Account), install a real device
   build (EAS dev build or TestFlight — not Expo Go).
6. **Test** a purchase → verify access unlocks, RevenueCat customer history shows
   it, and `household_entitlements` row flips to `active` + plan.
7. **Cleanup** — delete `src/app/preview-paywall.tsx`; commit the two docs;
   merge `docs/subscriptions-setup` → `dev`.

## Paywall screenshot (optional, for App Review submission only)
The placeholders are fine for sandbox. For the real App Review screenshot, the
cleanest capture is a dev build that includes the temp `preview-paywall` route:
restart Expo (`npx expo start`, not `--web`) so the new route registers, run on
the iOS simulator, deep-link `chorey://preview-paywall`, and screenshot. (The
headless-web capture failed only because the already-running `expo --web` server
predates the route file and won't hot-add it.)

## Fixed identifiers (must match exactly)
- Bundle ID: `app.chorey.mobile`
- Entitlement: `chorey_family`
- RevenueCat appUserID = household id (already wired)
