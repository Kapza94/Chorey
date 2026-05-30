# Chorey Build Plan

This plan is the implementation guide for Chorey. The project should use TDD wherever practical: write the failing test first, implement the smallest change that makes it pass, then refactor only when the tests stay green.

Reference documents:

- `PRODUCT_SPEC.md`
- `Agents.md`

## Current Progress

- Phase 0 foundation is implemented and verified.
- Phase 1 parent auth is implemented for local OTP sign-in, with Apple/Google UI actions wired for provider configuration later.
- Phase 1 household creation is implemented and routes into first child setup.
- Phase 1 first child profile creation is implemented at the action and screen level.
- Phase 1 setup now lands on a parent dashboard shell after the first child is added.
- Phase 1 child access is implemented as a parent-generated code flow with child login and child dashboard landing.
- Phase 2 manual chore creation is implemented as a first vertical slice: parent dashboard entry, create-chore screen, database-backed chore insert, RLS, and dashboard return state.
- Phase 2 child chore list and submit flow is implemented: child dashboard loads assigned chores by access code, child can mark a chore done, and status changes to submitted.
- Phase 2 parent approval is implemented: parent dashboard loads household chores, refreshes on focus, and parent admins can approve submitted chores.
- Phase 3 ledger foundation is implemented: approved paid chores create 40 / 40 / 20 ledger events, zero-reward chores create no ledger entries, and parent/child dashboards load bucket totals from the ledger.
- Phase 5 Spend wishlist first slice is implemented: children can create wishlist items, request purchases when Spend balance is sufficient, and parents can approve requests with Spend ledger deduction.

## Build Principles

- Red first, then green, then refactor.
- Every feature should have a clear success condition.
- Keep changes surgical and scoped to the current phase.
- Prefer simple implementation over speculative architecture.
- Use integration tests for behavior that crosses auth, database, ledger, or entitlement boundaries.
- Use unit tests for pure calculations and state transitions.
- Use UI tests for critical parent/child flows once screens exist.

## Proposed Test Stack

Decide exact tooling during project setup, but the recommended baseline is:

- Unit and component tests: Jest or Vitest with React Native Testing Library.
- Database tests: Supabase local development database with SQL/RLS test fixtures.
- E2E tests: Maestro or Detox for key mobile flows.
- Type checks: TypeScript strict mode.
- Lint/format: project-standard ESLint/Prettier setup.

## Phase 0: Project Foundation

Goal: create a working Expo + React Native + TypeScript foundation with the Chorey design system ready to use.

Red:

- Add a smoke test that expects the root app shell to render.
- Add a type-check command that initially runs in CI/local scripts.
- Add a design-token import test or snapshot for the core bucket colors.

Green:

- Scaffold Expo app with TypeScript and Expo Router.
- Add base routes for auth, parent app, and child app.
- Add initial theme tokens from the design handoff, renamed from Sprout to Chorey where visible.
- Add test, typecheck, and lint scripts.

Verify:

- App boots locally.
- Test script passes.
- Typecheck passes.
- No visible Sprout naming in user-facing app shell.

## Phase 1: Auth, Household, And Roles

Goal: parents can sign in, create a household, add one child, and roles are represented correctly.

Red:

- Write auth flow tests for parent sign-in route rendering Apple, Google, and magic link/OTP options.
- Write database tests for household membership access rules.
- Write unit tests for role helpers: parent admin, child, household entitlement.
- Write a failing RLS test proving a child cannot access sibling data.

Green:

- Configure Supabase client.
- Implement parent auth UI with Apple, Google, and OTP/magic link options.
- Create database schema for profiles, households, household_members, and child_profiles.
- Implement one-household-per-child rule in v1.
- Add initial RLS policies.
- Add child access model placeholder or first implementation, depending on final auth design.

Verify:

- Parent can create household.
- Parent can add one child.
- Child-facing queries return only that child's data.
- Parent queries return household data only.

## Phase 2: Manual Chores And Approval Flow

Goal: parents can create manual one-off chores; children can submit them; parents can approve or send back.

Red:

- Unit test chore status transitions: assigned -> submitted -> approved.
- Unit test send-back transition requires a reason.
- Component test child chore row renders reward, checklist, and submit state.
- Integration test approved chore creates the expected approval record.
- Integration test sent-back chore stores reason/note and returns to child.

Green:

- Create chore_templates and chore_instances tables.
- Support paid and unpaid chores.
- Support assigning a chore to one or more children with separate instances.
- Add optional checklist items.
- Require checklist completion before submission.
- Add optional child submission note.
- Build parent create-chore screen.
- Build child chore list and submit flow.
- Build parent approval queue.
- Build approve/send-back actions.

Verify:

- Parent creates a one-off paid chore.
- Child submits it.
- Parent approves it.
- Parent can send a chore back only with a reason.
- Unpaid chores can be completed without ledger impact.

## Phase 3: Ledger And 40 / 40 / 20

Goal: approved paid chores update Spend, Savings, and Giving balances immediately.

Red:

- Unit test 40 / 40 / 20 split for normal amounts.
- Unit test split handles cents deterministically.
- Unit test adjusted approval amount uses final amount, not original amount.
- Integration test approved paid chore creates ledger events.
- Integration test unpaid approved chore creates no money ledger event.

Green:

- Implement money calculation utilities.
- Create ledger_events table.
- Create bucket balance query/view or computed service.
- Add reward adjustment at approval.
- Add child bucket dashboard.
- Add parent child-balance overview.

Verify:

- A $10.00 approved chore creates $4.00 Spend, $4.00 Savings, $2.00 Giving.
- Adjusted rewards split from final approved amount.
- Child dashboard updates after approval.
- Parent overview matches child balances.

## Phase 4: Settlement

Goal: households can use weekly or monthly settlement periods and parents can settle each bucket separately.

Red:

- Unit test settlement frequency can be weekly or monthly only.
- Unit test frequency changes apply only to future periods.
- Integration test active settlement period is generated.
- Integration test Spend, Savings, and Giving can settle independently.
- Integration test free history is limited.

Green:

- Add household settlement frequency setting.
- Create settlement_periods and settlement_bucket_statuses tables.
- Add scheduled job or service for creating settlement periods.
- Build settlement summary screen.
- Build bucket-by-bucket settlement confirmation.
- Add limited history behavior for free tier.

Verify:

- Parent chooses weekly or monthly.
- Chorey creates the correct active period.
- Parent marks Spend settled without requiring Savings/Giving to settle.
- Settled periods appear in history according to entitlement.

## Phase 5: Spend Wishlist

Goal: children can manage Spend wishlist items and request parent-approved purchases.

Red:

- Unit test free tier wishlist limit.
- Integration test child can create wishlist item.
- Integration test child can request purchase only when Spend balance is sufficient.
- Integration test parent approval deducts from Spend balance.

Green:

- Create wishlist_items and purchase_requests tables.
- Build child wishlist UI.
- Build parent purchase approval flow.
- Enforce free active wishlist limit.
- Deduct approved purchases from virtual Spend.

Verify:

- Free child can create up to the configured active item limit.
- Purchase request requires enough Spend balance.
- Parent approval creates ledger deduction and purchase history.

## Phase 6: Giving

Goal: parents manage approved Giving options, children can suggest options, and Giving is chosen during settlement.

Red:

- Integration test child suggestion is not selectable until approved.
- Integration test parent can approve Giving suggestion.
- Integration test Giving option selection is available in free tier.
- Integration test settlement can reference selected Giving destination.

Green:

- Create giving_options and giving_suggestions tables.
- Build parent Giving management UI.
- Build child Giving suggestion flow.
- Build child Giving choice during settlement.
- Ensure Giving behavior is not meaningfully paywalled.

Verify:

- Child suggests a Giving option.
- Parent approves it.
- Child can select it for the settlement period.
- Parent can mark Giving settled.

## Phase 7: Monetization And Entitlements

Goal: RevenueCat controls household entitlements and free/paid limits are enforced.

Red:

- Unit test entitlement resolver: free, trialing, paid, lapsed.
- Unit test free tier feature gates.
- Integration test paid entitlement applies to household, not just purchaser.
- Integration test lapsed multi-child household requires one active free child.
- Component test contextual paywall appears for paid-only features.

Green:

- Integrate RevenueCat.
- Create household_entitlements or subscription_state table.
- Sync RevenueCat state to Supabase.
- Add central Upgrade screen.
- Add contextual paywalls.
- Enforce free limits:
  - 1 child
  - 1 parent admin
  - 5 active manual chore templates
  - limited wishlist items
  - limited history
- Gate paid features:
  - recurring chores
  - reminders
  - multiple children
  - multiple parent admins
  - photo proof
  - secret chores
  - full history
  - rich milestone history

Verify:

- Free parent hits paywall when adding second child.
- Trial unlocks paid features.
- Paid entitlement works for all parent admins.
- Lapsed household keeps history visible but disables paid actions.

## Phase 8: Recurring Chores

Goal: paid households can create recurring chore templates that generate dated instances.

Red:

- Unit test daily recurrence generation.
- Unit test weekly recurrence generation.
- Unit test monthly recurrence generation.
- Integration test free household cannot create recurring chores.
- Integration test recurring template generates child-specific instances.

Green:

- Add recurrence fields to chore_templates.
- Add scheduled generation job.
- Build recurring chore creation UI.
- Add recurrence management controls.
- Prevent recurring generation for lapsed households.

Verify:

- Paid parent creates daily chore.
- Chorey generates the expected next instance.
- Each assigned child receives a separate instance.
- Free users see upgrade prompt instead.

## Phase 9: Reminders And Notifications

Goal: paid households can set general child reminders and optional chore due-time reminders.

Red:

- Unit test reminder permission gate is paid-only.
- Integration test reminder settings are saved per child/chore.
- Notification scheduling test or mocked service test for generated reminders.

Green:

- Add notification permission flow.
- Add Expo Notifications setup.
- Add reminder settings tables.
- Build parent reminder settings UI.
- Add backend reminder scheduling logic.

Verify:

- Paid parent configures child daily reminder.
- Paid parent configures due-time reminder for chore.
- Free parent sees upgrade prompt.
- Notifications are scheduled through the chosen service path.

## Phase 10: Photo Proof

Goal: paid households can require temporary photo proof per chore, with S3 upload and immediate deletion after review.

Red:

- Unit test photo proof gate is paid-only.
- Integration test photo-required chore cannot be submitted without proof.
- Integration test presigned upload metadata is created.
- Integration test approval deletes photo and stores audit metadata.
- Integration test send-back deletes photo and stores audit metadata.
- Integration test expired photo cleanup marks deletion_reason as expired.

Green:

- Add photo_required field to chore templates/instances.
- Add proof_photo_metadata table.
- Implement Edge Function for presigned S3 upload URL.
- Implement client-side compression before upload.
- Add child upload flow.
- Add parent review photo display.
- Delete photo on approve/send-back.
- Add scheduled cleanup for expired abandoned photos.

Verify:

- Paid parent enables Photo required.
- Child must upload one compressed proof photo.
- Parent approval deletes the photo.
- Parent send-back deletes the photo.
- Metadata audit remains without image/thumbnail/public URL.

## Phase 11: Secret Chores

Goal: paid households can create parent-revealed secret chores where first approved completion wins.

Red:

- Unit test winner is first approved completion, not first submission.
- Integration test free household cannot create secret chore.
- Integration test eligible kids see secret chore only after reveal time.
- Integration test losing submissions do not receive reward after winner approved.

Green:

- Add secret chore fields/model.
- Build parent secret chore creation UI.
- Add reveal scheduling.
- Add child secret chore visibility.
- Add winner resolution on approval.

Verify:

- Parent schedules reveal.
- Eligible kids see reward at reveal.
- First approved child receives reward.
- Others see chore no longer available or not won.

## Phase 12: Milestones

Goal: Chorey recognizes progress privately without heavy gamification.

Red:

- Unit test milestone triggers for basic events.
- Unit test milestones are recognition-only.
- Integration test child sees own milestones only.
- Integration test rich milestone history is paid-only.

Green:

- Create milestones table.
- Add basic milestone trigger logic.
- Build child milestone display.
- Build parent milestone visibility.
- Add rich paid milestone history.

Verify:

- Child sees private milestone after qualifying event.
- Parent can see child milestones.
- No leaderboards, XP, levels, or unlock rewards exist.

## Phase 13: Analytics, Observability, And Privacy Checks

Goal: add product analytics and crash reporting without collecting sensitive child content.

Red:

- Unit test analytics helper rejects or omits sensitive payload fields.
- Integration or mock test expected safe events are emitted.
- Error boundary test catches and reports app errors.

Green:

- Add PostHog.
- Add Sentry if viable.
- Add privacy-safe event taxonomy.
- Add app-level error boundaries.
- Add logging conventions for Edge Functions.

Verify:

- Safe events emit for chore and subscription flows.
- No proof photo data, child notes, or sensitive free-text content is tracked.
- Errors report in development/staging.

## Phase 14: Beta Hardening And Store Prep

Goal: prepare Chorey for TestFlight/Play testing with core flows stable.

Red:

- E2E smoke test parent onboarding.
- E2E smoke test create/submit/approve paid chore.
- E2E smoke test ledger split.
- E2E smoke test paywall trigger.
- E2E smoke test settlement.

Green:

- Add EAS Build configuration.
- Add app icons/splash assets.
- Add environment configuration.
- Add privacy policy and terms links.
- Add store-ready subscription copy.
- Add onboarding polish.
- Fix beta-blocking defects only.

Verify:

- iOS build succeeds.
- Android build succeeds.
- Core E2E tests pass.
- App can be distributed to testers.

## Future/Post-MVP

- PDF/export summaries.
- Family challenges.
- Optional chore template packs.
- Promotions/referral discounts.
- Multi-household children.
- Real charity integrations.
- Bank/payment integrations.
- Advanced parent permissions.
