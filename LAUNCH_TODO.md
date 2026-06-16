# Chorey — Launch TODO / What's next

Last updated: 2026-06-15. Forward-looking checklist of remaining pre-launch work.
(Stale session handovers live in `HANDOVER*.md`; this file is the live "next" list.)

## 🔭 Observability & analytics (to add)

- [x] **Add Sentry** — SDK wired (`feat/sentry-and-config-guard`).
  - `@sentry/react-native@~7.11.0` installed; config plugin added to `app.json`
    with `disableAutoUpload: true`.
  - `Sentry.init` (guarded by `getSentryDsn()`) + `Sentry.wrap` in
    `src/app/_layout.tsx`. Disabled until a DSN is set (no-op pattern).
  - **Remaining to activate:**
    - [ ] Create a Sentry project, get the DSN.
    - [ ] Set `EXPO_PUBLIC_SENTRY_DSN` in `.env.local` AND in EAS
          (`eas env:create --environment production --name EXPO_PUBLIC_SENTRY_DSN`).
    - [ ] For readable stack traces: set up source-map upload — add
          `organization`/`project`/`authToken` (SENTRY_AUTH_TOKEN) to the plugin,
          flip `disableAutoUpload` off, and use `getSentryExpoConfig` in
          `metro.config.js`.

- [x] **Startup config guard** — app no longer hard-crashes when Supabase env
  vars are missing; shows `ConfigErrorScreen` instead (`src/lib/supabase.ts`
  `isSupabaseConfigured`, `src/lib/env.ts` `getChoreyEnvOrNull`).
- [x] **Add PostHog** — product analytics (`feat/posthog-analytics`).
  - `posthog-react-native@^4.47` + expo deps (file-system/application/device/
    localization) installed. `AnalyticsProvider` wraps the root in `_layout.tsx`,
    guarded by `getPostHogConfig()` — no-op until `EXPO_PUBLIC_POSTHOG_KEY` set.
  - Touch autocapture on; **screen autocapture off** (Expo Router = RN Nav v7).
  - **Remaining to activate / extend:**
    - [ ] Get the PostHog project key; set `EXPO_PUBLIC_POSTHOG_KEY`
          (+ optional `EXPO_PUBLIC_POSTHOG_HOST`) in `.env.local` AND EAS.
    - [ ] Wire manual screen views via Expo Router `usePathname`.
    - [ ] Capture key funnels: onboarding completion, chore created/approved,
          paywall view/purchase.

## ✉️ Auth email (branding + deliverability)

- [ ] **Apply the branded template** at `docs/email-templates/auth-magic-link.html`
      in Supabase → Authentication → Email Templates, for **both** "Confirm
      signup" and "Magic Link". (Shows the 6-digit `{{ .Token }}` + a
      `{{ .ConfirmationURL }}` button. Make sure the template includes
      `{{ .Token }}` — the onboarding screen asks for the code.)
  - [ ] Host `c-mark.png` publicly and drop the logo `<img>` into the header.
- [ ] **Custom "from" address + production deliverability — set up custom SMTP.**
      Supabase's built-in email is rate-limited (~a few/hour) and NOT for
      production, and it always sends from a Supabase address. To send from e.g.
      `help@chorey.co` you need, in order:
  1. **A domain you own** — app currently uses **chorey.co** (see `PRIVACY_URL`),
     not chorey.com. Buy/confirm the domain first; keep it consistent.
  2. **An email provider** (Resend / Postmark / SendGrid / AWS SES / Mailgun).
  3. **Verify the domain** there (SPF, DKIM, DMARC DNS records) — required or
     mail lands in spam.
  4. Enter the provider's SMTP host/port/user/pass + sender `help@chorey.co` in
     Supabase → Authentication → SMTP Settings.

## ⚖️ Privacy / compliance (REQUIRED before these ship live)

- [ ] **Update the privacy policy** at `https://chorey.co/privacy` (hosted off-repo;
      linked via `PRIVACY_URL` in `src/features/legal/legal.ts`) to disclose the
      third-party data processors we now use:
  - **PostHog** — product analytics (usage events, device/app info, IP-derived
    location). Note data sharing + region (US/EU cloud).
  - **Sentry** — crash/error reporting (device info, stack traces, may include
    contextual user/session data).
- [ ] Reflect both in the **App Store privacy "nutrition label"** (App Privacy in
      App Store Connect) and the **Play Data safety** form — required to match.

## 🛡️ Security / DDoS & abuse hardening

- [x] **Tightened RPC/trigger EXECUTE grants** (`security/harden-anon-rpc-grants`,
      migration `20260616120000_harden_function_execute_grants.sql`):
  - Trigger/internal functions (`block_*_when_household_paused`,
    `create_ledger_event_when_payout_recorded`,
    `create_trial_entitlement_for_household`) revoked from all API roles.
  - Parent RPCs (`approve_*`, `choose_subscription_plan`, `ensure_*`,
    `list_household_*`) → revoked from anon, granted to authenticated only.
  - Child RPCs (`*_child_*`, access-code based) left anon-callable by design.
  - Verified: anon loses parent/trigger execute, authenticated keeps it.
- [ ] **Review `public.rls_auto_enable()`** — flagged by the advisor but not
      defined in our migrations (platform/extension-created). Lock down manually
      if appropriate.
- [ ] **Auth rate limits** (dashboard → Authentication → Rate Limits): keep token
      verification low (~30/5min, anti-brute-force), raise email/hour now that
      Resend is wired.
- [ ] **Cost / quota exhaustion** (dashboard/billing): enable Supabase usage
      alerts; set a spend cap on Pro; add Resend usage alerts.
- [ ] **Bot signup**: rely on rate limits for v1 (CAPTCHA is clunky in RN);
      revisit Turnstile/hCaptcha via WebView only if abuse appears.
- [ ] **Enable leaked-password protection** (Auth settings) — low impact
      (passwordless), free one-click win.

> Note: `npm run db:test` has **pre-existing failures on the local machine**
> (identical with/without the migration above — not caused by it). Looks like a
> pgTAP/CLI setup issue; worth a separate look but non-blocking.

## 🎨 App Store assets (to create)

- [ ] **App Store / Play screenshots** — produce the marketing screenshots.
  - Compose/animate with **HyperFrames** (`hyperframes` skill) and generate
    imagery/backgrounds with **Higgsfield** (`generate_image`).
  - Need the required iOS sizes (6.7"/6.9" + iPad if listing iPad) and Play sizes.

## 🚀 Release status (in flight this session)

### iOS — TestFlight
- ✅ App Store Connect record created (`Chorey: Chores & Allowance`, bundle
  `app.chorey.mobile`).
- ✅ EAS project linked (`projectId` in `app.json`), credentials + push key set up.
- 🔄 **iOS `production` build running** (`eas build -p ios --profile production`,
  run with `EXPO_NO_CAPABILITY_SYNC=1` to skip the capability-sync error).
- [ ] **Next:** `npx eas-cli submit --platform ios --profile production` → upload
  to App Store Connect → wait for processing → set up testers in **TestFlight**.
- [ ] Internal testers (instant, no review) vs external testers (Beta App Review).

### Android — Google Play
- Building does **not** need a device (EAS builds in the cloud).
- [ ] **Blocker:** new personal Play account (Elkapz Labs) needs identity
      verification, including **"access to a real Android device"** — sign into
      the Play Console app on a borrowed Android phone (~5 min, one-time).
      Emulators are unreliable for this.
- [ ] Verify contact phone number (can do now, no device).
- [ ] New personal accounts require a **closed test, 12+ testers for 14 days**
      before production access — start this early; it's the long pole.
