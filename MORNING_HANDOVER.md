# Chorey Morning Handover

Last updated: Monday, June 1, 2026 (late night), Europe/Belgrade.
Session focus: **adopting the finished Chorey design** from `design_handoff_chorey/` (carbon-copy re-skin + the product logic behind it).

## Read This First (TL;DR)

We started the design adoption. Tonight we (1) consolidated all pre-design feature
work into `dev`, (2) branched a clean redesign branch off it, and (3) built the
**foundation**: the full design-token system, theme + font hooks, and the core
money logic (currency formatting + configurable 40/40/20 split).

Everything is committed. Working tree is clean. **Nothing is pushed to `origin` yet.**

We stopped at a decision point: **what to build next** (see "Resume Here").

## Git State

- **Current branch:** `feature/design-system-redesign` (branched off `dev`). No upstream set — not pushed.
- **`dev` now contains all pre-design work.** Tonight we merged three previously-unmerged feature branches into `dev`, resolving real conflicts in the parent/child dashboard files by **keeping both features** (giving + settlement + spend-wishlist all coexist):
  - `feature/giving-options`
  - `feature/settlement-foundation`
  - `feature/spend-wishlist`
  - (`feature/entitlements` and the parent-tab/navigation branches were already in `dev`.)
- Recent commits on `feature/design-system-redesign`:
  - `92fb6e1 feat: add locale currency formatter and configurable 40/40/20 split`
  - `1c150ae feat: port Chorey design tokens, theme hook, and font loading`
  - `94a0b43 Merge feature/spend-wishlist into dev`
  - `d675df4 Merge feature/settlement-foundation into dev`
  - `094f24a Merge feature/giving-options into dev`

> If we want the merged `dev` and the redesign branch on the remote, push both
> (not done yet, intentionally): `git push -u origin dev` and
> `git push -u origin feature/design-system-redesign`.

## What's Done This Session

### Step 1 — Read the handoff ✅
Read `design_handoff_chorey/README.md`, `colors_and_type.css`, and `CLAUDE_CODE_PROMPT.md`.
Design is authoritative; we replace existing logic where it differs.

### Step 2 — Token system + hooks + fonts ✅ (committed `1c150ae`)
- **`src/theme/chorey-theme.ts`** — single source of truth. Full design tokens:
  cream 0–4 + ink 0–4 ramps, fg/fgDark text ramps, the **40/40/20 trio**
  (allowance/savings/giving, each `100/200/400/600/800` + `tintDark`), accent,
  semantic, borders, radii, 4-pt spacing, type presets (`typography.text.*`),
  warm RN shadows (light/dark), motion (bezier easings + 140/220/360 durations),
  and light/dark `schemes`.
  - **Legacy keys preserved** (`colors`, `radii`, `spacing`, `shadows`, `buckets`)
    but remapped to design-authoritative values so the ~15 existing screens keep
    compiling untouched. Notably **`colors.primary` is now peach `#C58A72`** (was
    the old green) and surfaces use the exact cream ramp.
- **`src/theme/use-chorey-theme.ts`** — `useChoreyTheme(override?)`: returns all
  static tokens + the `scheme` resolved for the device light/dark mode
  (`scheme`, `mode`, `isDark`). Pull surfaces/text/borders from `scheme`; pull
  the brand trio + type presets from the static tokens.
- **`src/theme/use-chorey-fonts.ts`** — loads Bricolage Grotesque, Plus Jakarta
  Sans, JetBrains Mono and registers them under the short family names the theme
  uses (e.g. `Bricolage_700Bold`, `Jakarta_400Regular`). Never blocks on font error.
- **`src/app/_layout.tsx`** — gates the splash screen until fonts load (no font swap).
- Deps added: `@expo-google-fonts/{bricolage-grotesque,plus-jakarta-sans,jetbrains-mono}`.
  `lucide-react-native` already present; verified all 13 design-referenced icons export.

