# Chorey subscriptions — setup & sandbox testing

End-to-end runbook for wiring the three auto-renewing subscriptions (Weekly /
Monthly / Yearly) through **App Store Connect → RevenueCat → the app**, and
testing them in **sandbox**.

The app reads plans **dynamically from RevenueCat's current offering** (mapped by
package type), so **no app code changes are needed** — this is all dashboard
config plus one webhook secret.

---

## Fixed identifiers (must match exactly)

| Thing | Value | Where it lives |
|---|---|---|
| Bundle ID | `app.chorey.mobile` | app.json |
| RevenueCat entitlement | **`chorey_family`** | `src/features/entitlements/purchases.ts` |
| RevenueCat appUserID | the household id | set by `configureRevenueCat()` in the app |
| Webhook URL (deployed) | `https://xvcxxduhrvxrqcmcteob.supabase.co/functions/v1/revenuecat-webhook` | Supabase edge function |

Product IDs are **your choice**, but each MUST:
1. match **exactly** between App Store Connect and RevenueCat, and
2. contain its cadence word (`week` / `month` / `year` / `annual`) — the webhook
   infers the plan from that substring.

Recommended set:

| Tier | Product ID |
|---|---|
| Weekly | `weekly_subscription` |
| Monthly | `monthly_subscription` |
| Yearly | `yearly_subscription` |

> Product IDs are **permanent and globally unique** once created — can't be
> renamed or reused. Lock in the pattern before creating them.

---

## Step 0 — Unblock IAP (most common blocker)

App Store Connect → **Business** (Agreements, Tax, and Banking) → the **Paid
Applications** agreement must read **Active** (banking + tax complete).
Subscriptions are not fetchable in sandbox until this is done.

---

## Step A — App Store Connect: create the 3 subscriptions

My Apps → Chorey → **Monetization → Subscriptions**.

1. Create one **Subscription Group** (e.g. reference name `Chorey Family` or
   `Premium` — internal only, users don't see it). All three tiers go in this
   one group so they're mutually exclusive (upgrade/downgrade between them).
2. Add three **auto-renewable** subscriptions in that group:

   | Reference name (internal) | Product ID | Duration |
   |---|---|---|
   | Chorey Family Weekly | `weekly_subscription` | 1 week |
   | Chorey Family Monthly | `monthly_subscription` | 1 month |
   | Chorey Family Yearly | `yearly_subscription` | 1 year |

3. For **each** subscription, fill the three fields that clear **Missing
   Metadata → Ready to Submit**:
   - **Subscription Prices** → choose a price.
   - **App Store Localization** (English) → Display Name + Description.
   - **Review Information → Screenshot** → upload the matching image
     (see *Review screenshots* below). Review note optional.
4. On the **group** page → **Localization → Create** → set a group display name
   (e.g. `Chorey Family`). This is what users see when managing the sub.

> Apple note: the **first** subscription must be attached to an app-version
> submission before it can go live in production. For **sandbox** it just needs
> to be **Ready to Submit** — you don't need to ship the version first.

### Review screenshots

App Review only inspects this image when you submit the app for review (not for
sandbox). Placeholders generated for sandbox unblocking live in `~/Downloads`:
`Chorey_Subscription_Weekly.png`, `…_Monthly.png`, `…_Yearly.png`
(1290×2796). **Before real submission**, replace them with an actual screenshot
of the in-app paywall.

---

## Step B — RevenueCat

1. **App settings** → App Store app with bundle `app.chorey.mobile` + an **App
   Store Connect In-App Purchase key** so RC can read your products.
2. **Products** → add the 3 product IDs (exact match with App Store Connect).
3. **Entitlement** → identifier exactly **`chorey_family`** → attach all 3
   products.
4. **Offering** → create one and mark it **Current** (the app uses
   `offerings.current`). Add 3 packages using the standard identifiers:
   - `$rc_weekly` → weekly product
   - `$rc_monthly` → monthly product
   - `$rc_annual` → yearly product
   (The app maps package type WEEKLY/MONTHLY/ANNUAL → weekly/monthly/yearly.)
5. **API keys** → copy the **Apple App Store** public SDK key (`appl_…`).

---

## Step C — App config

In `.env.local`, replace the placeholder iOS key with the real one:

```
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_…      # was test_PCHC… (placeholder)
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=…       # only needed when shipping Android
```

Env is baked at build time → **rebuild** after changing it.

---

## Step D — Webhook (server-side entitlement sync)

The `revenuecat-webhook` edge function is **already deployed** (verify_jwt off).
It keeps `household_entitlements` in sync so access never depends on the client.

Set one shared secret in **both** places (any random string, must match):

- **Supabase** → Dashboard → Edge Functions → **Manage secrets** → add
  `REVENUECAT_WEBHOOK_AUTH` = `<random>`
  (or `supabase secrets set REVENUECAT_WEBHOOK_AUTH=<random>` after `supabase login`)
- **RevenueCat** → Integrations → **Webhooks** → add webhook:
  - URL: `https://xvcxxduhrvxrqcmcteob.supabase.co/functions/v1/revenuecat-webhook`
  - Authorization header value: the same `<random>`

It returns 500 until the secret is set, then writes `status` / `plan` /
`current_period_ends_at` on every event. (CANCELLATION is intentionally ignored —
access continues until EXPIRATION.)

---

## Step E — Test in sandbox

1. App Store Connect → **Users and Access → Sandbox → Testers** → create a
   sandbox Apple ID (use an email not tied to a real Apple ID).
2. On the device: Settings → **App Store → Sandbox Account** → sign in as the
   tester.
3. Install a **real device build with the `appl_` key** — EAS dev build or
   TestFlight (TestFlight always bills in sandbox, free). Sandbox purchases do
   **not** work in Expo Go.
4. Open the parent app → subscription screen → the 3 plans show with prices →
   buy → authenticate as the sandbox tester → access unlocks.

### Verify the full chain
- **In-app:** access unlocks; status shows Active.
- **RevenueCat** → Customer history shows the sandbox purchase.
- **Supabase:**
  ```sql
  select status, plan, current_period_ends_at
  from household_entitlements
  where household_id = '<your household id>';
  ```
  Should read `active` + plan + a renewal date (once the webhook secret is set).

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| No plans shown in the app | Paid Apps agreement not Active · product IDs mismatch · offering not marked **Current** · build still using the placeholder key |
| "Cannot connect to iTunes Store" (sandbox) | Sandbox flakiness — retry |
| Purchase succeeds, Supabase not updated | `REVENUECAT_WEBHOOK_AUTH` not set, or RC webhook Authorization header doesn't match |
| `plan` column null after purchase | Product ID missing its cadence word (`week`/`month`/`year`/`annual`) |

Sandbox subscriptions renew on an **accelerated** clock (a "weekly" renews every
few minutes), which is handy for testing renewals/expirations.

---

## What's already done (code/infra)

- Subscription UI, RevenueCat gateway, plan mapping, restore, store-management
  link — all built (`src/features/entitlements/`, `src/features/subscription/`).
- `revenuecat-webhook` deployed to production (needs the secret above).
- `household_entitlements` table + trial trigger already live.
