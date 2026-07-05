# Deep Currents — Hearth Feed Website Design

**Date:** 2026-07-05
**Status:** Approved by user (sections approved conversationally 2026-07-05)

## Purpose

A personal website for the essays currently published at
https://deepcurrentswrites.blogspot.com/ (34 posts as of this date, author
pen name "Scribbler", blog name "Deep Currents"). The goal is a warm,
candlelit, mobile-first reading experience that keeps visitors reading —
engagement through atmosphere and gentle continuation, not dopamine
mechanics. Phones and tablets are the primary targets; desktop must be
respectable but is secondary.

## Decisions made with the user

| Decision | Choice |
|---|---|
| Content sync | Hybrid: posts baked into `data/posts.json` + live background fetch of the Blogger feed for anything new |
| Hosting | GitHub Pages (git push = deploy); custom domain possible later |
| Doodles | A unique hand-drawn-style SVG line doodle for every one of the 34 essays |
| Identity | Site name "Deep Currents", author pen name "Scribbler", doodled avatar (no photo) |
| Tech | Vanilla HTML/CSS/JS, no build step, no framework, hash-based routing |

## Architecture

```
D:\Project\Blog\
├── index.html               — app shell (feed, reader, about, kept shelf)
├── css/hearth.css           — all styles
├── js/app.js                — rendering, hash routing, filters, reader, bookmarks, resume
├── js/doodles.js            — all 34 SVG doodles + default "young flame" doodle
├── data/posts.json          — 34 essays: slug, title, date, full sanitized HTML,
│                              excerpt, moods[], doodleId, bloggerUrl, readLength
├── data/curation.json       — per-post moods + doodleId assignments (merged by the script)
├── fonts/                   — self-hosted woff2: Fraunces, Literata, Inter (subsets)
├── scripts/refresh_posts.py — regenerates posts.json from the Blogger JSON feed
└── docs/superpowers/specs/  — design docs
```

No node_modules, no bundler, no CI required. The site is fully static and
functional from the repo files alone.

### Content pipeline

1. **Baked-in:** `scripts/refresh_posts.py` fetches
   `https://deepcurrentswrites.blogspot.com/feeds/posts/default?alt=json&max-results=500`,
   sanitizes each post's HTML (strip scripts/iframes/inline styles/Blogger
   cruft), derives slug, excerpt, and read length, and writes `posts.json`.
   Moods and doodle assignments live in `data/curation.json` (keyed by post
   ID) which the script merges in, so re-running never destroys curation.
2. **Live refresh:** on page load, `app.js` loads the Blogger feed in the
   background via its JSONP variant (`alt=json-in-script&callback=…`,
   injected as a script tag), since Blogger's plain JSON feed does not
   reliably send CORS headers. Posts whose IDs are not in `posts.json` are
   prepended to the feed marked as fresh, with the default "young flame"
   doodle and a keyword-guessed mood. If the fetch fails (offline, Blogger
   down, CORS), it fails silently — the site works entirely from
   `posts.json`.
3. **Curation catch-up:** when the author wants a new post to get its
   bespoke doodle and curated moods, re-run the script and add a doodle in
   `doodles.js`. Never required for the site to function.

### Routing

Hash-based: `#/` feed, `#/<slug>` reader, `#/kept` shelf, `#/about`.
Back button and link sharing work. Each essay's reader footer links to its
Blogger canonical URL ("this essay also lives at Deep Currents on Blogger"),
so per-essay SEO remains Blogger's job.

## Visual language

- **Palette:** deep plum-ink background, warm ember-gold accent, dusty blue
  secondary — firelight at night, not the usual cream/terracotta blog look.
- **Type:** Fraunces (display serif) for titles, Literata for body,
  Inter for small labels. Self-hosted woff2 subsets in `fonts/` — no
  third-party font requests, fast on mobile networks, works offline.
