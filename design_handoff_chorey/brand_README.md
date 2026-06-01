# Chorey — Design System

A warm, kid-safe, family-friendly design system for a chore-and-allowance app built around a single financial-literacy principle: **40/40/20** — for every dollar a kid earns, 40% becomes spendable allowance, 40% is locked savings, and 20% is given to charity.

> **Working name.** "Chorey" is a placeholder picked from the growth/saving metaphor. Easy to find-and-replace if the brand lands elsewhere.

---

## Product context

Chorey is a two-sided mobile app (iOS + Android) with **distinct parent and kid surfaces** that share a visual system but differ in tone:

- **Parent surface** — set chores, set $ values, approve completions, configure the 40/40/20 split per kid, set each kid's **budget cap and cadence** (e.g. $25/week or $100/month), manage charities the kid can give to, and track **off-app payouts** on a payments dashboard. Feels like a calm, modern banking app.

### Budgets, cadence, and off-app payments

- **Budget cap + cadence (per kid).** Each kid has a spending budget for a period — weekly or monthly (e.g. Mia $25/week, Eli $15/week). Assigned chores add up toward that cap; the chore library and kid cards show progress against it.
- **Extra chores allowed.** The cap is guidance, not a hard wall — parents can assign chores beyond the budget and the kid keeps earning. The UI just flags when assigned chores exceed the cap.
- **Payments are off-app.** There is no in-app money movement (not viable in Serbia and many markets). The parent pays the kid directly — cash or bank transfer — and uses the **Payments dashboard** to mark each payout as paid (amount + method), with a running history and a "this month" total. Chorey is the record-keeper, not the payment rail.
- **Currency follows the country.** At registration the parent picks their country, and Chorey shows all amounts in that local currency (e.g. Serbia → RSD/дин with no decimals, US → $, eurozone → €). The mock currently renders the chosen symbol; production would format per-locale (grouping, decimal places, symbol position).
- **Kid surface** — see today's chores, tick them off, watch the balance grow across three buckets, browse a wishlist, pick a charity to give to. Same system as parent but a notch larger, a notch warmer, with a subtle satisfying check-off animation.

The 40/40/20 buckets are the brand's hero feature. They get their own three-color pastel trio (peach / lilac / sage) which appears consistently anywhere money is shown — in the kid's dashboard, in the parent's split-configuration screen, on transaction rows, on charity cards.

### What this design system is *not*

- Not glassmorphism. Not gradient-heavy. Not "colorful for the sake of colorful."
- Not a banking-app rebrand of plain Material. It's warm, tactile, paper-like — the design vocabulary closer to Headspace or Maple than to Mint.
- Not a kids-only aesthetic. Both parents and kids should feel at home in it.

### Sources

This system was created **greenfield** — no codebase, Figma, or existing screens were provided. Everything here is a from-scratch design direction calibrated to the brief:

- Two user groups (parent + kid), separate surfaces
- Mobile-first (iOS + Android)
- Light mode = creamy off-white + dusty pastels; dark mode = warm-dark + same pastels
- No glassmorphism, no color blotches, clean and easy
- 40/40/20 financial literacy as the central concept

If you later attach a real codebase or Figma file, this system is structured so the tokens in `colors_and_type.css` can be swapped wholesale without rewriting components.

---

## File index

