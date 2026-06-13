# Handover — feat/launch-polish (chore board, late chores, push, copy)

## UPDATE 2026-06-13 (session 2)
- All work COMMITTED + PUSHED on `feat/launch-polish` (commits 9788863, b956a94).
- Both feature migrations APPLIED to hosted prod (`xvcxxduhrvxrqcmcteob`):
  `child_chore_recurrence` + `push_notifications`. Verified live.
- Security audit done (Supabase advisors + manual function review). One extra
  migration applied: `20260613160000_security_hardening` (lock down
  household_is_entitled, pin recurrence_trunc_unit search_path).
- See "LAUNCH CHECKLIST" at the bottom for what remains.

---

Branch: `feat/launch-polish` (off `dev`). (Original session note: nothing committed yet —
all changes were in the working tree; now committed/pushed, see update above.) Tests/typecheck/lint were green at handover:
`npx jest` → 298 passing (51 suites), `npx tsc --noEmit` clean, lint clean
(2 pre-existing unused-`palette` warnings in onboarding-flow.tsx, not ours).

Hosted Supabase project ref: `xvcxxduhrvxrqcmcteob` (app points at HOSTED via
.env.local). Local DB path also exists (commented). User approved READ-ONLY
prod queries only — do NOT write to prod without asking.

## Six requests and their status

