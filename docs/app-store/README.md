# App Store / Play screenshots

Branded, on-brand marketing screenshot panels for the store listings.

## Files
- `screenshots.html` — the source. 5 panels, each an exact **1290 × 2796** frame
  (App Store 6.7"). Uses the Chorey palette + Bricolage / Plus Jakarta fonts.
- `preview-*.png` — rendered previews of each panel (for quick review).

## Style
Toybox-branded marketing frames: a tinted "stage" fills the upper area (no dead
white space), the **question** sits in a speech bubble, rotated **stickers** +
confetti shapes add play, and a large phone holds the **real app screenshot**.
Colors are the real bucket ramps (Spend `#F4CDB9` / Save `#D9CDEC` / Give
`#C9DDCD`), clay accent `#C58A72`, ink `#2A2018`.

Each panel poses a **question** that the real screenshot answers.

## The 5 panels (question → screen)
1. **"Chore done. So… now what?"** → Kid home (balance, buckets, chores) → `raw/shot-1.png`
2. **"Where does every dollar go?"** → the 40/40/20 split → `raw/shot-2.png`
3. **"Stay in control — no nagging."** → Parent approvals board → `raw/shot-3.png`
4. **"Why do kids keep coming back?"** → Levels / journey → `raw/shot-4.png`
5. **Brand close** → chorey · Spend / Save / Give

## ➜ Workflow: add the REAL screenshots
The phone in each panel currently shows a **placeholder** with a striped slot.
Apple/Google require the *actual app*, so:
1. Capture the 5 screens on your phone — see `raw/README.md` for exactly which.
2. Save them as `raw/shot-1.png` … `raw/shot-5.png`.
3. In `screenshots.html`, un-comment the `<img src="raw/shot-N.png">` line in each
   panel (and delete the `.ph` placeholder). The frame/headline/stickers stay.
4. Re-export each `#p1`…`#p5` at its exact 1290×2796 box.

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