```
Chorey/
├── README.md                  ← you are here
├── prototype.html             ← ★ full interactive prototype: onboarding → kid app + parent app, with a screen index
├── SKILL.md                   ← agent-skill entrypoint (Claude Code compatible)
├── colors_and_type.css        ← all design tokens — colors, type, radii, motion, semantic classes
├── assets/                    ← logos, wordmark, icon references
│   ├── logo-mark.svg          ← sprout glyph
│   ├── logo-wordmark.svg      ← Chorey wordmark (Instrument Serif)
│   └── icon-sample.svg        ← Lucide reference (see ICONOGRAPHY)
├── fonts/                     ← (Google Fonts loaded via @import; no local TTFs)
│   └── README.md
├── preview/                   ← Design System tab cards
│   ├── colors-*.html          ← cream neutrals, bucket trio, semantic
│   ├── type-*.html            ← display, scale, money, mono
│   ├── spacing-*.html         ← radii, shadows, spacing
│   ├── components-*.html      ← buttons, inputs, cards, chips, list rows, bucket meter
│   └── brand-*.html           ← logo, wordmark, iconography
├── ui_kits/
│   ├── onboarding/            ← full first-run flow (welcome, 40/40/20 idea, role, parent setup, kid join)
│   ├── kid/                   ← kid app: home + 40/40/20 dashboard
│   │   ├── README.md
│   │   ├── index.html
│   │   └── components/        ← JSX components
│   └── parent/                ← parent app: chore management + kid overview
│       ├── README.md
│       ├── index.html
│       └── components/
└── _ds_manifest.json          ← (auto-managed) registers preview cards
```

---

## Content fundamentals

### Voice

- **Warm + encouraging, never saccharine.** "Nice work — you're $4 closer to the skateboard." not "AMAZING JOB SUPERSTAR!!!"
- **Direct.** Kids parse short sentences. Parents are busy. No marketing fluff in the product.
- **"You," not "we" or "the user."** Talk to the kid or parent on the screen, not about them.
- **No exclamation marks except for true wins.** A completed chore gets a quiet check. A goal reached gets one exclamation point.
- **Numbers > adjectives.** "$4.00 → savings" beats "a great chunk saved." Money clarity is the whole point of the app.

### Tone on each surface

| Surface | Voice |
|---|---|
| Kid | Warm, second-person, present tense, short sentences. "Today's chores." "You did it." "Pick a wish." |
| Parent | Calm, factual, slightly more formal. "Approve completions." "Adjust Mia's split." "This week's payouts." |
| Onboarding (both) | Patient, explanatory. The 40/40/20 idea gets two lines of plain-English framing — once. |
| Empty states | Inviting, never apologetic. "Nothing here yet — add your first chore." |

### Casing

- **Sentence case everywhere.** "Add a chore," not "Add A Chore" or "ADD A CHORE."
- **Title case** only for proper nouns and brand names (Chorey, Allowance, Savings, Giving — the three buckets are proper nouns in this product).
- **All-caps** reserved for tiny overline labels (10–12px), used sparingly with 0.10em tracking.

### Emoji

- **Not used in product UI.** No emoji on buttons, in chore titles, in tab labels.
- **Allowed in user-generated content** (chore names a parent types, kid notes). The app doesn't strip them.
- We never substitute emoji for icons. If we need a charity icon, we use a Lucide glyph.

### Numbers & money

- Always show two decimal places: `$4.00`, never `$4`.
- Use tabular figures (`font-variant-numeric: tabular-nums`) anywhere money lines up in a column.
- The 40/40/20 split is shown as: `40 / 40 / 20` with thin spaces, or as three labeled chips (Allowance · Savings · Giving). Never as a stacked bar that looks like a progress bar.

### Specific copy examples

| Context | Copy |
|---|---|
| Kid empty home | "No chores yet today. Take a breather." |
| Kid completed all chores | "Done for today. Earned $6.00." |
| Kid charity row | "Picked: City Food Bank — $1.20 this month." |
| Parent approve | "Mia marked 4 chores done. Approve to pay out." |
| Parent split screen | "How Mia's earnings are split." |
| Onboarding 40/40/20 line | "Every dollar splits three ways: spend, save, give." |

---

## Visual foundations

### Color philosophy

The palette is **two warm neutrals + three dusty pastels**. Not six pastels, not a rainbow. Color carries meaning: peach = allowance (spend), lilac = savings (locked), sage = giving (charity). Anywhere those three concepts appear, those three colors appear. Color is never decorative.

