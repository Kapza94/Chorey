# App Store / Play screenshots

Branded, on-brand marketing screenshot panels for the store listings.

## Files
- `screenshots.html` — the source. 5 panels, each an exact **1290 × 2796** frame
  (App Store 6.7"). Uses the Chorey palette + Bricolage / Plus Jakarta fonts.
- `preview-*.png` — rendered previews of each panel (for quick review).

## Style
Built in the app's **toybox** language — outlined tiles (`2–3px` ink `#2A2018`
borders), **hard offset shadows** (`0 Npx 0`, no blur), rotated **stickers**, the
real bucket ramps (Spend `#F4CDB9` / Save `#D9CDEC` / Give `#C9DDCD`), squircle
avatars and the giving-green Approve button — matching `src/components/toybox.tsx`
and the real kid-home / parent-chores screens.

Each panel poses a **question** that the app screen answers.

## The 5 panels
1. **Kid home** — "Chore done. So… now what?" → real home: balance, bucket triple, chore list.
2. **The split** — "Where does every dollar go?" → the 40/40/20 split + giving note.
3. **Parent approve** — "Stay in control — without the nagging." → Needs-approval board.
4. **Levels** — "Why do kids keep coming back?" → level road, points, streak.
5. **Brand close** — chorey · Spend / Save / Give stickers.

## ⚠️ Before submitting: swap in real app captures
The phone content is a **faithful recreation** of the real screens, but Apple/
Google want screenshots of the actual running app. Replace each phone's `.scr`
content with a **real screen capture** before uploading (headline + frame +
stickers stay). The recreation mirrors the real screens, so the swap is 1:1.

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
