# Chorey — Handover for the next agent

_Last updated: 2026-06-08. Branch: `feature/design-system-redesign` (16 commits
ahead of `origin`, **unpushed**). 177 Jest tests + 9 SQL test suites passing;
`npm run typecheck` and lint clean._

Read `CLAUDE.md` first (commands, architecture, the Screen/Actions pattern, the
40/40/20 rule, git workflow). This file is the "what's next."

---

## 0. Immediate broken thing (start here)

**The dev role-switcher's "Parent" button silently does nothing**, leaving you on
the kid page. Root cause is a real product bug, not the switcher:

- **Re-walking onboarding while already signed in creates a *second* Supabase
  account** instead of reusing the session. The local DB ended up with two
  `auth.users`: `tester@parent.com` (owns the only household, "Test"/kid "Dada",
  logged out) and `trst@ljbljb.com` (signed in, **no household**).
- The dev switcher (`src/features/dev/dev-role-switcher.tsx`) resolves
  `getPrimaryHouseholdId()` for the *signed-in* user. The signed-in account had
  no household → `null` → the button no-ops.
- Workaround already applied to the **local DB only**: `trst@ljbljb.com` was
  added as a `parent_admin` of "Test" so the switcher resolves. This is a data
  patch, not a code fix.

### Fix #1 (highest priority): signed-in parent skips onboarding
`src/app/index.tsx` **always** renders `OnboardingFlow`, even when a parent is
already authenticated. On launch it should:
1. Check `supabase.auth.getSession()` (or a session listener).
2. If a session exists → resolve household via
   `getPrimaryHouseholdId()` (`src/features/household/default-household-actions.ts`):
   - has a household → `router.replace('/parent/home?householdId=…')`
   - signed in but no household → `router.replace('/parent/household/new')`
3. Otherwise → show onboarding.

This prevents the duplicate-account mess above and fixes "why doesn't refresh log
me out" (it shouldn't — sessions persist by design; the launch screen just needs
to route accordingly). Note `parent/sign-in.tsx` already does household
resolution on sign-in; mirror that on launch.

### Fix #1b (nice): make the dev switcher honest
When `getPrimaryHouseholdId()` returns null, show a quick "no household — log in
first" toast/note instead of silently doing nothing.

---

## 1. What this session shipped (context)

The redesigned app is now **feature-complete for the core MVP**, wired to real
Supabase, both parent and kid sides. Highlights (commits since `f5bb33a`):

- **Parent app** (`src/features/parent-app/`, route `src/app/parent/home.tsx`)
  fully wired: per-kid aggregates (`list_household_kids` RPC), a unified
  "needs you" review sheet (chore approvals **+ purchase requests + giving
  suggestions**), payouts, chore creation, per-kid budget/cadence, settlement,
  and **owed = earned − paid** with a per-kid payments sheet (tap a kid card).
- **Kid app** (`src/features/kid-home/`, route `src/app/child/home.tsx`):
  chores with correct **todo / waiting / approved** states (only *approved*
  money shows — the home hero, You, and Wishlist now agree), add-to-wishlist,
  request purchase, suggest-a-giving-cause, log out.
- **Send-back-with-reason** (Phase 2 complete) — migration
  `20260605140000_chore_send_back.sql`, parent UI in the review sheet, kid sees
  "Sent back: …" and can resubmit.
- **Recurring chores (Phase 8 core)** — `chore_templates` table +
  `ensure_recurring_chore_instances` RPC (`20260605150000_chore_templates.sql`),
  paid-gated actions, a Repeat selector in the New-chore sheet that's
  **inline Premium-locked** for free households (no screen bounce). Pure
  recurrence logic in `src/features/chores/recurrence.ts`.
- **Nav unified**: legacy `/parent/dashboard` + the old `parent-dashboard /
  parent-chores / parent-children / parent-settings / parent-navigation`
  features and routes were **deleted** (`41f2ff0`). `/parent/dashboard` is now a
  redirect to `/parent/home`.
- **Log out**: parent (Settings tab → `supabase.auth.signOut()`) and kid
  (You tab → `router.replace('/')`, no session to clear).
- **Onboarding fixes**: multi-kid Premium gate (`p_premium` step — free = 1 kid,
  remove a kid or hit the paywall), preset-chore suggester + always-on custom
  field, and an iOS caret/text alignment fix in `OBField`.
