---
target: subscription paywall
total_score: 24
p0_count: 0
p1_count: 3
timestamp: 2026-06-22T14-34-58Z
slug: src-features-subscription-subscription-screen-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Trial date + "Free trial" badge + radio state are clear; no in-screen purchase/loading feedback (handed to native sheet) |
| 2 | Match System / Real World | 3 | Plain, warm language; but "Limited Offer" claims urgency that doesn't exist and "40/40/20" is unexplained jargon |
| 3 | User Control and Freedom | 2 | Tapping a plan card *immediately* launches the App Store purchase sheet — you can't select-to-inspect without triggering a buy |
| 4 | Consistency and Standards | 2 | The filled peach "Back" pill uses primary-CTA styling for a dismiss action; the actual buy targets look like passive list rows |
| 5 | Error Prevention | 2 | No in-app confirm step before purchase; an accidental tap fires payment |
| 6 | Recognition Rather Than Recall | 3 | Everything needed is on-screen; no memory load |
| 7 | Flexibility and Efficiency | 3 | Two plans + Restore purchases; appropriately simple |
| 8 | Aesthetic and Minimalist Design | 2 | Annual card stacks "Best deal" + "Limited Offer" + "You save $36" + strike price + price + caption — badges drown the price |
| 9 | Error Recovery | 2 | No purchase-failure state shown in this screen |
| 10 | Help and Documentation | 2 | Terms/Privacy present; no contextual help for the 40/40/20 concept or "what happens when the trial ends" |
| **Total** | | **24/40** | **Acceptable — solid bones, real personality, but the buy path and badge noise need work** |

## Anti-Patterns Verdict

**Does this look AI-generated? No.** This is the opposite of AI slop. Custom warm "toybox" theme, hand-drawn sticker badges, bespoke bucket colors (spend/savings/giving), no Inter-for-everything, no purple-to-blue gradient, no rounded-square-icon-tile-above-every-heading. It has a point of view. The deterministic detector scan came back clean (0 findings) — though its rules are HTML/CSS-oriented and don't meaningfully exercise React Native inline styles, so treat that as "no automated red flags" not "verified clean."

## Overall Impression

The screen *looks* lovely and on-brand, but its information architecture fights its own goal. The single loudest, most button-shaped element is **"Back"** (a dismiss), while the real conversion action — buying — has no button at all and no affordance telling a first-timer that tapping a card will charge them. The biggest opportunity is a one-change structural fix: separate "select a plan" from "buy," and make the buy the loudest thing on screen.

## What's Working

1. **Brand personality.** The toybox aesthetic is genuinely distinctive and trustworthy for a family app — rare and valuable.
2. **Honest reassurance copy.** "You won't be charged during the trial. Pricing is confirmed in the App Store before any charge." is exactly the right tone at a high-stakes moment.
3. **Restraint in plan count.** Two plans, not five. Within Miller's-Law limits; no analysis paralysis.

## Priority Issues

- **[P1] Inverted visual hierarchy — the exit outshouts the entrance.** "Back" is a full-width filled peach pill (your primary-CTA style); the plan cards read as passive rows. *Why it matters:* a first-time parent literally won't see how to subscribe, and the most tempting tap is the one that converts nobody. *Fix:* demote "Back" to a text link / top-left chevron; add a real primary CTA at the bottom labeled with the selected plan ("Start free trial — then $59.99/yr"). *Command:* `/impeccable layout` then `/impeccable bolder` on the CTA.

- **[P1] Tap-to-buy with no confirmation beat.** Card tap → `gateway.purchase()` → native sheet. *Why it matters:* removes user control (can't compare-then-commit), invites accidental purchases and refund requests, and makes the radio buttons a lie (they imply select, but select == buy). *Fix:* card tap = select (toggle radio, update CTA); the new primary CTA = purchase. *Command:* `/impeccable harden`.

- **[P1] "Limited Offer" is false urgency (dark pattern + App Store risk).** The annual price is permanent; the badge manufactures scarcity that doesn't exist. *Why it matters:* Apple scrutinizes fake limited offers; it also erodes trust on a *kids'* app where trust is the whole sale. *Fix:* remove it, or make it a genuinely time-boxed offer with a real expiry. *Command:* `/impeccable clarify`.

- **[P2] Fabricated $95.99 anchor + overstated "5 months free."** The strike price is admitted in-code as "12×$7.99 rounded *up*"; the honest figure is $95.88, real saving ~$35.89, which is ~4.5 months, not 5. *Why it matters:* invented reference prices are deceptive-marketing rejection bait and refund-dispute fuel. *Fix:* use the real $95.88 / "Save $36" / "~4 months free" — the story barely changes and becomes defensible. *Command:* `/impeccable clarify`.

- **[P2] Badge clutter buries the price.** Annual card carries 4 competing decorations around the number that actually matters. *Why it matters:* the price is the decision driver; noise around it raises cognitive load and cheapens the premium feel. *Fix:* keep one savings signal (the green "Save $36"), drop "Limited Offer," and let "Best deal" be the only sticker. *Command:* `/impeccable distill`.

## Persona Red Flags

**Jordan (Confused First-Timer):** Can't tell how to subscribe — no button says "subscribe." Taps "Back" thinking it's the action, or taps a card and is startled by a payment sheet appearing with no warning. "40/40/20 tracked automatically" means nothing to them. Likely abandons.

**Casey (Distracted Mobile Parent, one-handed):** The only bottom-of-screen thumb-zone button is "Back" — the *wrong* action sits in the right place. An accidental thumb-tap on the annual card fires a purchase. Good news: state is a single screen, nothing lost on interruption.

**Riley (Stress Tester):** Will notice the $95.99 anchor doesn't math against $7.99×12, and that "Limited Offer" never expires across sessions — exactly the credibility gaps that turn into one-star "scammy" reviews on a family app.

## Minor Observations

- "Billed annually after the trial" path is correct now; good catch keeping plan-word cadence.
- Touch targets on plan cards are generous (good for Casey); the radio is decorative-only though.
- No "what happens when the trial ends / how to cancel" line — adding "We'll remind you 2 days before" would lift trial-starts more than any badge.

## Questions to Consider

- What if the *price* were the boldest thing on the annual card, instead of four badges around it?
- If you removed "Limited Offer" and the fake anchor, would the honest "5 months free vs monthly" actually convert *better* because it's believable?
- What would a confident version of "Back" look like — would it even be a button, or just a small "Maybe later" link?
