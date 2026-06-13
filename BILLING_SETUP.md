# Billing setup (RevenueCat) — what YOU need to do

The app code is fully wired. Prices, purchase, restore, and entitlement sync all
work **the moment the dashboards below are configured**. Until then the
subscription screen simply shows no purchasable plans (it never invents a price).

The model: one all-inclusive subscription ("Chorey Family") with **monthly** and
**yearly** options. RevenueCat is the source of truth; Supabase mirrors it via a
webhook. RevenueCat's appUserID is the **household id**, so purchases map back to
the right household automatically.

---

## 1. App Store Connect (iOS)

1. **Agreements, Tax, and Banking** → sign the Paid Apps agreement (subscriptions
   can't go live until this is active).
2. App → **Subscriptions** → create a **Subscription Group** (e.g. "Chorey Family").
3. Add two auto-renewable subscriptions in that group:
   - Monthly — product id e.g. `chorey_family_monthly`
   - Yearly — product id e.g. `chorey_family_yearly`
   - ⚠️ Include the word **month** / **year** in the product id — the webhook
     infers the plan from it.
4. Set the **price** for each (per territory). *This is the price the app shows —
   it is never hard-coded.*
5. (Optional) Add an introductory free trial offer on each.
6. Fill in localization + review screenshot so the products can be submitted.

## 2. Google Play Console (Android)

1. Monetize → **Subscriptions** → create the same two base plans with prices.
   Use matching product ids (`chorey_family_monthly`, `chorey_family_yearly`).
2. Activate them.

## 3. RevenueCat

1. Create a **Project**. Add an **App** for iOS (App Store) and one for Android
   (Play), with the bundle id `app.chorey.mobile`.
   - iOS: upload the App Store Connect **In-App Purchase key** (.p8).
   - Android: connect the **Play service account** credentials.
2. **Products** → import/add the four store products (monthly+yearly × platform).
3. **Entitlements** → create one entitlement with identifier **`chorey_family`**
   (this exact string — the app checks for it). Attach all products to it.
4. **Offerings** → create the **current** offering with two **packages**:
   - a **Monthly** package → the monthly products
   - an **Annual** package → the yearly products
   (The app reads `packageType` MONTHLY/ANNUAL to label the plans.)
5. **API keys** → copy the **public SDK keys** (one for Apple, one for Google).

## 4. App env

Add to `.env.local` (and your EAS build secrets):

```
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxx
```

These are **public** SDK keys (safe to ship). Without them the app runs billing-
free. RevenueCat requires a native build (dev client or store build) — it does
**not** work in Expo Go.

## 5. Webhook (server-side truth)

```bash
supabase functions deploy revenuecat-webhook --no-verify-jwt
supabase secrets set REVENUECAT_WEBHOOK_AUTH='<random-secret>'
```

In RevenueCat → Integrations → **Webhooks**:
- URL: `https://xvcxxduhrvxrqcmcteob.functions.supabase.co/revenuecat-webhook`
- Authorization header: the same `<random-secret>`

See `supabase/functions/revenuecat-webhook/README.md` for the event mapping.

---

## How it flows once configured

1. Parent opens the subscription screen → app fetches the current offering →
   plan cards show the **live localized prices** (`product.priceString`).
2. Parent taps a plan → native purchase sheet → RevenueCat records it.
3. App reflects "active" immediately (from the RevenueCat SDK result).
4. RevenueCat fires the webhook → `household_entitlements` is updated durably.
5. "Restore purchases" calls RevenueCat restore (App Store requirement).

## Verify

- Use a **Sandbox** tester (iOS) / **license tester** (Android) to buy without
  real charges.
- After a sandbox purchase, check `household_entitlements` for the household:
  `status = active`, `plan` set, `current_period_ends_at` in the future.

## Note on the trial

The app grants a 14-day full-feature trial via DB trigger at household creation
(independent of the store). The store/RevenueCat subscription is what the parent
buys to continue past it; the webhook flips `status` to `active`/`trialing` and
sets the real renewal date.
