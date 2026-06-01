# Chorey Morning Handover

Last updated: Friday, May 29, 2026, Europe/Belgrade.

## Read This First

We have a working Expo React Native app for Chorey with the first parent and child vertical slice in place.

The app is not just a mockup anymore. Parent auth UI, household setup, child creation, child access codes, manual chore creation, child chore submission, and parent approval are all wired through the current Supabase-backed flow.

The next meaningful product step is to finish settlement history and polish the parent settlement review flow.

## Current Build State

Implemented and verified:

- Expo Router app shell for iOS and Android.
- Chorey design context and product context files.
- Parent sign-in screen with Apple, Google, and OTP/magic link UI.
- Supabase parent auth action layer for local OTP flow.
- Household creation with weekly/monthly settlement rhythm.
- First child profile creation.
- Parent-generated child access code flow.
- Child access screen using that code.
- Parent dashboard.
- Child dashboard.
- Manual one-off chore creation.
- Child chore list loading by access code.
- Child can mark an assigned chore done.
- Parent dashboard refreshes household chores.
- Parent can approve submitted chores.
- Approved paid chores create ledger events and update Spend, Savings, and Giving balances.
- Parent dashboard shows a settlement summary.
- Parent can review settlement and mark all buckets settled with one action.
- Whole-app visual pass using the current Chorey system:
  - warm cream surfaces
  - sage primary buttons
  - tactile cards
  - bucket colors for Spend, Savings, Giving
  - clearer chore state chips
  - buttons kept visible above the fold where practical

## Current Verification

Fresh checks after the whole-app redesign:

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
```

Result:

- TypeScript passed.
- Expo lint passed.
- Jest passed: 19 suites, 67 tests.

Database tests were not rerun after the final UI-only pass. There were no Supabase schema changes in that pass.

## Current Routes And What They Do

- `/` shows the Chorey welcome screen with Parent and Child entry points.
- `/parent/sign-in` shows parent auth.
- `/parent/household/new` creates a household.
- `/parent/children/new` creates the first child profile.
- `/parent/dashboard` shows household summary, child access code, bucket split, chores, and approval actions.
- `/parent/chores/new` creates a manual chore.
- `/child/access` accepts a child access code.
- `/child/dashboard` shows the child bucket area and assigned/submitted chores.
- `/auth/callback` handles parent auth callback status.

## Important Product Decisions Already Made

- Product name is Chorey, not Sprout.
- Chorey is a virtual family ledger, not real money movement.
- Parents settle outside the app, weekly or monthly.
- Settlement rhythm is chosen once for the household, with changes affecting future periods only.
- The 40 / 40 / 20 split is fixed and is the heart of the product.
- Children never see billing, subscriptions, or upgrade prompts.
- Giving should stay human and not be meaningfully paywalled.
- Recurring chores are paid-only.
- Photo proof is paid-only, opt-in per chore, temporary, and deleted after approval or send-back.
- We are using React Native, Expo, Expo Router, TypeScript, Supabase, Supabase Auth, Supabase Edge Functions later, Postgres RLS, AWS S3 later for proof photos, Expo Notifications, PostHog, Sentry if free, RevenueCat, and EAS.

## Current Visual Direction

Chorey should feel clean, warm, trustworthy, family-friendly, and useful. It should not feel like a banking app, a leaderboard game, or a noisy child app.

Current UI vocabulary:

- Parent surfaces are calm and task-focused.
- Child surfaces are warmer and a little larger.
- Primary actions use sage.
- Secondary actions use cream surfaces with warm borders.
- Spend is peach.
- Savings is soft lilac.
- Giving is sage green.
- Chore states use visible chips and clear text.

Known design note:

- There is now repeated inline styling across screens. This was intentional for speed during the visual pass. Once the core flows settle, it is worth extracting small primitives like `PrimaryButton`, `SecondaryButton`, `Panel`, `StateChip`, and `BucketCard`.

## Manual Test Script For The Morning

Start or reopen the app:

```bash
npm run ios
```

If Expo says the port is already running, use the existing Simulator app or open:

```bash
xcrun simctl openurl booted exp://127.0.0.1:8081/--/
```

Suggested manual flow:

1. Open the welcome screen.
2. Tap Parent.
3. Use OTP/magic link local flow.
4. Create a household.
5. Add a child.
6. Note the child access code on the parent dashboard.
7. Create a manual chore.
8. Open child access and enter the code.
9. Confirm the chore appears for the child.
10. Tap Mark done.
11. Return to parent dashboard.
12. Confirm the chore shows Needs approval.
13. Approve it.
14. Confirm it shows Approved.

## Known Gaps

These are expected, not regressions:

- Google and Apple provider auth are UI-wired but still need real Supabase provider configuration.
- Settlement history is not implemented yet.
- Send-back flow is specified but not implemented.
- Reward adjustment at approval is specified but not implemented.
- Checklist items are specified but not implemented.
- Recurring chores are paid-only and not implemented.
- Photo proof is specified but not implemented.
- RevenueCat entitlements are not implemented.
- Push notifications are not implemented.
- PostHog and Sentry are not integrated yet.
- E2E testing is not set up yet.
- Git currently shows the project files as untracked, so there is no clean baseline commit yet.

## Best Next Step

Continue Phase 4 settlement with TDD.

Recommended first task:

1. Add tests for settled period history.
2. Add a parent-facing history query.
3. Add a simple settlement history view.
4. Keep free-tier history limits for a later entitlement pass unless needed now.

Concrete first red tests:

- Settled period appears in settlement history.
- Active unsettled period stays separate from history.
- History row shows period dates and total settled amount.

## Files To Read First Tomorrow

- `BUILD_PLAN.md`
- `PRODUCT_SPEC.md`
- `DESIGN.md`
- `src/features/chores/chore-actions.ts`
- `src/features/chores/child-chore-actions.ts`
- `src/features/parent-dashboard/parent-dashboard-screen.tsx`
- `src/features/child-dashboard/child-dashboard-screen.tsx`
- `supabase/migrations/20260529152107_chore_instances.sql`
- `supabase/migrations/20260529192159_child_chore_flow.sql`

## Commands Worth Keeping Handy

```bash
npm run ios
npm run typecheck
npm run lint
npm test -- --runInBand
npm run db:test
npm run db:reset
```

## Collaboration Note

We should keep using the project principles:

- Think before coding.
- Simplicity first.
- Surgical changes.
- Goal-driven execution.
- Red first, green second, refactor third.

For tomorrow: do not jump straight into broad UI polish again. The UI now has enough life. The product needs the ledger heart next.
