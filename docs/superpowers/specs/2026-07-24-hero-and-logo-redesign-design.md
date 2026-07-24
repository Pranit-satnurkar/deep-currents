# Homepage Hero + Logo Redesign — Design

**Status:** approved, ready for planning
**Builds on:** `docs/superpowers/specs/2026-07-05-hearth-feed-site-design.md` (the hearth feed site) and its Task 1 design tokens / Task 5 doodle system. This spec does not add new global constraints beyond what's below — it operates entirely within the existing "no build step, tokens-only color, reduced-motion-disables-everything" rules.

## Context

Two problems identified from looking at the live deployed site:

1. **Homepage reads as an undifferentiated infinite scroll.** The feed route (`#/`) currently goes straight from the compact header into 34 stacked essay cards with nothing establishing "you've arrived somewhere" first — no framing, no sense of a landing page.
2. **The header flame logo doodle reads as anatomical, not as fire.** The current `hearth-flame` doodle (`js/doodles.js`) is a closed teardrop silhouette with a notch/cleft at the top and an inner curved line — at icon size this reads as a vulvar shape rather than a flame, which is inappropriate for the site's header.

Both were explored visually (candidate shapes and hero layouts sketched and compared via the brainstorming visual companion) before this spec was written.

## Feature 1: Logo redesign

### Chosen concept: "twin tongues"

A main flame silhouette plus a smaller secondary lick beside it, reading as a small campfire — fits the "hearth" framing used throughout the site (ember rail, ember progress bar, "keep by the fire," etc.) better than a single isolated flame.

