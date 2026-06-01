# Claude Code kickoff — Chorey design adoption

> Paste the prompt below into Claude Code with this `design_handoff_chorey/` folder present in the repo.

## Project context (already true in this repo)
- **Stack:** React Native + Expo, Supabase backend. The app is ~half built — Claude already knows the codebase.
- **Goal:** make the UI a **carbon copy** of the Chorey design in this folder. Where the design implies logic the current app is missing (40/40/20 split, per-kid budget caps + weekly/monthly cadence, off-app payments tracking, country→currency at registration), **adopt it — even if that means replacing existing logic.** The design is the source of truth.

---

## THE PROMPT (paste this)

I'm adopting a finished design for this app. Everything is in `design_handoff_chorey/`. I want a **carbon copy** of this design — visuals, interactions, and the product logic behind it. Where my current app's logic differs or is missing, **replace it to match the design.** The design is authoritative.

Do this in order, and check in with me after each step:

**1. Read first.**
- `design_handoff_chorey/README.md` (the full spec — tokens, every screen, interactions, state model).
- `design_handoff_chorey/colors_and_type.css` (all design tokens).
- Open `design_handoff_chorey/prototype.html` in a browser to see the exact look + flow (left index + top mode switcher walk through all screens).

**2. Build the token system.** Port the tokens into our theme (cream neutrals, the 40/40/20 peach/lilac/sage trio with 100–800 ramps, warm-dark mode, type scale with Bricolage Grotesque + Plus Jakarta Sans, radii, warm shadows, motion). Set up the fonts (expo-font / expo-google-fonts) and `lucide-react-native` for icons. Make a single source of truth (theme file + hooks) so every screen pulls from it.

**3. Core data model + logic (adopt fully, replace mine if needed).**
- **40/40/20 split:** every earning splits into spend 40 / save 40 / give 20 (configurable per family; Save auto-balances). Buckets derive from `earned × split`. Savings is **locked** — no spend path.
- **Budgets:** per-kid budget cap + cadence (`weekly | monthly`). Chores accrue toward the cap; **extra chores beyond the cap are allowed** and still earn (surface a warning, never block).
- **Off-app payments:** there is NO in-app money movement (not viable in Serbia). Parents pay directly; the app records payouts (amount + method: cash / bank transfer / other) with history + a "this month" total. Build the Supabase tables/queries for `payouts`, per-kid `budget`/`cadence`, `split`, and `country`/`currency`.
- **Currency from country:** captured at registration; format per-locale (Serbia → `1.500 дин`, 0 decimals, symbol after; US → `$25.00`; eurozone → `€25,00`). Replace any hard-coded `$`.

**4. Rebuild screens to match pixel-faithfully**, reusing our components and wiring to Supabase. Suggested order (highest value first):
1. **Kid · Home** (hero balance + 3 buckets + chore check-off with the 220ms spring) — the heart of the app.
2. Kid · Wishlist, Kid · You.
3. Parent · Kids (KidCard with budget meter + 40/40/20 meter).
4. Parent · Payments (due-this-period + Mark-as-paid sheet + history).
5. Parent · Chores (library + budget-vs-cap + add-chore sheet with live split preview).
6. Parent · Settings (per-kid budget/cadence + split).
7. Onboarding (12 screens, branching parent/kid — including the country/currency step).

**Rules:** match spacing, colors, radii, copy, and motion exactly as specified in the README. The HTML/JSX in the bundle is **design reference only** — do not paste the Babel/`window` scaffolding or the iOS frame; rebuild natively. Keep my Supabase auth/data layer; swap presentation + the logic listed above. Use cream surfaces (never pure white), warm-dark (never blue-black), tabular figures for money, and Lucide icons (no emoji).

Start with step 1 and show me the token file before moving on.

---

## Build-order checklist (for your own tracking)
- [ ] Theme/tokens ported + fonts + Lucide wired
- [ ] Supabase schema: kids(budget, cadence), split, country/currency, payouts(amount, method, date)
- [ ] 40/40/20 derive logic + locked savings
- [ ] Currency locale formatter (replaces `$`)
- [ ] Kid: Home → Wishlist → You
- [ ] Parent: Kids → Payments → Chores → Settings
- [ ] Onboarding 12 screens (incl. country step)
- [ ] Dark mode pass
