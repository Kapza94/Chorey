# Handoff: Chorey — full app redesign (onboarding + kid app + parent app)

## Overview

This package is the complete visual + interaction design for **Chorey**, a family chore-and-allowance app built around one principle: **40/40/20** — every dollar a kid earns splits into **40% spend (allowance), 40% save (locked), 20% give (charity)**. It covers a full onboarding flow, the kid-facing app, and the parent-facing app (including budgets and an off-app payments dashboard).

Your job: **replace the existing UI in your app with this design**, recreated in your app's own framework.

## About the design files

The files in this bundle are **design references created in HTML/React-via-Babel** — runnable prototypes that show the intended look and behavior. **They are not production code to copy verbatim.** The Babel-in-browser setup, the `Object.assign(window, …)` exports, and the iOS device frame are prototype scaffolding — drop all of that.

**The task:** recreate these designs in the target codebase's existing environment (React Native, Flutter, SwiftUI, React web, etc.), using its established component patterns, navigation, and state management. If the app has a component library, rebuild these screens with it. Match the *visuals and interactions*, not the prototype's file structure.

> The user already has an app with a design they dislike. The goal is a faithful re-skin to this system — keep their data/logic, swap the presentation to match these screens.

## Fidelity

**High-fidelity.** Final colors, typography, spacing, radii, motion, and copy are all specified here and in `colors_and_type.css`. Recreate pixel-faithfully using the codebase's native UI primitives. Designed mobile-first at **390×844 (logical px, iPhone)**; scale to your device metrics.

---

## Design tokens

All tokens live in `colors_and_type.css` (CSS custom properties). Port them to your platform's token system (Tailwind config, theme file, SwiftUI Color set, etc.). Key values:

### Color — neutrals (never pure #FFF / #000)
| Token | Light | Use |
|---|---|---|
| `--cream-2` | `#F6EFE3` | page background |
| `--cream-3` | `#FBF7EE` | cards / raised surfaces |
| `--cream-1` | `#F1E9D9` | sunken / hover |
| `--cream-4` | `#FFFCF5` | modals / sheets |
| `--fg-1` | `#2A2018` | primary text (warm near-black) |
| `--fg-2` | `#5C4E3F` | secondary text |
| `--fg-3` | `#8A7B6A` | meta / tertiary |
| `--fg-4` | `#B5A693` | disabled / placeholder |

Dark mode = warm coffee-bean browns, NOT blue-black: `--ink-1 #1C1814` (page), `--ink-2 #25201A` (raised), `--ink-3 #2F2922` (modal), text `--fg-1-dark #F4ECDC`.

### Color — the 40/40/20 trio (brand DNA — load-bearing, never decorative)
| Bucket | 100 (tint) | 200 | 400 (primary) | 600 (text) | 800 (deep) |
|---|---|---|---|---|---|
| **Allowance / Spend** (peach) | `#FBEAE0` | `#F4CDB9` | `#E8B4A0` | `#C58A72` | `#7E4F3A` |
| **Savings / Save** (lilac) | `#ECE5F5` | `#D9CDEC` | `#C8B8E0` | `#8E7AB5` | `#4F4078` |
| **Giving / Give** (sage) | `#E4EEE5` | `#C9DDCD` | `#A8C9B5` | `#6F9881` | `#3F5E4C` |

The **primary CTA** uses the peach/allowance family: button bg `--accent-600 #C58A72`, text `--cream-4`.

Semantic: success `#6F9881` on `#E4EEE5`; warning `#C28F3F` on `#FAEEDC`; danger `#B26B65` on `#F5DDDC`; info `#6E8E9D` on `#DEE9EE`.

