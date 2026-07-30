# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Deep Currents" — a static, mobile-first reading site for the essays of a Blogger blog (deepcurrentswrites.blogspot.com), deployed to GitHub Pages at https://pranit-satnurkar.github.io/deep-currents/. Fully static: no build step, no bundler, no npm dependencies for the site itself — plain HTML/CSS/JS loaded via `<script>` tags. Content is baked into `data/posts.json` by a Python pipeline that fetches and sanitizes the Blogger feed; the client also does a silent client-side live-refresh for anything newer than the baked snapshot.

## Commands

```bash
# Serve locally (any static server works)
python -m http.server 8000

# Run the Python test suite (content pipeline)
python -m unittest discover tests -v

# Run a single Python test
python -m unittest tests.test_refresh_posts.TestSanitize.test_keeps_semantic_tags_and_href -v

# Run the JS test suite (pure logic + doodle registry)
node --test tests/*.test.mjs
# `node --test tests/` (the directory form) fails on some Node/Windows installs with a
# module-resolution error unrelated to the tests themselves — use the glob form above.

# Regenerate data/posts.json from the live Blogger feed, merged with data/curation.json
python scripts/refresh_posts.py
# Or from a saved feed snapshot instead of hitting the network:
python scripts/refresh_posts.py path/to/feed.json
```

There is no lint/build/typecheck step — `node --check js/app.js` (etc.) is the closest thing to a compile check for the JS files.

## Architecture

### Content pipeline (Python, offline)