- **Backgrounds are creamy off-white** (`--cream-2` = `#F6EFE3`) in light mode, **warm coffee-bean dark** (`--ink-1` = `#1C1814`) in dark mode. Never pure white, never pure black, never blue-tinted gray.
- **Foreground is a warm near-black** (`#2A2018`). Pairs with cream at a soft but accessible contrast — feels paper-like, not screen-like.
- **Pastels never sit on each other.** A peach button on lilac card is forbidden. Each pastel sits on cream or on its own light tint.
- **Solid pastel fills are reserved for small surfaces**: bucket cards, chips, the chore-complete check. Never a full-screen pastel wash.

### Typography

- **Display:** Bricolage Grotesque — variable-axis geometric sans with a touch of warmth and quirk. Used for: balances, page titles, hero numbers. Bold (700) for hero amounts, semibold (600) for page titles. The opsz axis means it stays well-proportioned from headline size up to giant hero balances.
- **Body:** Plus Jakarta Sans — humanist geometric sans with rounded terminals. Used for: everything else. Weight 400 for body, 600 for labels, 700 for buttons.
- **Mono:** JetBrains Mono — for transaction IDs, debug, anywhere a receipt feel is wanted.
- **No emoji or icon font in headlines.** Type carries the headline alone.
- **Tabular numbers** are mandatory for money. We `font-variant-numeric: tabular-nums` on all `.t-money*` classes.
- **Letter-spacing** is tight on display (-0.02em), normal on body, wide on overline caps (+0.10em).

> **Font substitution flag.** Bricolage Grotesque and Plus Jakarta Sans are loaded from Google Fonts. If you want self-hosted, drop the TTFs into `fonts/` and update the `@import` in `colors_and_type.css`. JetBrains Mono is also Google-hosted.

### Spacing & layout

- **4-point grid.** Every spacing token is a multiple of 4. Components stack on `--space-4` (16px) by default; tight forms use `--space-3` (12px); section gaps use `--space-8` (32px).
- **Generous padding on cards** — 20–24px. The system breathes. Density is rarely the right answer for a family app.
- **Mobile is the primary canvas.** UI kits are designed at 390×844 (iPhone 14 logical). Web designs would expand from this, not the other way around.
- **Fixed elements:** bottom tab bar (kid + parent), top status bar, the kid's persistent "today's earnings" hero. Everything else scrolls.

### Backgrounds & textures

- **Creamy flat fills**, no gradients in chrome. The cream itself does the work.
- **One allowed gradient:** the subtle radial wash behind the kid's hero balance. Center: `--cream-3`, outer: `--cream-2`. Very low contrast — it should read as "warmth" not "graphic."
- **No photo backgrounds in product UI.** Marketing/onboarding may use a single warm-lit photo of hands/coins/paper, kept desaturated and low-contrast.
- **No repeating patterns or textures** anywhere in product UI. Paper feel comes from cream + shadow, not noise.

### Animation