### Step 3 (logic half) — Money model ✅ (committed `92fb6e1`)
- **`src/features/money/currency.ts`** — replaces the hard-coded `$`.
  `currencyForCountry(countryCode)` + `formatMoney(cents, currency)` +
  `formatMoneyDelta`. Verified: USD `$25.00`, EUR `€25,00`, RSD `1.500 дин`
  (0 decimals, symbol after). Amounts stay stored as integer **cents**.
- **`src/features/money/split.ts`** — configurable 40/40/20. `DEFAULT_SPLIT`,
  `balanceSplit(spend, give)` (**Save auto-balances**, never negative, step 5),
  `isValidSplit`, `splitCents(cents, split)` (remainder-safe, generalizes the old
  fixed `splitRewardCents`). Savings is conceptually **locked** (no spend path).
- Tests: `src/__tests__/currency.test.ts`, `src/__tests__/split.test.ts`.

## Verification

- `npx tsc --noEmit` → clean.
- `npx jest` → **all green** (34 suites / 129 tests as of the last run; re-run to confirm).
- Has NOT been launched in a simulator this session — only typecheck + tests.
  Worth a `expo start` smoke test in the morning to see the peach CTA / fonts live.

## Resume Here (the open decision)

Step 3 still needs **Supabase persistence**, and Step 4 (screen rebuilds) hasn't
started. We paused to choose the next chunk. Options on the table:

1. **Kid Home screen (Step 4 — "the heart").** Highest visible value. Rebuild
   pixel-faithful: header + streak chip, hero balance card, 3 bucket cards
   (Save shows a lock), Today chore list with the **220ms spring** check-off that
   live-recomputes the hero balance + buckets. Use the new theme + `splitCents` +
   `formatMoney`. Note: design splits the Kid app into 3 tabs (Home/Wishlist/You),
   so this also implies starting the Kid tab nav.
2. **Supabase data model (finish Step 3).** One migration adding: `households`
   → `country`, `currency`, `split_spend/save/give`; `child_profiles` → `age`,
   `tone`, `budget_cents`, `cadence` (reuse `settlement_frequency` enum =
   weekly|monthly); new **`payouts`** table (`household_id`, `child_profile_id`,
   `amount_cents`, `method` cash|bank_transfer|other, `paid_at`). Plus actions +
   SQL tests. Less visible but unblocks Parent Payments/Settings.
3. **Country/currency context.** Smaller slice: a `CurrencyProvider` + `useCurrency()`
   so every screen formats in the family currency; sets up the registration country step.

**Recommendation:** do #2 (data model) briefly to unblock real data, then #1
(Kid Home) — OR just do #1 against client-computed/mock data if we want a visual
win first. Your call in the morning.

## Build-Order Checklist (from the handoff prompt)

- [x] Theme/tokens ported + fonts + Lucide wired
- [~] 40/40/20 derive logic + locked savings (logic done; locked-savings UI pending)
- [x] Currency locale formatter (replaces `$`)
- [ ] Supabase schema: kids(budget, cadence), split, country/currency, payouts(amount, method, date)
- [ ] Kid: Home → Wishlist → You
- [ ] Parent: Kids → Payments → Chores → Settings
- [ ] Onboarding 12 screens (incl. country step)
- [ ] Dark mode pass

## Gotchas / Notes

- **The project directory name has a trailing space**: `/Users/kapza/Documents/Projects/Chorey ` (note the space). Plain `cd .../Chorey` fails — quote the path with the trailing space.
- The HTML/JSX in `design_handoff_chorey/` is **design reference only** — match
  visuals/copy/spacing/motion; do NOT paste the Babel/`window` scaffolding or iOS frame. Rebuild natively.
- Keep the existing Supabase auth/data layer; swap presentation + the logic noted above.
- Theme font-family strings in `chorey-theme.ts` MUST stay in sync with the keys
  registered in `use-chorey-fonts.ts`.
- Use cream surfaces (never pure white), warm-dark (never blue-black), tabular
  figures for money, Lucide icons (no emoji).
