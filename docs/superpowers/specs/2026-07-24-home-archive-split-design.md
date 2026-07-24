# Home / Archive Split — Site Structure Redesign

**Status:** approved, ready for planning
**Builds on:** `docs/superpowers/specs/2026-07-05-hearth-feed-site-design.md` (the original site), `2026-07-24-hero-and-logo-redesign-design.md` (hero + logo), and the unspec'd-but-shipped homepage work that followed it (featured essay, year-grouped list, progressive disclosure, 2-column grid, current-line). This spec does not touch color tokens, typography, doodle art, or the hearth/ember/current copy vocabulary — all of that stays exactly as-is. What changes is *structure*: how many pages there are and which content lives on which one.

## Context

`#/` has been asked to do two incompatible jobs at once: welcome a visitor (hero, featured essay) and be the complete browsable archive of all 34 essays (mood filter, year rail, the full list). Every attempt to fix "it still feels like scroll and scroll" by improving the list itself (visual variety, progressive disclosure, a 2-column grid) treated the symptom without addressing that a landing page and an archive browser want fundamentally different shapes. This spec splits them into two routes.

## Site map

```
#/            Home     — hero, current-read strip, featured essay, 3 curated picks, link to archive
#/archive     Archive  — the full browsable list (today's #/ minus hero/featured)
#/kept        Kept     — unchanged
#/about       About    — unchanged
#/<slug>      Reader   — unchanged (explicitly out of scope for this pass)
```

Header nav becomes `archive | kept | about`. The `Deep Currents` wordmark/logo continues to link to `#/` (Home), unchanged from today.

## Home (`#/`)

In order:

1. **Hero.** Same mechanics as today: full version (flame doodle, "Deep Currents," tagline, framing paragraph, CTA button) on a browser's first-ever visit (`Store.get("hearth.visited", false)` falsy); compact version (just the italic framing line) on every return. The CTA copy changes from `step into the fire ↓` to **`step into the fire →`**, and its behavior changes from a same-page scroll to a route change: clicking it navigates to `#/archive`.
2. **Current-read strip**, if one exists (bookmark takes priority over ambient resume, exactly as today's `currentReadHtml()`/`currentReadInfo()` already implement) — unchanged logic, just now rendered on Home instead of (also) on the old combined `#/`.
3. **Featured essay** — unchanged from the current implementation: the newest essay in `App.posts`, larger doodle, `latest current` eyebrow, a longer excerpt pulled fresh from `post.html` (not the pre-baked short `excerpt` field).
4. **"a few to start with"** — a new section, three compact one-line picks (title + primary mood label, no doodle, no excerpt), each linking straight into the reader like any other essay link. Selection: from the moods not covered by the featured essay's own moods, pick up to 3 distinct moods and take the most recent essay in each; if fewer than 3 uncovered moods exist, fill remaining slots with the next most recent essays overall that aren't already picked. Deterministic — recomputed from `App.posts` on every render, no stored/randomized state.
5. **`browse all 34 →`** — a plain link/button to `#/archive`, sitting after the picks.

No mood chips, no year rail, and no progressive-disclosure list on Home — there is no long list on this page to filter or page through.

## Archive (`#/archive`)

Everything the current combined `#/` renders today, **minus** the hero and the featured-essay treatment:
- Current-read strip (same as Home — a reader might land on Archive directly from the nav while mid-essay elsewhere, so it stays available here too, not just on Home).
- Mood chips (`#chips`), shown/hidden exactly as today's route-based `.hidden` toggling already does, just keyed to the `archive` route instead of the empty-hash route.
- Ember-year rail (`#rail`), same toggling.
- The year-grouped list: `feedListHtml`'s existing logic (year sections, 4-visible-then-"see N more" progressive disclosure, word-count-tertile size variation, the current-line thread down the left margin) carries over. Concretely: today's `feedListHtml(posts)` always does `const [first, ...rest] = posts` and renders `first` as a featured card. Archive must show its own newest essay as a normal (not featured) first card in its year group, not silently drop it or double-render it — the function needs a mode/parameter (e.g. `feedListHtml(posts, { withFeatured: true })` for Home, `false` for Archive) so Archive groups and renders every post in `posts` with no featured extraction. This is the one piece of substantive refactoring in the shared list-rendering code; everything else about `feedListHtml` is unchanged.

## Explicitly out of scope (YAGNI)

- Any change to Reader, Kept, or About beyond the nav update.
- Any change to color tokens, fonts, doodle art, or established copy strings not listed above.
- Persisting or randomizing the "a few to start with" picks — always freshly computed, deterministic.
- A dedicated route or UI for browsing by mood beyond the existing chip-filter (already present on Archive).
- Analytics-driven or popularity-based picks (no backend to support it).

## New / changed exact copy strings

- Nav item: `archive`
- Hero CTA (replaces `step into the fire ↓`): `step into the fire →`
- Home section label: `a few to start with`
- Archive link at the bottom of Home: `browse all 34 →`

## Data / storage

No changes. `Store` keys (`hearth.visited`, `hearth.bookmark`, `hearth.resume`, `hearth.kept`, `hearth.textsize`) and their semantics are entirely unaffected — this is a routing and page-composition change, not a data-model change.

## Testing / verification

Same Playwright-at-390px behavioral approach as the rest of the site (no unit-test harness for DOM/app.js):

- Fresh browser: `#/` shows full hero, no current-read strip (nothing to resume), featured essay, exactly 3 picks covering distinct moods (verify against `App.moods`/each pick's mood not equal to the featured essay's moods where possible), working hero CTA and `browse all 34 →`, both landing on `#/archive`.
- `#/archive` renders the full list — same essay count, same mood-chip filtering, same year rail, same progressive disclosure and grid behavior as the current combined page did, minus hero/featured.
- Nav shows `archive | kept | about` and each link resolves correctly from every route, including from Reader and from Archive itself.
- Returning visit (reload): Home shows the compact hero; current-read strip appears on Home if a bookmark/resume exists, and also appears on Archive if navigated to directly.
- `hearth.visited`/`hearth.bookmark`/`hearth.resume`/`hearth.kept`/`hearth.textsize` behave identically to before — spot-check each still round-trips through `Store`.
- Reduced motion and keyboard-focus sweep covering the new nav item, the "a few to start with" links, and both archive-bound buttons.
- No console errors across the above.