- **Motion:** flickering hand-doodled flame in the header; doodles
  self-draw via stroke animation on scroll-into-view; gentle scroll-snap on
  feed cards. `prefers-reduced-motion` disables all of it (doodles render
  fully drawn, flame static).

## The feed

Single column of essay cards: doodle + title + date + mood chips + opening
lines fading out like embers. Comfortable column max-width on tablet and
desktop.

**Ember-thread rail:** progress rail at the top built from ember segments
**per year of writing** (2024, 2025, 2026 — currently 3 segments). Segments
light up as the reader scrolls through that era of the archive; tapping a
segment jumps to that year. (Per-post segments were the artifact design; at
34+ posts they'd be dust, so the rail is per-year.)

## The doodle system

Every essay gets a unique single-stroke-style SVG line icon derived from its
actual content (möbius strip, kaleidoscope shards, melting rewind symbol,
shifting dunes, train window, ripples, winding path, park bench, etc.).
Implementation: small path sets in `js/doodles.js` keyed by `doodleId`,
rendered inline as SVG, animated with stroke-dashoffset on intersection.
Ember-gold strokes on the dark ground. No image files. Posts not yet
curated use the default "young flame" doodle.

The essays' content will be read from the feed during implementation to
design each doodle; doodle-to-post assignments recorded in `data/curation.json`.

## Moods

A curated set of ~6 moods (working names: *3am & cosmic*, *stranger's
warmth*, *rain & melancholy*, *the climb*, *ghosts of what was*, *the quiet
self* — final names chosen after reading all 34 essays). Each essay is
hand-assigned 1–2 moods during implementation. Chips under the header
filter the feed with a gentle transition. Live-fetched posts get a
keyword-guessed mood until curated. Empty filter results show a gentle
"no embers here tonight" state.

## Engagement (the healthy loop)

1. **"Another current":** at the end of an essay the reader offers exactly
   one next essay — the closest by mood — as a softly glowing card. One tap
   continues reading. Primary keep-reading mechanism.
2. **"Keep by the fire":** bookmark stored in localStorage; a shelf view at
   `#/kept`; the header flame grows subtly with the number of kept essays.
3. **Resume where the fire dimmed:** scroll position within an essay is
   saved in localStorage; a returning visitor who left mid-essay sees a
   quiet "still burning: <title>, halfway" card at the top of the feed.

No like counts, no infinite algorithmic feed, no notifications.

## The reader

Full-screen in-site reading view: essay HTML re-rendered in the site's own
typography (Blogger inline styling stripped), ember progress bar instead of
percentages, read length expressed as "a short sit" / "a long night"
(mapped from word count), and a text-size control persisted in
localStorage. Footer: "keep by the fire" toggle, Blogger canonical link,
"another current" suggestion.

## About

`#/about` — bio written in Scribbler's voice (drafted during implementation,
editable by the author), doodled avatar, link to the Blogger original.

## Error handling

- Blogger live fetch fails → silent; site runs from posts.json.
- Feed HTML sanitization: strip `<script>`, `<iframe>`, event handlers,
  inline styles; keep semantic tags and images (lazy-loaded).
- localStorage unavailable (private browsing) → bookmarks/resume degrade to
  in-memory for the session, no errors surfaced.
- Unknown hash route → feed.
- Long titles, missing excerpts, empty moods → layout tolerates all.

## Testing / verification

No build step, so verification is behavioral: serve locally, drive the site
in a mobile-sized browser (screenshots for the user), and confirm feed
render, mood filtering, reader open/scroll/progress, bookmark persistence
across reload, resume card, live-fetch fallback (simulated offline), and
reduced-motion rendering. Lighthouse mobile pass for performance.
`refresh_posts.py` is verified by running it and diffing `posts.json`.

## Out of scope (YAGNI)

Comments, analytics, newsletter, search, service worker/PWA install,
custom domain setup (possible later), migrating away from Blogger.
