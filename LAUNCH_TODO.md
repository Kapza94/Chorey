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
- [ ] **Add PostHog** — product analytics.
  - Use `posthog-react-native`. Init with project API key via env
    (`EXPO_PUBLIC_POSTHOG_KEY` + host). Capture key funnels: onboarding
    completion, chore created/approved, paywall view/purchase.
  - ⚠️ No hard-coded keys/values — flow config through env, per repo convention.

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
