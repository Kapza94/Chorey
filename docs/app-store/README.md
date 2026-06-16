# App Store / Play screenshots

Branded, on-brand marketing screenshot panels for the store listings.

## Files
- `screenshots.html` — the source. 5 panels, each an exact **1290 × 2796** frame
  (App Store 6.7"). Uses the Chorey palette + Bricolage / Plus Jakarta fonts.
- `preview-*.png` — rendered previews of each panel (for quick review).

## The 5 panels
1. **Hero** — "Chores that actually pay off."
2. **The split** — "Every reward splits three ways." (40/40/20)
3. **Kid view** — "Kids watch their money grow."
4. **Parent approve** — "Approve great work in a tap."
5. **Brand close** — Spend · Save · Give.

## ⚠️ Before submitting: swap in real app captures
The phone content in each panel is an **on-brand mock**, not the real UI. Apple/
Google want screenshots that reflect the actual app, so replace the mock inside
each `.screen` with a **real screenshot** of the corresponding app screen before
uploading. (The headline + frame + background stay.)

## Exporting exact-size PNGs
Open `screenshots.html` over a local server and capture each panel at its exact
1290 × 2796 box, e.g.:

```bash
python3 -m http.server 8799   # from this folder, then open http://localhost:8799/screenshots.html
```

Then screenshot each `#p1`…`#p5` element (DevTools → "Capture node screenshot",
or a Playwright `locator('#p1').screenshot()`). Each element is already the exact
required size.

## Sizes still needed
- iOS: 6.7"/6.9" (1290×2796) — done here; add iPad sizes if listing iPad.
- Play: phone 1080×1920+ — reuse the same panels resized.
