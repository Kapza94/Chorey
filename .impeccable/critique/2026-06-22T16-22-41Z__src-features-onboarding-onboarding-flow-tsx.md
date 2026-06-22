---
target: onboarding flow
total_score: 28
p0_count: 0
p1_count: 2
timestamp: 2026-06-22T16-22-41Z
slug: src-features-onboarding-onboarding-flow-tsx
---
## Design Health Score — Onboarding

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Progress bar shows 4 dots, fills to "done" at the add-kid step — then **vanishes** for the entire back half (split, chores, causes, account, plan, pledge) |
| 2 | Match System / Real World | 4 | Warm, plain, benefit-led copy; teaches 40/40/20 with a live bar chart; "pinky promise" metaphor lands |
| 3 | User Control & Freedom | 3 | Back chevron everywhere, "Skip for now", "I already have an account"; no save-and-exit mid-flow |
| 4 | Consistency & Standards | 2 | Onboarding plan screen says "Yearly / 2 months free"; settings paywall says "Annual / 5 months free" — and it's a **live TypeScript build error** |
| 5 | Error Prevention | 4 | Primary CTA disabled until valid (email, code, ≥1 chore, signature) — exemplary |
| 6 | Recognition over Recall | 3 | Plan screen recaps "N chores ready for {kids}" — nice memory aid |
| 7 | Flexibility & Efficiency | 2 | ~13 linear parent steps; no skip-ahead beyond sign-in |
| 8 | Aesthetic & Minimalist | 3 | Clean toybox screens, one idea per screen |
| 9 | Error Recovery | 3 | Inline "That didn't save…" on plan, OTP resend |
| 10 | Help & Documentation | 2 | No contextual help affordance; leans entirely on copy |
| **Total** | | **28/40** | **Good — markedly stronger than the paywall (24); two real issues drag it** |

## Anti-Patterns Verdict

**Does it look AI-generated? No — emphatically.** This is craftsmanship: a shared `OBShell`/`OBTitle`/`OBPrimary`/`OBSecondary` kit with consistent hierarchy, a hand-built progress dot row, toybox press-into-shadow buttons, accessible labels on every input and button, and disabled-state gating throughout. The deterministic detector returned 0 findings (its rules are HTML/CSS-oriented, so low signal on RN — treat as "no automated red flags," not proof). No live browser inspection possible (native app); this is a source + structure review of all 14 step components.

## Overall Impression

The onboarding is the best-designed surface in the app — and it does the thing the paywall failed at: it earns the ask. The demo tour front-loads the "aha" (watch a real reward split 40/40/20), and the plan/payment screen arrives at step ~11, after the parent has named their family, added kids, set budgets, picked chores and a cause. That's textbook value-before-ask. Two things hold it back: a **progress indicator that lies and then disappears**, and a **stale second paywall** that the "annual everywhere" rename missed.

## What's Working

1. **Value-before-ask sequencing.** The free-trial/plan screen comes late, after real investment, with a recap of everything already set up. This is exactly right and rare.
2. **Error prevention via disabled CTAs.** You cannot advance with an invalid email, a missing code, zero chores, or an unsigned pledge. Users can't paint themselves into a corner.
3. **Teaching, not telling.** The 40/40/20 split is shown as an animated bar chart with real dollar amounts, and "Savings stays locked — no spend button" explains the *why*. (Notably, the paywall later references "40/40/20" with no such explanation — onboarding already solved this; reuse the visual.)

## Priority Issues

- **[P1] The progress indicator lies, then vanishes.** It renders 4 dots and fills to completion at the add-kid step (`index 3, total 4`) — but the parent flow has ~13 steps. After add-kid it disappears entirely, so the longest, highest-effort stretch (budget, chores, causes, **account creation, payment, pledge**) has *no* sense of "how much is left." Users feel "almost done," then hit 9 more screens. *Fix:* make the dot count reflect the real parent step total (or switch to labeled phases like "Family → Setup → Account"), and keep it visible through account/plan/pledge. *Command:* `/impeccable harden` then `/impeccable layout`.

- **[P1] Two divergent paywalls — and a red build.** `OBPlanChoice` (onboarding) still says **"Yearly" / "2 months free"**, writes plan `"yearly"`, and labels accessibility "Choose yearly billing" — while the redesigned `SubscriptionScreen` says **"Annual" / "5 months free."** The rename you asked for ("annual everywhere") missed this screen, and `tsc` is currently failing on it (`"yearly"` not assignable to `SubscriptionPlan`). *Fix:* unify — ideally reuse `SubscriptionScreen` in onboarding, or at minimum update `OBPlanChoice` to annual / "5 months free" / matching design, and change the `choosePlan` type to `SubscriptionPlan`. *Command:* `/impeccable polish`.

- **[P2] Time-to-value is long.** ~13 parent steps before the dashboard. The demo tour mitigates it, but `p_demo_kid`, and possibly the cause step, could be optional. Chores currently *requires* ≥1 to continue — consider a "skip, add later" so a hurried parent reaches the dashboard faster. *Command:* `/impeccable distill`.

- **[P2] Account step is the silent drop-off risk.** Email OTP forces a context-switch out to the mail app mid-flow (Casey, below). It's handled well (resend, disabled-until-valid), but it's the single most fragile point and has no progress context around it. *Command:* `/impeccable harden`.

## Persona Red Flags

**Casey (distracted mobile parent, one-handed):** 13 steps with no progress indicator in the back half — if interrupted during account/payment, no idea how far along. The email-OTP step ejects them to their mail app; returning mid-flow, state had better persist. Primary CTAs are bottom-of-screen (good thumb zone).

**Jordan (confused first-timer):** Well-guided overall — but the progress bar filling up at step 3/4 then vanishing will read as "wait, I thought I finished?" Mild confusion at exactly the wrong moment (right before payment).

**Riley (stress tester):** Will immediately spot that onboarding sells "Yearly, 2 months free" while Settings sells "Annual, 5 months free" — same product, two stories, two numbers. On a family app, that inconsistency reads as sloppy or sneaky.

## Minor Observations

- `choosePlan` prop type (`"monthly" | "yearly"`) is the root of the build error; it should be `SubscriptionPlan`.
- The "Already set up: N chores ready for {kids}" recap on the plan screen is a lovely recognition aid — keep it if you unify the paywalls.
- No save-and-exit; a parent who quits at step 9 restarts the funnel. Acceptable for v1, worth noting.

## Questions to Consider

- If the paywall and onboarding plan screen were literally the same component, would the inconsistency (and the build error) even be possible?
- The progress bar implies 4 steps; the flow has 13. What's the honest unit of progress here — steps, or phases?
- Chores requires ≥1 to continue. Is that the one place a hurried parent bounces, 10 steps deep?
