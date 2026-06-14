# revenuecat-webhook

Keeps `household_entitlements` in sync with RevenueCat (the billing source of
truth). RevenueCat's appUserID is the **household id** (set by the app in
`configureRevenueCat`), so `event.app_user_id` maps straight to a household.

## Deploy

```bash
supabase functions deploy revenuecat-webhook --no-verify-jwt
```

`--no-verify-jwt` is required because RevenueCat is not a Supabase user. The
function authenticates RevenueCat itself via a shared secret instead.

## Secret

Pick any strong random string and set it in BOTH places (they must match):

```bash
supabase secrets set REVENUECAT_WEBHOOK_AUTH='<random-secret>'
```

Then in RevenueCat → Project → Integrations → Webhooks:
- **URL**: `https://<project-ref>.functions.supabase.co/revenuecat-webhook`
- **Authorization header**: `<random-secret>` (the same value)

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

## What it does

| RevenueCat event | Result |
|---|---|
| INITIAL_PURCHASE / RENEWAL / PRODUCT_CHANGE / UNCANCELLATION / NON_RENEWING_PURCHASE / SUBSCRIPTION_EXTENDED | `status = active` (or `trialing` if `period_type = TRIAL`), sets `current_period_ends_at` + `plan` |
| EXPIRATION / SUBSCRIPTION_PAUSED | `status = lapsed` |
| CANCELLATION | ignored — auto-renew off but access continues until EXPIRATION |
| anything else | acknowledged, no change |

`plan` is inferred from the store product id (must contain `week`, `month`, or
`year`/`annual`); if it can't be determined the existing plan is left as-is.
