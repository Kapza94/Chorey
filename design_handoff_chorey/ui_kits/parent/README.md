# Parent UI kit

The parent-facing surface of Chorey. Mobile-only (designed at 390×840).

## Screens

- **Kids** — at-a-glance dashboard. Top-of-screen banner if anything needs approval, one card per kid (avatar, weekly/monthly earnings, **budget-cap meter**, the three-bucket meter, inline split numbers), and a household total at the bottom.
- **Chores** — the chore library. Per-kid **assigned-vs-budget** meters at the top (flags when over cap). List of chore templates with reward, assigned kid(s), and frequency. The plus button opens an "Add chore" bottom sheet — name, reward, who it's for, and a live preview of how that reward splits across the three buckets.
- **Payments** — off-app payout tracking. "Due this period" per kid with the bucket split, a **Mark as paid** sheet (amount + method: cash / bank transfer / other), a total-to-pay-out figure, and a payout history with a "this month" total. No in-app money movement — the parent pays directly and records it here.
- **Settings** — per-kid **budget cap + weekly/monthly cadence**, the 40/40/20 split config (default shown big, pastel pills per bucket, per-kid override CTA), and a standard account list (charities, pay-out day, notifications, dark mode).

## How a parent uses it

1. Open the app → see whether anything needs approving for any kid this week, then a card per kid showing how their earnings are tracking.
2. Tap Chores → review the library, add a new chore. The add-chore sheet shows what the kid will see by splitting the new reward live.
3. Tap Settings → adjust the 40/40/20 split if the household prefers a different ratio. Per-kid overrides are a one-tap deeper.

## Component map

| File | What |
|---|---|
| `ParentApp.jsx` | Top-level state (kids, budgets, payout history) + tab routing |
| `ParentKids.jsx` | Kids overview with budget meters |
| `ParentChores.jsx` | Chore library + budget-vs-cap + add-chore bottom sheet |
| `ParentPayments.jsx` | Off-app payout dashboard + mark-as-paid sheet |
| `ParentSettings.jsx` | Per-kid budget/cadence + split configuration |
| `ParentComponents.jsx` | Shared: `ParentHeader`, `KidCard`, `ParentTabBar`, `ParentIcon` (incl. wallet) |

The parent kit reuses the `Icon` set defined by the kid kit at `../kid/components/KidComponents.jsx`.

## Caveats

- Click-through prototype, not production code.
- Per-kid detail view and approval flow are stubbed as banners and CTAs in this kit; they would slot in as the next screen layer when fully designed.