**Shape requirements** (the actual defect being fixed): every flame-like doodle used going forward — the header logo and the existing `young-flame` doodle used in the resume/current-read strip icon (also currently uses the same flawed `hearth-flame` shape family — check `js/doodles.js` for whether `young-flame` shares the same path or is already distinct before assuming it needs the same fix) — must have:
- A **pointed apex** at the top (not a rounded or notched top).
- A **smoothly tapering base** (narrowing toward a point or a rounded tip at the bottom, not a flat or clefted bottom).
- **Asymmetric** left/right silhouette (real flames flicker unevenly; symmetric silhouettes read as generic/anatomical rather than as fire).
- No closed inner shape that creates a second, separate enclosed region reading as a distinct anatomical feature (the current design's inner curved line was part of what made it misreadable).

Validated candidate paths (proven-shape-derived, confirmed by visual review to read unambiguously as fire) are recorded in the Implementation Notes appendix below — the plan should redraw them in the site's actual hand-drawn doodle stroke style (the loose, organic multi-stroke quality of the other 34 essay doodles, with self-draw animation via `igniteDoodles`/`stroke-dashoffset`), not left as the clean icon-style paths used for the mockup comparison.

### Where it's used

- `#headerFlame` in the persistent site header (all routes) — currently `doodleSvg("hearth-flame", "flame")`.
- The homepage hero's larger flame treatment (Feature 2, full hero only) — same doodle, larger size.
- Audit `young-flame` (used by the current-read/resume strip icon) separately — if it shares the same flawed silhouette family, redraw it too using the same shape requirements above; if it's already a visually distinct, unproblematic shape, leave it alone. Note in the implementation report either way.

### `young-flame` audit result

Checked (rendered and visually reviewed): `young-flame`'s existing path — `js/doodles.js` lines 276-279 — is a clean, unambiguous teardrop flame with a pointed apex and a smaller inner lick; it does **not** share `hearth-flame`'s cleft/notch problem. No change needed. Only `hearth-flame` (the header logo shape) requires redrawing.

### Out of scope

Redrawing any of the other 33 essay-specific doodles, or `young-flame` (confirmed fine above) — this spec only touches `hearth-flame`, the one flawed shape.

## Feature 2: Homepage hero

### Content

**Full hero** — shown when `Store.get("hearth.visited", false)` is falsy (i.e., this browser has never completed a visit before):
- Larger self-drawing flame doodle (the redrawn logo shape, bigger size than the header's).
- "Deep Currents" (site name, matching header styling but larger — display font, heavier weight).
- "quiet essays for the deep hours" (tagline, matching header styling but larger).
- Framing paragraph, exact copy (reused verbatim from the About page's opening line, deliberately — same voice, no new copy invented): `Small essays on solitude, purpose, and the quiet mechanics of being a person — written from the deep hours.`
- CTA button, exact copy: `step into the fire ↓`

**Compact hero** — shown on every subsequent visit (`hearth.visited` is truthy):
- Just the framing paragraph above, styled smaller/italic, no repeated flame/name/tagline (already visible in the persistent header directly above) and no CTA button.

After a full-hero render completes, set `Store.set("hearth.visited", true)` so every later visit — same session or a future one — gets the compact version. Goes through the existing `Store` wrapper like every other persisted key; degrades to in-memory in private browsing (meaning private-browsing sessions always see the full hero, once per browser session — acceptable, matches how every other `Store`-backed feature already degrades).

### CTA behavior

Clicking `step into the fire ↓` smooth-scrolls (respecting `prefers-reduced-motion` — instant jump instead, following the same `matchMedia` gating pattern already used for the ember-rail's year-segment scroll) to the top of the mood-chips/year-rail/feed-cards block, i.e., scrolls past the hero itself.

### Page ordering on the feed route (`#/` only)

1. Site header (unchanged, persistent across all routes).
2. **Current-read strip**, if one exists (bookmark or ambient resume) — unchanged from the existing feature, still renders first among feed-route content since it's the most actionable/personal element.
3. Hero (full or compact, per the visit flag above).
4. Mood chips (unchanged).
5. Ember-year rail (unchanged).
6. Feed cards (unchanged).

The hero is feed-route-only. Reader, kept shelf, and about page are entirely unaffected by this spec.

### Reduced motion / accessibility

- The hero's flame doodle uses the same `igniteDoodles`/reduced-motion handling as every other doodle on the site (renders fully drawn under `prefers-reduced-motion: reduce`, no new animation introduced).
- The CTA's scroll must respect reduced motion (see above) — this is the same class of bug already found and fixed once this session (Task 6's ember-rail), so the plan should apply the same `matchMedia` guard from the start rather than needing a follow-up fix.
- CTA button and any other new interactive element must meet the site's established ≥40px tap-target convention.

## Explicitly out of scope (YAGNI)

- A/B testing or configurability of hero content — one fixed full version, one fixed compact version.
- Per-essay or seasonal hero content variation.
- Any change to the reader, kept shelf, or about page layouts.
- Redrawing essay-specific doodles (see Feature 1's out-of-scope note).
- A "collapse hero manually" control — the full-vs-compact behavior is entirely automatic based on the visit flag, no user-facing toggle.

## New exact copy strings (use verbatim, joins the existing spec's list)

- CTA button: `step into the fire ↓`
- Framing paragraph (shared with the About page's existing opening line, not new copy but binding here too): `Small essays on solitude, purpose, and the quiet mechanics of being a person — written from the deep hours.`

## Implementation notes: validated flame silhouette

These paths (viewBox `0 0 100 100`) were sketched, rendered, and visually confirmed during brainstorming to read unambiguously as fire — pointed apex, asymmetric taper, no closed inner region. They are a starting *shape* reference, not final art: the plan should redraw them with the site's organic hand-drawn stroke quality (irregular control points, the same loose feel as the other 34 doodles) rather than using these exact clean-icon coordinates verbatim, the same way Task 5 turned reference shapes into bespoke doodles rather than shipping placeholder geometry.

Main tongue:
```
M50 8 C50 8 29 29 29 50 C29 62 37 71 46 71 C42 62 42 58 46 54
C50 62 58 67 58 75 C58 83 50 87 50 87 C67 87 79 75 79 58
C79 42 67 33 62 25 C62 33 58 37 54 37 C58 29 50 17 50 8 Z
```

Secondary lick (smaller, offset to the right, second stroke color/weight):
```
M74 42 C74 42 62 55 62 68 C62 75 66 80 71 80 C69 75 69 72 71 70
C74 75 79 78 79 83 C79 87 74 89 74 89 C84 89 91 82 91 72
C91 62 84 57 81 52 C81 57 78 60 76 60 C78 55 74 47 74 42 Z
```

## Testing / verification

Same behavioral-verification approach as the rest of the site (Playwright-driven browser verification at 390px, no unit-test harness for DOM/app.js code):

- Fresh browser (cleared localStorage): confirm the full hero renders on first load of `#/`, `hearth.visited` becomes `true` afterward, and reloading shows the compact hero instead.
- Confirm the current-read strip (when present) still renders above the hero, not below or interleaved.
- Confirm the CTA scrolls to the start of the mood-chips/rail/feed block, with and without `prefers-reduced-motion` emulated.
- Confirm the redrawn flame doodle self-draws correctly (via `igniteDoodles`) in both the header and the full hero.
- Confirm private-browsing degradation: with localStorage blocked, every visit within that session shows the full hero (in-memory `Store` never persists `hearth.visited` across a fresh page load in that mode — acceptable per the constraints above), and no console errors.
- Visual check: screenshot the full hero, the compact hero, and the redrawn logo (header + hero sizes) for confirmation.
