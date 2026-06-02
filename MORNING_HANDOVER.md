# Chorey Morning Handover

Last updated: Tuesday, June 2, 2026 (late night), Europe/Belgrade.
Session focus: built the **entire Chorey visual redesign** from `design_handoff_chorey/` — onboarding, kid app, parent app, light + dark mode.

## ⏰ FIRST THING TOMORROW (before building anything)

**Remind Luka to walk through the whole app in the simulator and actually test it.**
Last night was late and he hadn't done much testing yet. Do a real run-through —
onboarding (both parent + kid branches), the kid tabs, the parent tabs, and a
dark-mode pass — and note anything that looks/feels off **before** starting new
work. Then kick off the next phase together.

How to run + test:
- Start: `npx expo start -c` (the `-c` clears cache; needed if fonts/routes seem stale). Then `r` in Metro to reload.
- The app now **boots into the new onboarding**. Finish as a parent → lands on the new Parent app; finish as a kid → lands on the new Kid app.
- Dark mode: there is **no in-app toggle** (by design it follows the phone). To test, toggle the simulator appearance: **Features → Toggle Appearance** or **⇧⌘A**.

## Where everything stands

**Branch:** `feature/design-system-redesign` (off `dev`). Working tree clean. **Nothing pushed to origin yet.**

The whole **visual redesign is DONE** and every original build-checklist item is complete. Typecheck clean; **160 tests across 39 suites all pass** (`npx jest`).

| Build-order item | State |
|---|---|
| Theme tokens + fonts (Bricolage/Jakarta/JetBrains) + Lucide | ✅ |
| 40/40/20 logic + locked savings + configurable split | ✅ |
| Currency locale formatter (replaces `$`; USD/EUR/GBP/RSD) | ✅ |
| Supabase schema (country/currency, split, budget/cadence, payouts) | ✅ migration written |
| Kid app: Home → Wishlist → You | ✅ |
| Parent app: Kids → Payments → Chores → Settings | ✅ |
| Onboarding (12 screens, parent + kid branches) | ✅ |
| Dark-mode pass | ✅ |

Recent commits (newest first): `a6771d7` dark-mode pass · `70381c0` onboarding add-kid redesign · `1fb7a57` boot into onboarding + walkable home routes · `141f25a` onboarding flow · Parent tabs (`edef59e`/`b2359bd`/`7b0a2e2`/`9c70cc9`) · Kid app (`411e206`/`2c87c24`) · data model (`99d7bd1`) · money utils (`92fb6e1`) · tokens (`1c150ae`).

## ⚠️ The big thing left: "make it real" (the wiring)

The app is a **beautiful showroom**: every screen looks and works, but **nothing is saved to the database yet**, and the numbers in the kid/parent apps are **stand-in sample data**, not real. Luka understands this in plain terms.

This is the agreed **next phase** and the headline task. It needs Luka's explicit
**"go"** because step 1 changes his **live Supabase database**:

1. **Apply the data-model migration** to the live project — `supabase/migrations/20260602080000_design_data_model.sql` (adds country/currency + split to households, budget/cadence/age/tone to child_profiles, and the `payouts` table). It has NOT been applied to any DB yet (no local Docker this session). Can apply via the Supabase MCP `apply_migration` — but confirm with Luka first; explain each step since he's non-technical.
2. **Onboarding persistence** — make `onComplete` actually create the household (+country/currency/split/budget/cadence), the kid(s), the picked chores, and the charities in Supabase, instead of the in-memory handoff.
3. **Real data in the apps** — point the parent route at `ParentApp` fed by live per-kid aggregates (earned/allowance/savings/giving, chores done/total, pending approvals, assigned-vs-budget), and the kid route at real ledger/chore/wishlist data (the kid `/child/dashboard` route is already wired to `KidApp` from real data; the seeded `/child/home` + `/parent/home` are preview-only).

### Smaller follow-ups (do alongside the wiring)
- **Premium kid gating:** onboarding's "+ Add another kid" should respect the plan (free = 1 kid; the backend `canAddChild` already enforces it, the UI doesn't).
- **Kid "Add a wish" / "suggest giving" inputs** aren't in the new Kid UI yet (the old `ChildDashboardScreen` that had them is now orphaned/unused).
- **In-app dark-mode toggle:** Luka declined for now — the "Dark mode · Auto" row in Parent Settings is a static label, not wired. Leave as-is unless asked.

## How the preview wiring works (so you don't get confused)
- Entry `src/app/index.tsx` → `OnboardingFlow`; on finish it stashes the result in `src/features/onboarding/onboarding-handoff.ts` (in-memory) and routes to `/parent/home` or `/child/home`.
- `/parent/home` + `/child/home` render the real `ParentApp`/`KidApp` **seeded from that handoff with light sample activity** — this is preview plumbing so the redesign is walkable without the DB. Replace with real data in the wiring phase.

## Gotchas
- **Project dir name has a trailing space:** `/Users/kapza/Documents/Projects/Chorey ` — quote it; plain `cd .../Chorey` fails.
- Design files in `design_handoff_chorey/` are **reference only** (prototype HTML/JSX) — match visuals/copy, don't paste their scaffolding.
- Theme: brand bucket colors used as **text** go through `bucketInk(bucket)` (light=deep, dark=light pastel); solid `-400/-200` backgrounds stay constant. Surfaces/text come from `useChoreyTheme().scheme`.
- Old screens (`WelcomeScreen`, old parent/child dashboards) still exist but are no longer the entry; they'll be removed once the new flow fully replaces them.