1. **Wallet shows 0.00 after approval — DIAGNOSED + FIXED.**
   Not a ledger bug. Root cause: the only approved chore ("Wash dishes", a daily
   template) was created with `reward_cents = 0`, so the 40/40/20 split is zero →
   no ledger_events (working as designed). The two real "Make bed" chores ($5)
   are still `assigned` (child hasn't submitted). The real gap was the Add-chore
   sheet allowing a blank reward. Fix: Add button now requires name + reward > 0
   (`canAdd`) in `src/features/parent-app/parent-chores-screen.tsx`.
   User should delete the stale $0 "Wash dishes" template in-app.

2. **Chores tab To do / Needs approval / Done board — DONE.**
   `ParentChoresScreen` now renders a status board with inline approve/send-back
   (reuses the Kids-tab interaction). The flat "Library" still renders only if a
   `chores` prop is passed (kept for tests); `home.tsx` no longer passes it, so
   the real app shows just the board. New type `ChoreBoardItem`. Threaded:
   `home.tsx` builds `choreBoard` → `ParentApp` (`choreBoard` prop, plus
   `onApproveChore`/`onSendBackChore`) → `ParentChoresScreen` (`board`).

3. **Parent level-up = quiet toast, not glitz — DONE.**
   New `src/components/level-up-toast.tsx` (~2.4s auto-dismiss). `parent/home.tsx`
   uses it instead of `LevelUpBurst`. Kid app keeps the full `LevelUpBurst`.

4. **Late daily chores — DONE (in-app flag).**
   New pure `isRecurringChoreLate(chore, now)` in
   `src/features/chores/recurrence.ts` (late = recurring + period_key < current
   period key + status assigned/sent_back; submitted/approved never late; ISO
   period keys compare lexically so daily/weekly/monthly all work).
   - Parent board: red "Late" badge per row + "N late" section badge.
   - Child home: "Late" badge per row + a warning banner counting late chores.
   Data plumbing: parent `chore-actions.ts` select now embeds
   `chore_templates(recurrence)` + `period_key` + `sent_back_reason` (CHORE_COLUMNS,
   CreatedChore gained `recurrence`/`periodKey`/`sentBackReason`). Child side:
   `child-chore-actions.ts` ChildChore gained `recurrence`/`periodKey`.

5. **Push notifications (expo-notifications) — CODE BUILT, NOT DEPLOYED.**
   User explicitly chose "build full push notifications". Installed
   expo-notifications/expo-device/expo-constants (SDK 56 compatible). Added
   `expo-notifications` to app.json plugins.
   - `src/features/notifications/notification-actions.ts` — pure factory
     `createChildNotificationActions` (registerToken → RPC). Tested.
   - `push-registration.ts` — `getExpoPushToken()`; safe no-op (returns null)
     on simulator / denied / **no EAS projectId**. Sets notification handler.
   - `default-notification-actions.ts` — `registerChildForPushNotifications(accessCode)`,
     best-effort, wired into `child/home.tsx` via useEffect on accessCode.
   - Migration `supabase/migrations/20260613150000_push_notifications.sql`:
     `push_tokens` table (RLS), `register_child_push_token` RPC, `late_notified_at`
     column on chore_instances, `get_late_chores_to_notify()` (service_role only).
   - Edge function `supabase/functions/notify-late-chores/index.ts` (Deno) sends
     Expo pushes for overdue chores, stamps late_notified_at; see its README.

6. **"kid" → "child/children" copy sweep (app) — DONE.**
   Swept user-facing strings only (left code identifiers, type "kids" tab id,
   role: "kid" union, kid-* filenames). Touched: parent-primitives (tab label
   "Children"), parent-kids-screen (header/buttons/empty), parent-chores-screen
   ("Show more children"), parent-settings-screen, subscription-screen,
   dev-role-switcher, onboarding-demo, onboarding-flow, parent/home.tsx
   ("Your child" fallback). Updated matching assertions in parent-app.test.tsx
   and onboarding-flow.test.tsx.

## New migrations are NOT applied to hosted DB

- `20260613140000_child_chore_recurrence.sql` — drops+recreates
  `list_child_chores` to also return `recurrence` + `period_key`. **Child-side
  late flag needs this.** (Parent board late works WITHOUT it — parent uses a
  direct PostgREST embed on existing schema.)
- `20260613150000_push_notifications.sql` — needed for push.
Offer to apply both to hosted (a WRITE — needs user OK), or user runs their deploy flow.

## Still needs the user (was waiting on answers)

- **Landing page**: lives in a SEPARATE REPO. User will provide the path; then do
  the same kid→child/children copy sweep there. Not done yet.
- **EAS**: not configured (no `extra.eas.projectId` in app.json). Push tokens
  require it — run `eas init`. Until then client registration is a silent no-op.
- **Push deploy**: deploy edge function (`supabase functions deploy
  notify-late-chores --no-verify-jwt`), schedule it (pg_cron/Supabase schedules,
  see function README), and test on a real device build (Expo Go can't receive
  remote push).

## Commands
`npm test` · `npx tsc --noEmit` · `npm run lint` · `npm start`
Single test: `npx jest src/__tests__/<file>`

Nothing has been committed — review the diff before committing. Per CLAUDE.md:
never commit/push to `dev`; stay on the feature branch.

---

## LAUNCH CHECKLIST (as of 2026-06-13 session 2)

### A. Security audit — DONE, with open product decisions
- ✅ All tables RLS-enabled; Supabase security advisor shows 0 ERRORs.
- ✅ 56 "security definer executable by anon/authenticated" warnings reviewed:
  the child-facing RPCs (access-code keyed) are anon-callable BY DESIGN; 8/9
  household_id-taking functions enforce `auth.uid()` membership internally
  (most require role='parent_admin'). False positives.
- ✅ FIXED: household_is_entitled (was leaking subscription bool to anon) +
  recurrence_trunc_unit search_path. Migration 20260613160000.
- ✅ No secrets in client bundle; .env gitignored; edge fn reads key from env.
- ⚠️ OPEN (PRODUCT DECISION): 6-digit child access codes (`^[0-9]{6}$`, 1M combos)
  are anon-resolvable via resolve_child_access_code with NO rate limiting →
  brute-forceable. Biggest design-level risk for a kids' app. Mitigate with
  rate limiting / lockout / longer codes before/early after launch.
- ⚠️ OPEN: notify-late-chores deploys `--no-verify-jwt` (publicly triggerable).
  Idempotent (late_notified_at) so low risk; consider a shared-secret header.
- ⚪ OPTIONAL: enable auth leaked-password protection (moot — no password auth).

### A2. Billing / RevenueCat — CODE WIRED, dashboards NOT set up
- ✅ react-native-purchases installed; pure purchases.ts (offering->price mapping,
  entitlement check) + default-purchase-actions.ts (real gateway, appUserID =
  household id). SubscriptionScreen shows live store prices + Restore + lapsed
  resubscribe. subscription route + parent/home takeover wired.
- ✅ revenuecat-webhook edge function = server-side source of truth (client never
  self-grants 'active'). Shared-secret auth.
- ✅ household_entitlements already had every needed column (no migration).
- [ ] DO THE DASHBOARDS: see BILLING_SETUP.md — App Store + Play subscription
  products & prices, RevenueCat project/offerings/entitlement `chorey_family`,
  public SDK keys into EXPO_PUBLIC_REVENUECAT_IOS_KEY / _ANDROID_KEY.
- [ ] Deploy webhook: `supabase functions deploy revenuecat-webhook --no-verify-jwt`
  + `supabase secrets set REVENUECAT_WEBHOOK_AUTH=...` + set the same header in RC.
- [ ] Sandbox-test a purchase on a real device build (needs EAS dev/store build).
- Until keys exist the screen shows NO prices (by design — never invents a price).

### B. Push notifications — built, NOT live
- [ ] `eas init` (no extra.eas.projectId → token registration is a silent no-op)
- [ ] iOS APNs + Android FCM credentials in EAS
- [ ] `supabase functions deploy notify-late-chores --no-verify-jwt`
- [ ] Schedule it (pg_cron + pg_net or Supabase scheduled functions)
- [ ] Test on a REAL device build (Expo Go can't receive remote push)

### C. Build / release infra — not started
- [ ] eas.json (no build profiles), extra.eas.projectId, runtimeVersion, updates
- [ ] Bump version (currently 0.1.0). Bundle id app.chorey.mobile is set.
- [ ] App Store Connect + Play Console listings, screenshots, privacy policy
- [ ] COPPA / Apple Kids Category compliance review (this is a children's app)

### D. Landing page — pending
- [ ] Separate repo; provide path, then run the kid→child/children copy sweep.

### E. Product / QA / merge
- [ ] Manual device QA: chore board, late badges/banner, quiet level-up toast
- [ ] Delete the stale $0 "Wash dishes" template in-app
- [ ] Open PR feat/launch-polish → dev and merge