### Typography
- **Display** (balances, page titles, wordmark): **Bricolage Grotesque** — 700 for hero numbers, 600 for titles. Letter-spacing −0.02em on large sizes.
- **Body / UI**: **Plus Jakarta Sans** — 400 body, 600 labels, 700 buttons.
- **Mono** (receipts/IDs): **JetBrains Mono**.
- All three load from Google Fonts. Money ALWAYS uses **tabular figures** (`font-variant-numeric: tabular-nums`) and shows **2 decimals** in $ locales (0 in RSD — see Currency).
- Scale (px): xs 12 · sm 14 · base 16 · md 18 · lg 22 · xl 28 · 2xl 36 · 3xl 48 · 4xl 64 · 5xl 88.

### Spacing — 4-pt grid
4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64. Cards pad 16–24. Section gaps 24–32.

### Radii
xs 6 · sm 10 · **md 14 (default card/input)** · lg 20 (sheets) · xl 28 (hero cards) · **pill 999 (buttons only)**. Nothing above 28 except hero/pill.

### Shadows (warm, low — never blue)
- `--shadow-xs`: `0 1px 0 rgba(42,32,24,0.04)` — most cards rest on a hairline only.
- `--shadow-md`: `0 4px 12px rgba(42,32,24,0.06), 0 1px 2px rgba(42,32,24,0.04)` — hero/balance cards.
- `--shadow-lg`: `0 12px 32px rgba(42,32,24,0.10)` — sheets/modals.
- Hairline border: `1px solid rgba(42,32,24,0.06)` light / `rgba(244,236,220,0.08)` dark.

### Motion
- Easing: `cubic-bezier(0.22,0.61,0.36,1)` default; `cubic-bezier(0.34,1.56,0.64,1)` (small spring) for the chore-check only.
- Durations: 140ms press · 220ms open/close · 360ms full-screen.
- **Press:** `scale(0.97)` 140ms. **Card hover:** border soft→mid, shadow unchanged. **No confetti, no infinite spinners, no sound.**

---

## Iconography
**Lucide** icons — 2px stroke, rounded caps/joins. Sizes 16 (chips) / 20 (lists) / 24 (tabs, buttons) / 32 (empty states). Icons inherit `currentColor`; in bucket contexts use that bucket's `-600` shade. Use `lucide-react` / `lucide-react-native` in your app. Icons referenced: `check`, `check-circle-2`, `plus`, `chevron-right`/`chevron-left`, `home`, `heart`, `user`, `settings-2`, `lock`, `gift`, `wallet`, `sparkles`. **No emoji as icons.**

---

## Screens / Views

### A. Onboarding (12 screens, branching)

Linear: **Welcome → The big idea → Choose role →** then either the **Parent** branch or the **Kid** branch. Each screen = full-bleed cream, a top row (back chevron + progress dots), scrollable content, a footer with a primary pill button (full-width) and optional ghost secondary.

1. **Welcome** — centered logo mark (tri-color "C"), wordmark "chorey" (Bricolage 800, −0.04em), tagline "Chores that teach kids to **spend**, **save**, and **give**." (the three verbs colored peach/lilac/sage). Buttons: `Get started` (primary), `I already have an account` (ghost). Subtle fade-up entrance (500ms, staggered 80ms).
2. **The big idea** — title "Every dollar splits three ways.", subtitle "When a kid earns $10, here's where it goes…". Three horizontal bars (Spend 40% $4.00, Save 40% $4.00, Give 20% $2.00) that **animate width 0→target** on mount (700ms, staggered 120ms), each labeled with %+name+amount in the bucket color. A note card with a lock icon: "Savings stays locked — no spend button." Button `I'm in`.
3. **Choose role** — title "Who's setting up?". Two large tappable cards: **I'm a parent** (peach icon tile, user icon) and **Join as a kid** (lilac icon tile, sparkles). Border highlights to the bucket color on hover.