- **Dev tool**: floating `__DEV__`-only Parent/Kid switcher (the one currently
  half-broken — see §0).

---

## 2. Known gaps / deferred (besides §0)

- **RevenueCat is NOT integrated.** All "Premium" gates (multi-kid, recurring
  chores) are placeholders. "Unlock Premium" buttons show "coming soon"; the only
  working path is staying free. `household_entitlements` + the resolver
  (`src/features/entitlements/`) exist; wiring real purchases is its own project.
- **Apple/Google sign-in**: UI + `signInWithOAuth` actions exist but providers
  aren't configured/wired (`src/features/auth/`). Only email-OTP works.
- **Tap-to-edit chores** (user-requested, not built): the parent Chores-tab
  library rows show a `›` chevron but do nothing. Needs a secure update/delete
  RPC (the current chore_instances update policy only allows status changes) + an
  edit sheet. Likely a `security definer` `update_chore_details(household, chore,
  title, reward)` RPC.
- **Recurrence management**: no UI to list/pause/delete `chore_templates` yet.
- **Kid Giving "given so far"**: `givenCents` is stubbed at 0 and `onMarkGiven`
  is a no-op — there's no "marked given" tracking in the ledger.
- **Payout/settlement model**: owed = lifetime earned − lifetime paid. Settlement
  marks buckets settled but does NOT reset the ledger; the relationship between
  settlement and "starting a fresh period" is undefined. Decide the intended
  model before building more here.
- **Dev DB is messy** from repeated onboarding walks (multiple accounts). A clean
  `npm run db:reset` + a single fresh walk is the fastest way to a sane state
  (will wipe the "Test"/Dada data).

---

## 3. Unbuilt phases (from `BUILD_PLAN.md`)

Done (core/foundation): Phases 0–3, 5–7 slices, Phase 2 (now incl. send-back),
Phase 8 core (recurring). Not started:

- **Phase 9** Reminders & notifications (Expo Notifications; paid-gated) — needs device testing.
- **Phase 10** Photo proof (S3 presigned upload, delete-after-review).
- **Phase 11** Secret chores (reveal scheduling, first-approved-wins).
- **Phase 12** Milestones (private recognition, no gamification) — lightweight, locally testable.
- **Phase 13** Analytics & observability (PostHog/Sentry, privacy-safe taxonomy).
- **Phase 14** Beta hardening & store prep (EAS build, icons/splash, privacy
  policy, E2E smoke tests).

Recommended order for the next agent: **Fix #1 (launch routing)** → push the
branch → tap-to-edit chores → then RevenueCat or pick a phase. Hold OAuth +
RevenueCat for when real provider/store config is available.

---

## 4. How to run + test (local)

```bash
# Local stack (Docker required). Container is supabase_db_Chorey_ (project_id
# is literally "Chorey_"). Ports: api 55431, db 55432, studio 55433, mailbox 55434.
npx supabase start
npm run db:reset          # apply all migrations to an empty DB
npm run db:test           # pgTAP SQL tests (RLS, triggers, RPCs)

# App
npx expo start            # then press i, or open exp://127.0.0.1:8081 in Expo Go
npm test                  # Jest (177 tests)
npm run typecheck         # tsc --noEmit
npm run lint

# OTP codes land in Mailpit: http://127.0.0.1:55434  (local email, nothing sends)
```

**Dev quirks:**
- The iOS simulator may boot fresh without Expo Go; install the cached one with
  `xcrun simctl install booted ~/.expo/ios-simulator-app-cache/Expo-Go-*.app`.
- Metro started as a background process tends to die between turns — run it in a
  persistent terminal.
- `graphify-out/` is a code-graph artifact (from the `graphifyy` tool) — add it
  to `.gitignore`, don't commit it.

## 5. Conventions (see CLAUDE.md for full detail)

- TDD: red → green → refactor. Money is **integer cents** everywhere.
- Screens are pure components fed by typed `actions`; `default-*-actions.ts` wire
  the real `supabase` client; Expo Router route files import the defaults.
- All tables have RLS. Child-facing RPCs are `security definer` + take an access
  code (kids are not authenticated Supabase users).
- Branch off `dev`; never commit/push to `dev`. End commits with the
  `Co-Authored-By` trailer.
