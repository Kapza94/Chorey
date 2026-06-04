# Chorey Handover — resume point

Last updated: Thursday, June 4, 2026. Written to hand this session off to the
Claude Code **app** (this CLI session won't be listed under the renamed project,
which is why this file exists).

## ✅ The folder rename is DONE

The trailing space is gone — the project is now
`/Users/kapza/Documents/Projects/Chorey` (no space). Open **that** path in the
Claude Code app; the workspace-trust prompt will appear normally — approve it.

Metro and local Supabase were **stopped** for the rename. Bring them back up from
the renamed folder before resuming the round-trip:

```
cd /Users/kapza/Documents/Projects/Chorey
npx supabase start     # starts a fresh local stack (new container: supabase_db_Chorey)
npm run db:reset       # apply all migrations to the empty local DB
npx expo start -c      # then: xcrun simctl openurl booted "exp://127.0.0.1:8081"
```

Then continue at "How to finish the round-trip" below (step 3 onward). The DB
container is now **`supabase_db_Chorey`** (no trailing underscore) — or just
`docker ps --format '{{.Names}}' | grep supabase_db` to find it.

## TL;DR of where we are

- Branch: `feature/design-system-redesign`. Nothing pushed to origin.
- The **wiring phase** is underway. **Onboarding persistence is built, tested,
  and committed** — finishing the parent onboarding now writes real Supabase
  rows instead of the in-memory preview.
- We are **mid a live end-to-end round-trip against LOCAL Supabase** to watch
  the rows land. That's the only thing left to finish for today.

## What shipped today (committed)

- `2a2a0d1` — tappable custom budget amount + "add your own" first chore.
- `1b830e5` — **persist onboarding to Supabase behind an email-OTP account step**:
  - New `p_account` onboarding step (email → 6-digit code, verified in-app) before
    the "You're all set" screen. See `src/features/onboarding/onboarding-flow.tsx`
    (`OBParentAccount`).
  - `src/features/onboarding/onboarding-persistence.ts` orchestrates the writes:
    household (locale/currency/split/cadence) → each kid (budget/cadence/age/tone)
    + generated 6-digit access code → starter chore instances per kid → charities
    into `giving_options`. Wired for the signed-in parent in
    `default-onboarding-persistence.ts`; `src/app/index.tsx` passes `auth` + `persist`.
  - Extended `createHousehold` (optional `split`) and `createChild` (optional
    `age/tone/budgetCents/cadence`) — fields only written when supplied.
  - New migration `supabase/migrations/20260604090000_giving_options_parent_insert.sql`
    (parent admins can insert giving options) + RLS-as-parent SQL test.
- Verified: `npm run db:reset` clean, **128 SQL tests** + **152 Jest tests** pass,
  `npm run typecheck` clean.

## How to finish the round-trip (the open task)

The app's `.env.local` already points at **local** Supabase
(`http://127.0.0.1:55431`) — zero risk to the live DB. Local DB starts empty.

1. Local Supabase up? `npx supabase status` (if down: `npx supabase start` then
   `npm run db:reset`). Mailbox UI: http://127.0.0.1:55434 (Mailpit).
2. Start Metro: `npx expo start -c`. Open in the booted simulator (Expo Go):
   `xcrun simctl openurl booted "exp://127.0.0.1:8081"`.
3. Walk the **parent** onboarding. At **"Save your family."** enter any email
   (local — nothing really sends) → **Email me a code**.
4. Get the 6-digit code from the mailbox: open http://127.0.0.1:55434, or
   `curl -s http://127.0.0.1:55434/api/v1/messages` → newest message →
   `curl -s http://127.0.0.1:55434/api/v1/message/<ID>` → grab the 6-digit token.
5. Enter the code → **Create account & finish** → "You're all set."
6. Confirm rows landed (DB container `supabase_db_Chorey_`):
   `docker exec -i supabase_db_Chorey_ psql -U postgres -At -c
   "select 'households='||count(*) from public.households;
    select 'kids='||count(*) from public.child_profiles;
    select 'codes='||count(*) from public.child_access_codes;
    select 'chores='||count(*) from public.chore_instances;
    select 'giving='||count(*) from public.giving_options;"`

## ⚠️ The trailing-space folder gotcha (why the app errored)

The project folder is literally named `Chorey ` (**trailing space**). The Claude
Code app trims it to `…/Chorey` (which doesn't exist) → `WorkspaceTrustError`,
no prompt. Two ways forward:
- **Preferred (keeps this session resumable):** in the app, open the folder via
  the Finder picker so it passes the real path *with the space* — that path is
  already trusted in `~/.claude.json`.
- **Permanent fix (starts a fresh app session):** rename `Chorey ` → `Chorey`.
  First stop Metro and `npx supabase stop`, then `mv "…/Chorey " "…/Chorey"`,
  then restart. This changes the project path, so this CLI conversation won't be
  listed under the renamed project — that's why this handover exists.

## Follow-ups (not blocking)

- "You're all set" screen still shows a *derived* join code; swap it for the
  **real** generated access code from persistence.
- Premium kid gating in onboarding (free = 1 kid; backend already enforces it).
- Wiring **step 3**: feed the Parent + Kid apps from real data instead of the
  sample handoff (`onboarding-handoff.ts`).
- `BUILD_PLAN.md` has one uncommitted note (per-child payout-history tabs).