`scripts/refresh_posts.py` fetches the Blogger JSON feed, runs each post's HTML through a hand-rolled `HTMLParser` subclass (`Sanitizer`) that allow-lists tags (`KEEP`), drops dangerous ones with their content (`DROP_WITH_CONTENT`: script/style/iframe/object/noscript), and unwraps structural-but-meaningless ones (`UNWRAP`: div/span/section/article/font/u — with block content re-wrapped in `<p>` if a depth-1 div's unwrapped content has no block-level element). It slugifies titles (with `-2`/`-3` suffixing on collision), computes `words`/`readLength`/`excerpt`, and merges hand-curated `moods`/`doodle` per post from `data/curation.json` (keyed by Blogger's numeric post id). Output is `data/posts.json`: `{ generated, moods: {6 mood keys -> display labels}, posts: [...] }`, sorted newest-first.

`scripts/build_curation.py` is a one-off that built the initial `data/curation.json` by matching title prefixes to a hardcoded `(prefix, moods, doodle-id)` table — not part of the regular content-update workflow, only needed again if curation data is lost.

**Updating content:** re-run `refresh_posts.py` after any Blogger post changes; new posts appear automatically via live client-side refresh with a default doodle until curated by hand in `data/curation.json` (then re-run the script to bake them in), at which point they need a real entry in `js/doodles.js`.

### Client (`js/lib.js` → `js/doodles.js` → `js/app.js`, load order matters)

No modules — each file is loaded via a plain `<script>` tag in `index.html` and attaches globals via a UMD-ish IIFE (so the same files also work under `node --test`, which is how `tests/*.test.mjs` exercises them directly).

- **`js/lib.js`** (`HearthLib`) — pure, environment-agnostic logic: date formatting, `readLengthLabel`/`stripTags`/`decodeEntities`/`excerptOf`/`escapeHtml`, `guessMoods` (keyword-based mood inference for live-refreshed posts, mirrors the fixed mood taxonomy), `anotherCurrent` (picks the next essay to suggest — shared moods first, then nearest publish date). No DOM access, so it's fully unit-testable under Node.
- **`js/doodles.js`** (`DOODLES`, `doodleSvg`, `igniteDoodles`) — a registry of hand-drawn multi-path SVG doodles (one per essay plus a few UI ones: `young-flame`, `hearth-flame` — the header/hero logo — `scribbler-quill`). `doodleSvg(id, cls)` renders one to an SVG string with `fill:none` stroke paths; `igniteDoodles(rootEl)` finds not-yet-lit doodles under a root element and animates them stroke-by-stroke via `stroke-dasharray`/`stroke-dashoffset` (skipped entirely under `prefers-reduced-motion: reduce`, which just marks them `.lit` pre-drawn). Every doodle referenced anywhere in the data must exist here — `tests/doodles.test.mjs` asserts this against `data/posts.json`.
- **`js/app.js`** — app state, hash router, and all page renderers. `Store` wraps `localStorage` with an in-memory fallback (so private-browsing/blocked-storage degrades silently instead of throwing) and is the *only* sanctioned way to persist client state. `App` holds runtime state (`posts`, `moods`, `filter`).

### Routing and pages (`js/app.js`)

Hash-based router (`render()`), dispatching on `location.hash`:

| Route | Renderer | Job |
|---|---|---|
| `#/` | `renderHome()` | Short landing page: hero (full on a browser's first-ever visit via `Store.get("hearth.visited")`, compact one-liner on returns), the current-read strip if an ambient resume position exists, the single featured (newest) essay, 3 "a few to start with" picks (one per mood not already covered by the featured essay), a link to the archive. No mood chips, no year rail — nothing long to browse here. |
| `#/archive` | `renderArchive()` | The full browsable list: mood-chip filter, year rail, and `feedListHtml()`'s year-grouped cards — each year shows 4 by default with a "see N more" reveal (the archive is very uneven by year, e.g. one year has 22 of the 34 posts), 2-column grid at ≥700px, card size varies by word-count tertile within the whole archive (not the coarse `readLength` label, which barely varies since most essays are short). |
| `#/kept` | `renderKept()` | Bookmarked ("kept by the fire") essays. |
| `#/about` | `renderAbout()` | Static bio page. |
| `#/<slug>` | `renderReader(post)` | Full-screen essay view: scroll-tracked ember progress bar, text-size control, "keep by the fire" toggle, the "another current" suggestion, and a private reader-feedback form (reaction + note, POSTed to a Formspree endpoint on submit — the one deliberate exception to "failures are always silent," since it's a user-initiated action they're waiting on). |

`#rail` (year nav) and `#chips` (mood filter) are persistent DOM chrome defined once in `index.html`, not re-created per route — each renderer just toggles their `.hidden` attribute; they're shown only on `#/archive`.

### Storage keys (all through `Store`, all optional/nullable)

`hearth.kept` (array of slugs), `hearth.resume` (`{slug, ratio}`, ambient — auto-updated on every scroll tick in the reader; drives both the current-read strip on Home/Archive and the reader's own scroll-restore on reopen), `hearth.textsize` (0/1/2), `hearth.visited` (gates the hero's full-vs-compact state on `#/`).

### Live refresh (`liveRefresh()` in `js/app.js`)

On boot, a JSONP `<script>` tag hits the Blogger feed directly from the browser; any post id not already in `App.posts` gets a minimal client-built entry (`doodle: "young-flame"`, moods via `guessMoods`) and is prepended/re-sorted into the in-memory list. Failure (network, parse, malformed feed) is always silent — no error UI — and each feed entry is processed in its own inner `try/catch` so one malformed entry doesn't discard the whole batch. Anything feed-derived that reaches the DOM (title, excerpt, and especially the essay `url`) is escaped and, for URLs, scheme-validated (`http:`/`https:` only) before use — this was a real XSS finding fixed during development, not a hypothetical.

### Design tokens (`css/hearth.css`)

All color comes from `:root` custom properties (`--ink`, `--ink-deep`, `--card`, `--parchment`, `--parchment-dim`, `--ember`, `--ember-bright`, `--dusty`) — no hardcoded colors elsewhere in the stylesheet. Three self-hosted font families (`fonts/*.woff2`, no external font requests): Fraunces (display), Literata (body), Inter (labels/UI). A single global rule under `@media (prefers-reduced-motion: reduce)` disables all animation/transitions site-wide; anything that does its own JS-driven motion (doodle self-draw, smooth-scroll on the year rail) additionally checks `matchMedia("(prefers-reduced-motion: reduce)")` directly, since CSS alone can't stop a `scrollIntoView({behavior:"smooth"})` call.

### Testing

No end-to-end test framework is checked into the repo. `tests/test_refresh_posts.py` (Python `unittest`) covers the sanitizer/slugify/excerpt/build logic in the content pipeline. `tests/lib.test.mjs` and `tests/doodles.test.mjs` (`node --test`) cover `HearthLib`'s pure functions and doodle-registry integrity. DOM-heavy code in `js/app.js` (routing, rendering, the reader's scroll/resume logic, the feedback form) has no automated coverage — it's verified by hand/browser-driven checks during development, not by a suite in this repo.

### Dev pages

`doodle-gallery.html` — renders every doodle in the registry for visual regression (open directly, no server needed for this one beyond static hosting).

### Design/planning docs

`docs/superpowers/specs/` and `docs/superpowers/plans/` hold the original site design spec and its task-by-task implementation plan (written and executed via the `superpowers` skill workflow). `.superpowers/` (git-ignored) holds in-progress scratch state from that workflow (task briefs/reports, review diffs) — not part of the shipped site.