- **Easing:** `cubic-bezier(0.22, 0.61, 0.36, 1)` for everything except the chore-check, which uses a small spring (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
- **Durations:** 140ms (fast — hover/press), 220ms (base — opens/closes), 360ms (slow — full-screen transitions).
- **Chore complete:** the checkbox draws its tick with a 220ms spring, the row's left edge briefly shows the bucket color (peach/lilac/sage by destination), and the row settles in 360ms. No confetti. No sound by default.
- **No infinite animations** anywhere. No loaders that spin forever — use skeleton states.

### Hover & press states

- **Buttons hover:** background darkens one ramp (`--accent-600` → `--accent-800` mix at 12%). Never a glow, never a shadow bloom.
- **Buttons press:** `transform: scale(0.97)` for 140ms. Tactile.
- **Cards hover:** border goes from `--border-soft` to `--border-mid`. Shadow does not change.
- **Cards press:** scale 0.99.
- **List rows:** background tints to `--cream-1` on hover (light) or `--ink-2` on dark.

### Borders & shadows

- **Hairline borders** at 1px, color is a low-opacity foreground (`rgba(42,32,24,0.06)` light, `rgba(244,236,220,0.08)` dark).
- **Two-layer warm shadows** — no blue tint. The base shadow uses 4–8% alpha of `#2A2018`. Most surfaces don't need a shadow at all; cards rest on cream with a hairline only.
- **Inner shadows** are rare. Used only on input fields to suggest "this is a slot to type in."
- **No protection gradients** — text always sits on a solid surface, never on imagery.

### Transparency & blur

- **Sparingly.** The only blur is the iOS-style nav bar backdrop when content scrolls underneath: `backdrop-filter: blur(20px) saturate(140%)` over a cream-90% surface.
- **No translucent cards.** No "glass."

### Corner radii

- 6/10/14/20/28 + pill. Buttons use pill (`999px`). Cards default to 14px. Hero cards and sheets go 20–28px. Inputs are 10px. We stay below 32px corner radius everywhere except hero — no candy-bar shapes.

### Imagery tone

If photography ever appears (marketing, onboarding): **warm-lit, slightly desaturated, paper-and-pencil props** (no shiny tech, no neon). Skin tones rendered naturally; backgrounds in the cream family. No black-and-white, no heavy grain, no Instagram filters.

### Card anatomy

A standard card is: 14px radius · 1px hairline border · 20–24px padding · `--shadow-xs` (a single 1px bottom line). Hero cards drop the border, add `--shadow-md`, and go 20–28px radius.

### Fixed elements

- Top: status bar (system) + a 56px app header.
- Bottom: tab bar (64px on phone, sits above safe-area inset). Kid app has 3 tabs (Home, Wishlist, You). Parent app has 3 tabs (Kids, Chores, Settings).

---

## Iconography

- **Library:** [Lucide](https://lucide.dev/) — outlined, 2px stroke, rounded line caps and joins. Loaded via CDN (`https://unpkg.com/lucide@latest`). One reference SVG is committed at `assets/icon-sample.svg`.
- **Why Lucide:** open-source, huge coverage, stroke weight matches the warmth of the type (rounded terminals on Plus Jakarta Sans, rounded line caps on Lucide). Phosphor and Iconoir are acceptable substitutes — pick one and stick with it. **Do not mix sets.**
- **Sizes:** 16 (in chips), 20 (in lists), 24 (in tabs/buttons), 32 (in empty states).
- **Color:** icons inherit `currentColor`. In headers and buttons they're `--fg`. In list rows, `--fg-faint`. In bucket contexts they take the bucket's `-600` shade.
- **Filled vs outlined:** outlined by default. The single exception is the chore-complete state, which uses Lucide's `CheckCircle2` filled, colored in the destination bucket's pastel.
- **No custom illustration system.** If illustration is needed later (onboarding moments), commission flat warm-lit line art with the same stroke weight. We do not invent illustration in-house from SVG primitives.
- **No emoji as icons** anywhere in product UI.
- **No unicode characters as icons** except `→` and `·` for inline typographic use.

### Iconography flag

The Lucide CDN reference is sufficient for the design system and UI kit mocks. For the production app you'll want to either tree-shake from `lucide-react`/`lucide-react-native` or self-host the SVGs you actually use. The 8 icons currently referenced across UI kits:

`check`, `check-circle-2`, `plus`, `chevron-right`, `home`, `heart`, `user`, `settings-2`

---

## Caveats

- **No codebase, Figma, or screens were provided** — this is a from-scratch direction, not a recreation. Treat it as a starting point for visual discussion, not a final source-of-truth rebrand.
- **Brand name "Chorey" is provisional.** If the real name lands elsewhere, rename `assets/logo-*` and search-replace.
- **Mascot:** none, per the brief. If one is wanted later, it should slot into the existing color/type system rather than fighting it.
- **Fonts:** loaded from Google Fonts. Self-hosting requires dropping TTFs into `fonts/` and updating `colors_and_type.css`.

See `SKILL.md` for how this system is meant to be used by an agent or designer building new screens.
