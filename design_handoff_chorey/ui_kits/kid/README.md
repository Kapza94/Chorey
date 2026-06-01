# Kid UI kit

The kid-facing surface of Chorey. Mobile-only (designed at 390×840).

## Screens

- **Home** — the daily landing screen. Greeting, hero balance card with the 40/40/20 split, today's chore list with tick-off checkboxes, and a single inline note explaining the split.
- **Wishlist** — items the kid is saving toward. Each row shows current saved / target / progress bar tinted by which bucket is funding it.
- **You** — profile, locked savings total, chosen charity (with a Donate CTA), quick actions.

## How a kid uses it

1. Open the app in the morning → see today's chores and the running balance.
2. Tick a chore as done → the row's checkbox pulses with a small spring; the row's text strikes through; the hero balance ticks up; the three bucket numbers re-compute (40/40/20). No confetti, no sound — quietly satisfying.
3. Tap Wishlist → see what's possible to buy with the Spend bucket. A wish with `saved >= price` turns its CTA into "Buy it".
4. Tap You → see the locked savings and the chosen charity. Tap Donate to send some of the Give bucket out.

## Component map

| File | What |
|---|---|
| `KidApp.jsx` | Top-level state, screen switching |
| `KidHome.jsx` | Home screen layout |
| `KidWishlist.jsx` | Wishlist screen |
| `KidYou.jsx` | Profile screen |
| `KidComponents.jsx` | Shared: `Icon`, `KidHeader`, `KidHeroBalance`, `BucketTriple`, `ChoreRow`, `KidTabBar` |

## Caveats

- This is a click-through prototype, not production code. State resets on reload.
- Greenfield design — no source codebase was provided. Components are minimal-cosmetic recreations of the system in `colors_and_type.css`.