**Parent branch:**
4. **Family setup** — fields: Your name, Family name, and **Country** (select). Country sets the **local currency**; a caption confirms e.g. "Amounts will show in RSD (дин) — your local currency." Continue disabled until all three filled.
5. **Add kids** — name + age + color (peach/lilac/sage/sky swatch) → "Add kid" appends to a list (avatar = first initial, check icon). Add one or more. Continue disabled until ≥1 kid.
6. **Budget & split** — a budget card: **weekly/monthly** segmented toggle + a big `$25 / week` figure with −/+ steppers (step $5). Then the **40/40/20 split**: a segmented bar + three steppers (Spend and Give adjustable in steps of 5; **Save auto-balances** to keep total 100). Caption: "Chores add up toward this. Extra chores beyond the cap still earn." Button `Use the 40/40/20 split`.
7. **First chores** — quick-pick chips (Make the bed $1, Dishes $2.50, Walk the dog $3, Take out trash $2, Tidy room $2, Homework $1.50, Set the table $1, Water plants $1). Tapping toggles selected (peach fill + check). A summary line "Up to $X a day, if all done". Button `Add N chores`.
8. **Charities** — selectable cards (City Food Bank, Animal Shelter, Clean Oceans, Children's Hospital) — icon tile + name + desc + check circle, sage highlight when picked. Button `Continue`, ghost `Skip for now`.
9. **All set (parent)** — spring-in check badge, "You're all set.", summary "(N kids · M chores · up to $X/day)", and a **kid join code** card (e.g. `CHRVR1`, big tracked Bricolage) with a Share affordance. Button `Go to dashboard` → enters parent app.

**Kid branch:**
10. **Enter code** — 6 segmented code cells with a hidden input overlay; active cell border peach. A "Use a sample code" link. Button `Join family` (disabled until 6 chars).
11. **Pick avatar** — large circular avatar preview (initial), color swatch row (peach/lilac/sage/sky), name field. Button `That's me`.
12. **How it works** — "Welcome, {name}!", three rows (Spend/Save/Give) each a bucket-tinted card with icon + title + one-line description. Button `Start earning` → enters kid app.

### B. Kid app — 3 tabs (Home · Wishlist · You)

Bottom tab bar: 64px, cream-90% with `backdrop-filter: blur(20px) saturate(140%)`, hairline top border, active tab = `--accent-600`. Top of each screen reserves ~54px for the device status bar.

- **Home** — header "Hey, {name}." + a streak chip (warning-tinted, flame icon). **Hero balance card** (radius 28, shadow-md): overline "This week so far", giant Bricolage balance `$12` + smaller cents, then the **3 bucket cards** (Spend/Save/Give, each bucket-100 bg, amount in bucket-800; Save shows a lock). Then "Today" with N chores remaining, and the **chore list** (card, hairline rows): each row = a checkbox (26px, rounds to sage fill + white check on done, **220ms spring**), name (strikethrough+faded when done), and value (`$2.50`, turns "+$X" sage when done). Tapping a row toggles it AND updates the hero balance + bucket split live. A single info note explains the split.
- **Wishlist** — header "Wishlist.", a "Spendable now" card (= allowance balance), then wish cards: name, saved/target, % or "Buy it" CTA (when saved≥price), and a progress bar tinted by the funding bucket. A dashed "Add a wish" button.
- **You** — avatar + name/age, a **Savings (locked)** card (amount + "not spendable" lock chip), a **Giving** card (amount + Donate CTA + "Picked: {charity} — $X this month"), and a quick-actions list.

### C. Parent app — 4 tabs (Kids · Chores · Pay · Settings)

- **Kids** — header "Kids." + add button. An approvals banner (warning-tinted) if any chore needs OK. One **KidCard** per kid: avatar + name + "X of Y chores done", big weekly/monthly earned figure, a **budget-cap meter** ("$18.50 of $25 weekly", bar turns sage at 100%, shows "+$X extra" in warning if assigned > cap), the **40/40/20 meter** with inline $ per bucket, and a per-kid approvals chip. Footer: household total with to-spend/save/give breakdown.
- **Chores** — header "Chores." + New button. Per-kid **assigned-vs-cap** mini-cards at top (flags "over cap" in warning). The chore library list (name, freq · kids, value, chevron). **New** opens an **add-chore bottom sheet**: name, reward ($ prefixed), assign-to select, and a **live 40/40/20 split preview** of the entered reward. Confirm `Add chore`.
- **Pay (Payments)** — header "Payments." overline "Off-app payouts". An info note: "Pay your kids however you like — cash or bank transfer. Chorey just keeps the record." **Due this period**: a card per unpaid kid (avatar, "{period} · N chores done", big amount "to pay out", the bucket split mini, and a **Mark as paid** button). A total-to-pay-out row. **Payout history** list (wallet icon, kid, "date · method", amount) with a "this month" total. **Mark as paid** opens a sheet: "Pay {name}.", confirmation copy ("…records it — no transfer happens in the app"), an editable amount, a method segmented control (Cash / Bank transfer / Other), and `Mark $X paid` → moves the kid out of "due" and prepends a history row.
- **Settings** — **Budget per kid**: a card per kid with a weekly/monthly toggle + budget cap + steppers. Then **The split**: 40/40/20 shown big with pastel pills + "Edit per-kid splits" CTA. Then a standard account list (charities, pay-out day, notifications, dark mode). Footer wordmark "chorey · v0.1".

---

## Interactions & behavior (summary)
- **Chore check (kid):** tap row → checkbox springs (220ms), row strikes through, hero balance + 3 buckets recompute (earned × 0.4 / 0.4 / 0.2).
- **Split steppers:** Spend & Give adjust ±5; Save = 100 − Spend − Give (clamped ≥0); the segmented bar reflows.
- **Budget steppers:** ±$5, min $5; cadence toggle weekly/monthly relabels everything ("/wk" ↔ "/mo").
- **Mark-as-paid:** records amount + method off-app; updates "due" and history; no real payment.
- **Over-budget:** assigned chores may exceed the cap — surface a warning indicator, never block.
- **Currency:** chosen by **country at registration**. Format per-locale: e.g. Serbia → RSD `1.500 дин` (0 decimals, symbol after), US → `$25.00`, eurozone → `€25,00`. The prototype renders `$` as a placeholder — implement real locale formatting.

## State management
Per family: `kids[]` (each: name, age, tone/color, cadence `weekly|monthly`, budget, earned, choresDone/Total, pendingApprovals, computed allowance/savings/giving), `chores[]`, `charities[]`, `split {spend, save, give}`, `country/currency`, `payoutHistory[]`, and per-period `paidThisPeriod{}`. Kid earnings derive from completed chores; buckets derive from earned × split. Payments mutate history + paid flags.

## Assets
- `assets/logo-mark.svg` — the tri-color "C" monogram (the 40/40/20 split forms a C). Peach/lilac/sage arc segments.
- `assets/logo-wordmark.svg` — mark + "chorey" wordmark.
- Icons: Lucide (install in your app; don't copy the inline SVGs from the prototype).
- Fonts: Bricolage Grotesque, Plus Jakarta Sans, JetBrains Mono (Google Fonts).

## Files in this bundle
- `CLAUDE_CODE_PROMPT.md` — **start here**: a ready-to-paste kickoff prompt for Claude Code (React Native + Expo + Supabase) with the recommended build order.
- `colors_and_type.css` — all design tokens (port these first).
- `prototype.html` — the full runnable prototype (open in a browser to see every screen + flow; use the left index + top mode switcher).
- `ui_kits/onboarding/*.jsx` — onboarding screens.
- `ui_kits/kid/components/*.jsx` — kid app screens + shared primitives (Icon, KidHeader, KidHeroBalance, BucketTriple, ChoreRow, KidTabBar).
- `ui_kits/parent/components/*.jsx` — parent app screens (Kids, Chores, Payments, Settings) + primitives (ParentHeader, KidCard, ParentTabBar).
- `assets/` — logo SVGs.
- `README.md` (top-level, also bundled) — brand voice, content rules, visual foundations.

> Read the JSX as **design reference** — the exact spacing/colors/copy are authoritative; the React-via-Babel wiring is not. Rebuild in your stack.
