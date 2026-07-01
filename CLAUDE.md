# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run the app
npm start            # Expo dev server (scan QR for device/simulator)
npm run ios          # iOS simulator
npm run android      # Android emulator

# Quality checks
npm test             # Jest (jest-expo preset)
npm run test:watch   # Jest in watch mode
npm run typecheck    # tsc --noEmit
npm run lint         # expo lint (ESLint)

# Run a single test file
npx jest src/__tests__/money.test.ts

# Database (requires Supabase CLI + Docker)
npm run db:reset     # Reset local DB and re-run all migrations
npm run db:test      # Run SQL tests in supabase/tests/
```

## Git workflow

Branch roles:
- **`dev` = the working / integration branch.** All feature work is integrated here.
- **`main` = the release branch.** App Store / TestFlight builds are ALWAYS built from `main` — never from `dev`, a feature branch, or any other branch.

Day-to-day:
- Base every feature/fix on a new feature branch created off `dev`.
- Do work and commit on that feature branch — never commit or push *directly* to `dev`.
- When the feature is ready, **merge the feature branch into `dev`** and push `dev`. Keep `dev` up to date as each feature lands.

Releasing to the App Store / TestFlight:
1. Make sure `dev` is up to date — every feature branch for this release is merged into `dev`.
2. Merge `dev` → `main` and push `main`.
3. Confirm there are no merge conflicts; resolve/squash any that exist.
4. Verify `main` is green (`npm run typecheck` + `npm test`).
5. Verify migrations are pushed to the remote DB: `supabase db push` (or confirm `supabase migration list` shows no local-only rows). App code must never ship ahead of the deployed schema — a missing column 400s and can blank screens.
6. Build + submit from `main` (`eas build --platform ios --profile production --auto-submit`).

## Environment

Requires a `.env.local` with:
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## Architecture

### Product overview

Chorey is a family chore and allowance app. Every approved paid chore reward is split across **Spend / Savings / Giving** — default **40/40/20**, parent-adjustable in Settings with a **10% Giving minimum** (`MIN_GIVE_PCT` in `src/features/money/split.ts`). The app tracks a virtual ledger; no real money moves.

Two user types:
- **Parents** — sign in with Supabase Auth (Apple, Google, OTP/magic link). Manage the household, create chores, approve or send back completed work.
- **Children** — access via a parent-generated **access code** (`CHOREY-XXXXXXXX`, stored in `child_access_codes`). No email/password. Children never see billing.

### Directory structure

```
src/
  app/              # Expo Router file-based routes
  features/         # Feature modules (see pattern below)
  components/       # Shared UI primitives (brand-icons, status-icons, setup-screen-layout)
  domain/           # Pure domain logic (household access)
  lib/              # Supabase client, env config
  theme/            # choreyTheme design tokens
  __tests__/        # All Jest tests
supabase/
  migrations/       # Ordered SQL migrations (applied via db:reset)
  tests/            # SQL/RLS integration tests
```

### Screen / Actions pattern

Every feature screen is a **pure React component** — it receives all side-effectful behavior through typed `actions` or callback props. The `default-*-actions.ts` files wire those types to the real Supabase client and are imported by Expo Router route files.

Example:
- `parent-sign-in-screen.tsx` — pure UI, accepts `ParentSignInActions`
- `parent-auth-actions.ts` — factory `createParentAuthActions(client, redirectUri)`
- `default-parent-auth-actions.ts` — calls the factory with the real `supabase` client
- `src/app/parent/sign-in.tsx` — Expo Router route, imports the default actions

This keeps screens fully testable without mocking the Supabase client.

### Money / ledger

All monetary values are **integer cents** throughout. Never use floats for money.

- `money.ts` — `parseRewardCents`, `formatReward`, `splitRewardCents` (the 40/40/20 split with remainder-largest-bucket distribution)
- The split is also enforced **in the database** via a Postgres trigger (`create_ledger_events_when_chore_approved`) that fires when a `chore_instances` row transitions to `status = 'approved'`. Zero-reward chores create no ledger entries.
- `ledger_events` has a `unique (chore_instance_id, bucket)` constraint — double-credit is impossible.

### Database / RLS

All tables have RLS enabled. Key tables:
- `households`, `household_members` — parent membership
- `child_profiles` — child records belonging to a household
- `child_access_codes` — `CHOREY-XXXXXXXX` codes linking children to devices
- `chore_instances` — one row per assigned chore per child (`assigned → submitted → approved | sent_back`)
- `ledger_events` — immutable credit events (spend/savings/giving) created by trigger

Child-facing Supabase RPCs (`list_child_chores`, `submit_child_chore`, `resolve_child_access_code`, `get_child_bucket_balances`) use `security definer` and accept an access code string — children are not authenticated Supabase users.

### Styling

All styling uses `choreyTheme` from `src/theme/chorey-theme.ts` — colors, spacing, radii, shadows, and per-bucket tokens (`spend`, `savings`, `giving`). No external UI component library; all UI is built from React Native primitives styled inline with `choreyTheme` values.

Bucket colors: Spend = `#F3B58E`, Savings = `#C9B7E8`, Giving = `#A9CDB0`.

### Testing approach

- **Unit tests** for pure logic (money calculations, action factories with stub clients).
- **Component tests** with React Native Testing Library — screens are tested by rendering with mock props/actions.
- **SQL tests** in `supabase/tests/` for RLS and trigger behavior.
- TDD is the development method: red → green → refactor.
- Import alias `@/` maps to `src/`.
