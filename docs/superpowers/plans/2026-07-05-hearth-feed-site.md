# Deep Currents — Hearth Feed Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> For Tasks 1, 5, 6, 7, 8 (visual work), the implementer MUST also load the `frontend-design:frontend-design` skill before writing markup/CSS. The code blocks in those tasks are complete reference implementations of *behavior and structure*; visual refinement beyond them is expected, provided every acceptance check still passes and all Global Constraints hold.

**Goal:** Build and deploy the "hearth feed" — a warm, dark, candlelit, mobile-first reading site for the 34 essays on deepcurrentswrites.blogspot.com, with baked-in content plus live Blogger refresh.

**Architecture:** Fully static vanilla HTML/CSS/JS site (no build step, no framework). Content is baked into `data/posts.json` by a Python script that fetches and sanitizes the Blogger feed and merges hand-curated moods/doodles from `data/curation.json`. At runtime the page renders from `posts.json`, then quietly pulls the Blogger JSONP feed for anything newer. Hash routing gives each essay a shareable in-site URL.

**Tech Stack:** HTML/CSS/JS (ES2020, no modules-in-browser — plain script tags), Python 3 stdlib (content pipeline + its unittest tests), `node --test` for pure-JS logic tests, GitHub Pages for hosting.

**Spec:** `docs/superpowers/specs/2026-07-05-hearth-feed-site-design.md` — read it first.

## Global Constraints

- No build step, no bundler, no node_modules, no runtime dependency beyond the browser. Python stdlib only in scripts.
- Fonts self-hosted in `fonts/` as woff2 (Fraunces, Literata, Inter). No third-party requests at runtime except the Blogger JSONP feed.
- Mobile-first: design at 390px, must be comfortable at 768px (tablet) and respectable at 1200px (feed column max-width ~42rem, reader measure ~65ch).
- `prefers-reduced-motion: reduce` disables ALL animation: flame flicker static, doodles render fully drawn, no scroll-snap smooth behavior, no transitions.
- localStorage access always goes through the `Store` wrapper (Task 6); private-browsing failures degrade to in-memory silently.
- Blogger live-fetch failure is always silent — no error UI, site fully functional from `posts.json`.
- Exact copy strings (use verbatim): bookmark action "keep by the fire" / state "kept by the fire"; end-of-essay suggestion heading "another current"; resume card "still burning: <title>"; empty filter state "no embers here tonight."; Blogger link text "this essay also lives at Deep Currents on Blogger"; read lengths "a short sit" (<450 words), "an evening ember" (450–1100), "a long night" (>1100).
- Site name "Deep Currents", author "Scribbler", tagline "quiet essays for the deep hours".
- Mood keys and display names (exact): `cosmic`="3am & cosmic", `warmth`="stranger's warmth", `rain`="rain & melancholy", `climb`="the climb", `ghosts`="ghosts of what was", `quiet`="the quiet self".
- Palette tokens (Task 1) are the single source of color; no hard-coded colors elsewhere.
- Commit after every task (messages given per task).

---

### Task 1: Scaffold, fonts, design tokens, app shell

**Files:**
- Create: `index.html`, `css/hearth.css`, `.nojekyll`, `fonts/` (6 woff2 files)

**Interfaces:**
- Produces: DOM ids used by all later tasks: `#rail` (ember rail nav), `#chips` (mood filter row), `#view` (route target), `#headerFlame` (svg container in header). CSS custom properties: `--ink`, `--ink-deep`, `--parchment`, `--parchment-dim`, `--ember`, `--ember-bright`, `--dusty`, `--card`. Font families: `--font-display` (Fraunces), `--font-body` (Literata), `--font-label` (Inter).

- [ ] **Step 1: Download self-hosted fonts**

Run from repo root (uses the google-webfonts-helper API):

```bash
mkdir -p fonts && cd fonts
curl -sL -o fraunces.zip "https://gwfh.mranftl.com/api/fonts/fraunces?download=zip&subsets=latin&variants=regular,italic,600&formats=woff2"
curl -sL -o literata.zip "https://gwfh.mranftl.com/api/fonts/literata?download=zip&subsets=latin&variants=regular,italic,700&formats=woff2"
curl -sL -o inter.zip "https://gwfh.mranftl.com/api/fonts/inter?download=zip&subsets=latin&variants=regular,600&formats=woff2"
unzip -o fraunces.zip && unzip -o literata.zip && unzip -o inter.zip && rm -f *.zip && ls *.woff2
```

Expected: 8 woff2 files listed (regular/italic/600 or 700 per family). If the API is down, fall back to downloading from fonts.google.com css2 endpoint with a browser UA and extracting the latin woff2 URLs — do not ship the site pointing at Google servers.

- [ ] **Step 2: Write `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Deep Currents — quiet essays for the deep hours, by Scribbler.">
<meta name="theme-color" content="#171020">
<title>Deep Currents — quiet essays for the deep hours</title>
<link rel="stylesheet" href="css/hearth.css">
</head>
<body>
<header class="hearth-header">
  <a class="brand" href="#/">
    <span id="headerFlame" aria-hidden="true"></span>
    <span class="brand-text">
      <span class="brand-name">Deep Currents</span>
      <span class="brand-tag">quiet essays for the deep hours</span>
    </span>
  </a>
  <nav class="hearth-nav" aria-label="site">
    <a href="#/kept" title="kept by the fire">kept</a>
    <a href="#/about">about</a>
  </nav>
</header>
<nav id="rail" class="ember-rail" aria-label="years"></nav>
<div id="chips" class="mood-chips" role="group" aria-label="browse by feeling"></div>
<main id="view" tabindex="-1"></main>
<script src="js/lib.js"></script>
<script src="js/doodles.js"></script>
<script src="js/app.js"></script>
</body>
</html>
```

(`js/*.js` don't exist yet — the page must still render header/nav without them erroring in later verification; they 404 harmlessly for now.)

- [ ] **Step 3: Write `css/hearth.css` — tokens, fonts, base, header**

```css
/* ===== fonts (self-hosted) ===== */
@font-face { font-family: "Fraunces"; src: url("../fonts/fraunces-v39-latin-regular.woff2") format("woff2"); font-weight: 400; font-display: swap; }
@font-face { font-family: "Fraunces"; src: url("../fonts/fraunces-v39-latin-600.woff2") format("woff2"); font-weight: 600; font-display: swap; }
@font-face { font-family: "Fraunces"; src: url("../fonts/fraunces-v39-latin-italic.woff2") format("woff2"); font-weight: 400; font-style: italic; font-display: swap; }
@font-face { font-family: "Literata"; src: url("../fonts/literata-v41-latin-regular.woff2") format("woff2"); font-weight: 400; font-display: swap; }
@font-face { font-family: "Literata"; src: url("../fonts/literata-v41-latin-italic.woff2") format("woff2"); font-weight: 400; font-style: italic; font-display: swap; }
@font-face { font-family: "Literata"; src: url("../fonts/literata-v41-latin-700.woff2") format("woff2"); font-weight: 700; font-display: swap; }
@font-face { font-family: "Inter"; src: url("../fonts/inter-v20-latin-regular.woff2") format("woff2"); font-weight: 400; font-display: swap; }
@font-face { font-family: "Inter"; src: url("../fonts/inter-v20-latin-600.woff2") format("woff2"); font-weight: 600; font-display: swap; }
/* NOTE: verify actual downloaded filenames in fonts/ and fix these urls to match. */

/* ===== tokens ===== */
:root {
  --ink: #171020;          /* deep plum-ink page ground */
  --ink-deep: #100a18;     /* deeper wells: header, reader backdrop */
  --card: #211830;         /* card surface */
  --parchment: #f0e7d8;    /* primary text */
  --parchment-dim: #b9aea6;/* secondary text */
  --ember: #e8a04c;        /* warm ember-gold accent */
  --ember-bright: #ffc46b; /* lit/hover states */
  --dusty: #8fa3c7;        /* dusty blue secondary details */
  --font-display: "Fraunces", Georgia, serif;
  --font-body: "Literata", Georgia, serif;
  --font-label: "Inter", system-ui, sans-serif;
}

/* ===== base ===== */
* { box-sizing: border-box; margin: 0; }
html { scroll-behavior: smooth; }
body {
  background: radial-gradient(120% 80% at 50% -10%, #241732 0%, var(--ink) 55%) fixed var(--ink);
  color: var(--parchment);
  font-family: var(--font-body);
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--ember); text-decoration: none; }
a:hover, a:focus-visible { color: var(--ember-bright); }
:focus-visible { outline: 2px solid var(--ember); outline-offset: 3px; border-radius: 2px; }
img { max-width: 100%; height: auto; }

/* ===== header ===== */
.hearth-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.9rem 1.1rem 0.6rem;
  max-width: 46rem; margin: 0 auto;
}
.brand { display: flex; align-items: center; gap: 0.65rem; color: var(--parchment); }
.brand-name { font-family: var(--font-display); font-weight: 600; font-size: 1.35rem; display: block; letter-spacing: 0.01em; }
.brand-tag { font-family: var(--font-label); font-size: 0.68rem; color: var(--parchment-dim); letter-spacing: 0.06em; display: block; }
#headerFlame { width: 34px; height: 42px; display: inline-block; }
.hearth-nav { display: flex; gap: 1rem; font-family: var(--font-label); font-size: 0.8rem; letter-spacing: 0.04em; }
.hearth-nav a { color: var(--parchment-dim); }
.hearth-nav a:hover { color: var(--ember); }

main { max-width: 46rem; margin: 0 auto; padding: 0 1.1rem 4rem; }

/* ===== reduced motion (global rule; every later animation must respect it) ===== */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 4: Create `.nojekyll`** (empty file — stops GitHub Pages running Jekyll)

- [ ] **Step 5: Verify**

Run: `python -m http.server 8080` (background), open `http://localhost:8080`.
Expected: dark plum page, "Deep Currents" in Fraunces (check DevTools computed font-family — must NOT be Georgia fallback), tagline in Inter, no console errors except the three js 404s, no horizontal scroll at 390px width.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: scaffold app shell, self-hosted fonts, hearth design tokens"
```

---

### Task 2: Content pipeline — `scripts/refresh_posts.py` (TDD)

**Files:**
- Create: `scripts/refresh_posts.py`, `tests/test_refresh_posts.py`
- Produce: `data/posts.json` (real, from the live feed)

**Interfaces:**
- Consumes: Blogger feed `https://deepcurrentswrites.blogspot.com/feeds/posts/default?alt=json&max-results=150`; optional `data/curation.json` (Task 3).
- Produces: `data/posts.json` with schema:

```json
{
  "generated": "ISO-8601",
  "moods": {"cosmic": "3am & cosmic", "warmth": "stranger's warmth", "rain": "rain & melancholy", "climb": "the climb", "ghosts": "ghosts of what was", "quiet": "the quiet self"},
  "posts": [{
    "id": "9128…",            // numeric part of blogger entry id
    "slug": "the-universal-domino",
    "title": "The Universal Domino: When the Ripple Outruns the Splashes",
    "published": "2026-07-02T…",
    "url": "https://deepcurrentswrites.blogspot.com/…html",
    "words": 412,
    "readLength": "a short sit",
    "excerpt": "It is a terrifyingly beautiful realization…",   // ≤ 220 chars, plain text
    "moods": ["cosmic"],
    "doodle": "domino-ripples",
    "html": "<p>…sanitized…</p>"
  }]
}
```
Posts sorted newest-first. Uncurated posts get `"moods": []`, `"doodle": "young-flame"`.

Pure functions later tasks/tests rely on: `sanitize_html(raw) -> str`, `slugify(title, maxlen=48) -> str`, `post_num_id(entry_id) -> str`, `excerpt_of(text, limit=220) -> str`, `read_length(words) -> str`.

- [ ] **Step 1: Write the failing tests** — `tests/test_refresh_posts.py`:

```python
import sys, os, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
from refresh_posts import sanitize_html, slugify, post_num_id, excerpt_of, read_length

class TestSanitize(unittest.TestCase):
    def test_strips_script_and_iframe_entirely(self):
        raw = '<p>hi</p><script>evil()</script><iframe src="x"></iframe><p>bye</p>'
        self.assertEqual(sanitize_html(raw), "<p>hi</p><p>bye</p>")

    def test_strips_inline_styles_and_unknown_attrs(self):
        raw = '<p style="color:red" data-x="1">text</p>'
        self.assertEqual(sanitize_html(raw), "<p>text</p>")

    def test_keeps_semantic_tags_and_href(self):
        raw = '<p><em>a</em> <strong>b</strong> <a href="https://x.y" onclick="p()">c</a></p>'
        self.assertEqual(sanitize_html(raw), '<p><em>a</em> <strong>b</strong> <a href="https://x.y">c</a></p>')

    def test_div_and_span_unwrap_to_content(self):
        raw = '<div>one <span>two</span></div>'
        self.assertEqual(sanitize_html(raw), "<p>one two</p>")

    def test_drops_empty_paragraphs_and_nbsp(self):
        raw = '<p>&nbsp;</p><p></p><p>real</p>'
        self.assertEqual(sanitize_html(raw), "<p>real</p>")

    def test_img_keeps_src_alt_and_gets_lazy(self):
        raw = '<img src="https://a/b.jpg" alt="x" width="999" style="s">'
        self.assertEqual(sanitize_html(raw), '<img src="https://a/b.jpg" alt="x" loading="lazy">')

class TestHelpers(unittest.TestCase):
    def test_slugify_basic(self):
        self.assertEqual(slugify("The Mind's Garden: Weeding!"), "the-minds-garden-weeding")

    def test_slugify_caps_at_hyphen_boundary(self):
        s = slugify("The Universal Domino: When the Ripple Outruns the Splashes", maxlen=30)
        self.assertLessEqual(len(s), 30)
        self.assertFalse(s.endswith("-"))
        self.assertTrue(s.startswith("the-universal-domino"))

    def test_slugify_handles_smart_quotes_and_spaces(self):
        self.assertEqual(slugify("  The Stranger’s  Confessional "), "the-strangers-confessional")

    def test_post_num_id(self):
        self.assertEqual(post_num_id("tag:blogger.com,1999:blog-123.post-4567890"), "4567890")

    def test_excerpt_cuts_at_word_boundary_with_ellipsis(self):
        e = excerpt_of("alpha beta gamma delta", limit=15)
        self.assertEqual(e, "alpha beta…")

    def test_read_length_tiers(self):
        self.assertEqual(read_length(300), "a short sit")
        self.assertEqual(read_length(800), "an evening ember")
        self.assertEqual(read_length(2000), "a long night")

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `python -m unittest tests.test_refresh_posts -v`
Expected: `ModuleNotFoundError: No module named 'refresh_posts'`

- [ ] **Step 3: Write `scripts/refresh_posts.py`**

```python
"""Regenerate data/posts.json from the Blogger feed, merging data/curation.json.

Usage: python scripts/refresh_posts.py            (fetches live feed)
       python scripts/refresh_posts.py feed.json  (uses a saved feed file)
"""
import json, re, sys, html, unicodedata, urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

FEED_URL = ("https://deepcurrentswrites.blogspot.com/feeds/posts/default"
            "?alt=json&max-results=150")
ROOT = Path(__file__).resolve().parent.parent
MOODS = {
    "cosmic": "3am & cosmic", "warmth": "stranger's warmth",
    "rain": "rain & melancholy", "climb": "the climb",
    "ghosts": "ghosts of what was", "quiet": "the quiet self",
}

KEEP = {"p", "em", "i", "strong", "b", "blockquote", "ul", "ol", "li",
        "h2", "h3", "h4", "br", "a", "img"}
DROP_WITH_CONTENT = {"script", "style", "iframe", "object", "noscript"}
UNWRAP = {"div", "span", "section", "article", "font", "u"}

class Sanitizer(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.skip, self.divdepth = [], 0, 0

    def handle_starttag(self, tag, attrs):
        if tag in DROP_WITH_CONTENT:
            self.skip += 1
            return
        if self.skip:
            return
        if tag == "div":
            self.divdepth += 1
            if self.divdepth == 1:
                self.out.append("<p>")
            return
        if tag in UNWRAP:
            return
        if tag not in KEEP:
            return
        if tag == "a":
            href = dict(attrs).get("href", "")
            self.out.append(f'<a href="{html.escape(href, quote=True)}">')
        elif tag == "img":
            a = dict(attrs)
            src = html.escape(a.get("src", ""), quote=True)
            alt = html.escape(a.get("alt", ""), quote=True)
            self.out.append(f'<img src="{src}" alt="{alt}" loading="lazy">')
        elif tag == "br":
            self.out.append("<br>")
        else:
            self.out.append(f"<{tag}>")

    def handle_endtag(self, tag):
        if tag in DROP_WITH_CONTENT:
            self.skip = max(0, self.skip - 1)
            return
        if self.skip:
            return
        if tag == "div":
            if self.divdepth == 1:
                self.out.append("</p>")
            self.divdepth = max(0, self.divdepth - 1)
            return
        if tag in UNWRAP or tag not in KEEP or tag in ("br", "img"):
            return
        self.out.append(f"</{tag}>")

    def handle_data(self, data):
        if not self.skip:
            self.out.append(html.escape(data))

def sanitize_html(raw):
    s = Sanitizer()
    s.feed(raw)
    out = "".join(s.out)
    out = out.replace(" ", " ")
    out = re.sub(r"<p>(\s|<br>)*</p>", "", out)   # empty paragraphs
    out = re.sub(r"\s+", " ", out)
    out = re.sub(r"\s*(</?(?:p|blockquote|ul|ol|li|h2|h3|h4)>)\s*", r"\1", out)
    return out.strip()

def slugify(title, maxlen=48):
    t = unicodedata.normalize("NFKD", title)
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"[‘’']", "", t.lower())
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    if len(t) > maxlen:
        t = t[:maxlen].rsplit("-", 1)[0]
    return t

def post_num_id(entry_id):
    m = re.search(r"\.post-(\d+)$", entry_id)
    return m.group(1) if m else entry_id

def strip_tags(markup):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", markup)).strip()

def excerpt_of(text, limit=220):
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0].rstrip(",.;:") + "…"

def read_length(words):
    if words < 450:
        return "a short sit"
    if words <= 1100:
        return "an evening ember"
    return "a long night"

def build(feed):
    curation_path = ROOT / "data" / "curation.json"
    curation = {}
    if curation_path.exists():
        curation = json.loads(curation_path.read_text(encoding="utf-8"))
    posts = []
    for e in feed["feed"].get("entry", []):
        pid = post_num_id(e["id"]["$t"])
        title = e["title"]["$t"].strip()
        clean = sanitize_html(e.get("content", {}).get("$t", ""))
        text = strip_tags(clean)
        words = len(text.split())
        url = next((l["href"] for l in e["link"] if l["rel"] == "alternate"), "")
        cur = curation.get(pid, {})
        posts.append({
            "id": pid,
            "slug": slugify(title),
            "title": title,
            "published": e["published"]["$t"],
            "url": url,
            "words": words,
            "readLength": read_length(words),
            "excerpt": excerpt_of(text),
            "moods": cur.get("moods", []),
            "doodle": cur.get("doodle", "young-flame"),
            "html": clean,
        })
    posts.sort(key=lambda p: p["published"], reverse=True)
    # slug uniqueness: suffix -2, -3… on collision
    seen = {}
    for p in posts:
        n = seen.get(p["slug"], 0) + 1
        seen[p["slug"]] = n
        if n > 1:
            p["slug"] = f"{p['slug']}-{n}"
    return {"generated": datetime.now(timezone.utc).isoformat(),
            "moods": MOODS, "posts": posts}

def main():
    if len(sys.argv) > 1:
        feed = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    else:
        with urllib.request.urlopen(FEED_URL, timeout=30) as r:
            feed = json.load(r)
    data = build(feed)
    out = ROOT / "data" / "posts.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {out} with {len(data['posts'])} posts")

if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `python -m unittest tests.test_refresh_posts -v`
Expected: all tests PASS. If a sanitize test fails on whitespace details, fix the *implementation* until the specified expected outputs match — the expected strings in the tests are the contract.

- [ ] **Step 5: Generate real `data/posts.json`**

Run: `python scripts/refresh_posts.py`
Expected: `wrote …data/posts.json with 34 posts`.
Then sanity-check: `python -c "import json;d=json.load(open('data/posts.json',encoding='utf-8'));print(len(d['posts']),d['posts'][0]['slug'],d['posts'][0]['readLength'])"` — 34 posts, newest first (`the-universal-domino…`), every post has non-empty `html`, `excerpt`, unique `slug`.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: content pipeline generating posts.json from Blogger feed (TDD)"
```

---

### Task 3: Curation — moods + doodle ids for all 34 essays

**Files:**
- Create: `scripts/build_curation.py` (one-off generator), `data/curation.json`
- Regenerate: `data/posts.json`

**Interfaces:**
- Consumes: `data/posts.json` from Task 2 (matches by title prefix, keys by post `id`).
- Produces: `data/curation.json`: `{ "<postId>": {"title": "…", "moods": ["…"], "doodle": "…"}, … }`. The doodle ids below are the exact registry keys Task 5 must implement.

- [ ] **Step 1: Write `scripts/build_curation.py`** with the full curation table (title prefixes are matched case-insensitively against `posts.json` titles):

```python
"""One-off: build data/curation.json by matching curated rows to post ids."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# (title-prefix, [moods], doodle-id)
TABLE = [
    ("The Universal Domino",            ["cosmic"],           "domino-ripples"),
    ("The Stranger",                    ["warmth"],           "train-window"),
    ("The Blind Man",                   ["warmth", "quiet"],  "cane-path"),
    ("The Weighted Walk",               ["warmth", "rain"],   "park-bench"),
    ("The Secret Sanctuary",            ["rain"],             "rain-cupped-hands"),
    ("The Architecture of the Silent",  ["quiet", "ghosts"],  "walled-heart"),
    ("The Survival Drift",              ["climb", "rain"],    "boat-adrift"),
    ("The Sound of Shifting Sands",     ["quiet"],            "shifting-dunes"),
    ("The Curse of the Almost-Chosen",  ["ghosts", "rain"],   "almost-touch"),
    ("The Transient Nature",            ["ghosts", "warmth"], "platform-goodbye"),
    ("The Double-Edged Blade",          ["quiet"],            "double-blade"),
    ("The Ageless Grind",               ["warmth", "climb"],  "cradled-home"),
    ("The Haunting of What Was",        ["ghosts"],           "spun-compass"),
    ("The Price of Ascent",             ["climb"],            "empty-summit"),
    ("The Echo Chamber",                ["rain", "warmth"],   "echo-rings"),
    ("The Silent Architects",           ["quiet", "warmth"],  "cracked-pillar"),
    ("The Rewind Button",               ["cosmic", "ghosts"], "melting-rewind"),
    ("Normal? A Mirage",                ["quiet", "cosmic"],  "heat-mirage"),
    ("The Kaleidoscope of Perception",  ["cosmic"],           "kaleidoscope"),
    ("The Puppet Show",                 ["cosmic"],           "puppet-strings"),
    ("The Artist",                      ["climb", "quiet"],   "two-masks-brush"),
    ("The Character Switch",            ["quiet"],            "avatar-select"),
    ("The Inevitable Question",         ["cosmic"],           "grave-question"),
    ("The Shattered Cabinets",          ["quiet"],            "shattered-cabinet"),
    ("A Universe of Unchosen Paths",    ["cosmic"],           "branching-paths"),
    ("The Möbius Strip of Life",   ["cosmic", "quiet"],  "mobius-strip"),
    ("The Mind",                        ["quiet"],            "mind-garden"),
    ("The Allure of Yesterday",         ["ghosts"],           "hourglass-sun"),
    ("The Illusion of Perfection",      ["quiet"],            "wobbled-circle"),
    ("The Island Within",               ["rain", "quiet"],    "inner-island"),
    ("The Lonely Hearts Club",          ["rain", "ghosts"],   "stitched-heart"),
    ("The Solitary Symphony",           ["rain", "cosmic"],   "moon-notes"),
    ("The Peril of Perception",         ["quiet"],            "lens-crack"),
    ("The Present Paradox",             ["quiet", "cosmic"],  "labyrinth"),
]

def main():
    posts = json.loads((ROOT / "data" / "posts.json").read_text(encoding="utf-8"))["posts"]
    unmatched_posts = {p["id"]: p["title"] for p in posts}
    curation = {}
    for prefix, moods, doodle in TABLE:
        hits = [p for p in posts
                if p["title"].strip().lower().startswith(prefix.lower())
                and p["id"] in unmatched_posts]
        assert len(hits) == 1, f"prefix {prefix!r} matched {len(hits)}: {[h['title'] for h in hits]}"
        p = hits[0]
        del unmatched_posts[p["id"]]
        curation[p["id"]] = {"title": p["title"], "moods": moods, "doodle": doodle}
    assert not unmatched_posts, f"uncurated posts remain: {list(unmatched_posts.values())}"
    out = ROOT / "data" / "curation.json"
    out.write_text(json.dumps(curation, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {out} with {len(curation)} entries")

main()
```

Beware two title quirks from the live feed: some titles begin with a literal space (e.g. `" The Weighted Walk…"`) — the `.strip()` in the matcher handles it — and "The Artist"/"The Mind" prefixes are ordered after longer "The Art…"/"The Mind…" collisions can't occur (assert catches any double-match; if one fires, lengthen the prefix).

- [ ] **Step 2: Run it, then regenerate posts.json**

```bash
python scripts/build_curation.py && python scripts/refresh_posts.py
```
Expected: `wrote …curation.json with 34 entries` then `wrote …posts.json with 34 posts`.

- [ ] **Step 3: Verify no post is uncurated**

Run: `python -c "import json;d=json.load(open('data/posts.json',encoding='utf-8'));bad=[p['title'] for p in d['posts'] if not p['moods'] or p['doodle']=='young-flame'];print('OK' if not bad else bad)"`
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: curate moods and doodle assignments for all 34 essays"
```

---

### Task 4: `js/lib.js` — pure logic (TDD with node --test)

**Files:**
- Create: `js/lib.js`, `tests/lib.test.mjs`

**Interfaces:**
- Produces global `HearthLib` (browser) / module export (node) with EXACT signatures:
  - `yearOf(iso)` → number (UTC year)
  - `formatDate(iso)` → `"2 July 2026"`
  - `readLengthLabel(words)` → same tiers/strings as Python `read_length`
  - `stripTags(html)` → plain text, whitespace collapsed
  - `excerptOf(text, limit=220)` → same contract as Python `excerpt_of`
  - `escapeHtml(s)` → escapes `& < > " '`
  - `guessMoods(title, text)` → array of 1–2 mood keys (keyword scoring, below); falls back to `["quiet"]`
  - `anotherCurrent(slug, posts)` → the post (not self) sharing most moods; ties broken by smallest absolute published-date gap; `null` if `posts.length < 2`

- [ ] **Step 1: Write failing tests** — `tests/lib.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import lib from "../js/lib.js";

test("yearOf and formatDate", () => {
  assert.equal(lib.yearOf("2026-07-02T04:30:00.000-07:00"), 2026);
  assert.equal(lib.formatDate("2026-07-02T04:30:00.000-07:00"), "2 July 2026");
});

test("readLengthLabel tiers match python", () => {
  assert.equal(lib.readLengthLabel(300), "a short sit");
  assert.equal(lib.readLengthLabel(800), "an evening ember");
  assert.equal(lib.readLengthLabel(2000), "a long night");
});

test("stripTags and excerptOf", () => {
  assert.equal(lib.stripTags("<p>a  <em>b</em></p>"), "a b");
  assert.equal(lib.excerptOf("alpha beta gamma delta", 15), "alpha beta…");
});

test("escapeHtml", () => {
  assert.equal(lib.escapeHtml(`<a b="c">&'`), "&lt;a b=&quot;c&quot;&gt;&amp;&#39;");
});

test("guessMoods finds rain, falls back to quiet", () => {
  assert.deepEqual(lib.guessMoods("Why We Crave the Rain", "sadness and melancholy tonight"), ["rain"]);
  assert.deepEqual(lib.guessMoods("Untitled", "nothing matching here at all zzz"), ["quiet"]);
});

test("anotherCurrent prefers shared moods then date proximity", () => {
  const posts = [
    { slug: "a", moods: ["rain", "quiet"], published: "2026-01-01T00:00:00Z" },
    { slug: "b", moods: ["rain"],          published: "2026-02-01T00:00:00Z" },
    { slug: "c", moods: ["rain", "quiet"], published: "2020-01-01T00:00:00Z" },
    { slug: "d", moods: ["cosmic"],        published: "2026-01-02T00:00:00Z" },
  ];
  assert.equal(lib.anotherCurrent("a", posts).slug, "c"); // 2 shared moods beats b's 1
  assert.equal(lib.anotherCurrent("d", posts), posts[0] === lib.anotherCurrent("d", posts) ? posts[0] : lib.anotherCurrent("d", posts)); // no shared moods → nearest date, which is "a"
  assert.equal(lib.anotherCurrent("d", posts).slug, "a");
  assert.equal(lib.anotherCurrent("x", [posts[0]]), null);
});
```

- [ ] **Step 2: Run, verify failure**

Run: `node --test tests/lib.test.mjs`
Expected: FAIL (cannot find module `../js/lib.js`).

- [ ] **Step 3: Write `js/lib.js`** (UMD-style dual export so both browser and node --test can load it):

```js
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.HearthLib = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const MONTHS = ["January","February","March","April","May","June","July",
                  "August","September","October","November","December"];

  const MOOD_KEYWORDS = {
    cosmic: ["universe","cosmos","cosmic","multiverse","quantum","existence","purpose","3 a.m","3am","infinite","reality","simulation"],
    warmth: ["stranger","strangers","crowd","train","listener","confess","people","observer","kindness","healer"],
    rain:   ["rain","lonely","loneliness","melancholy","sadness","sad","night","dark","tears","somber","blue"],
    climb:  ["achievement","summit","goal","success","striving","ambition","grind","work","survive","survival"],
    ghosts: ["past","memory","memories","nostalgia","goodbye","gone","yesterday","haunting","regret","lost"],
    quiet:  ["silence","silent","introvert","overthink","mind","self","alone","solitude","identity","thoughts"],
  };

  function yearOf(iso) { return new Date(iso).getUTCFullYear(); }

  function formatDate(iso) {
    const d = new Date(iso);
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  }

  function readLengthLabel(words) {
    if (words < 450) return "a short sit";
    if (words <= 1100) return "an evening ember";
    return "a long night";
  }

  function stripTags(html) {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  function excerptOf(text, limit = 220) {
    if (text.length <= limit) return text;
    let cut = text.slice(0, limit);
    cut = cut.slice(0, cut.lastIndexOf(" "));
    return cut.replace(/[,.;:]+$/, "") + "…";
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function guessMoods(title, text) {
    const hay = (title + " " + text).toLowerCase();
    const scores = Object.entries(MOOD_KEYWORDS)
      .map(([mood, words]) => [mood, words.filter(w => hay.includes(w)).length])
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1]);
    if (!scores.length) return ["quiet"];
    return scores.slice(0, scores.length > 1 && scores[1][1] === scores[0][1] ? 2 : 1)
                 .slice(0, 2).map(([m]) => m);
  }

  function anotherCurrent(slug, posts) {
    const self = posts.find(p => p.slug === slug);
    const others = posts.filter(p => p.slug !== slug);
    if (!others.length) return null;
    const t0 = self ? new Date(self.published).getTime() : 0;
    const myMoods = new Set(self ? self.moods : []);
    let best = null, bestShared = -1, bestGap = Infinity;
    for (const p of others) {
      const shared = p.moods.filter(m => myMoods.has(m)).length;
      const gap = Math.abs(new Date(p.published).getTime() - t0);
      if (shared > bestShared || (shared === bestShared && gap < bestGap)) {
        best = p; bestShared = shared; bestGap = gap;
      }
    }
    return best;
  }

  return { yearOf, formatDate, readLengthLabel, stripTags, excerptOf,
           escapeHtml, guessMoods, anotherCurrent };
});
```

- [ ] **Step 4: Run, verify pass**

Run: `node --test tests/lib.test.mjs`
Expected: all tests pass. (Node loads the `.js` file via CommonJS `require` under the hood of the UMD guard — if node complains about module type, rename nothing; instead run `node --test` from repo root where no `package.json` sets `"type": "module"` for `js/`.)

Note on the `guessMoods` rain test: "Why We Crave the Rain" + "sadness and melancholy tonight" hits rain-words rain/sadness/melancholy (3) with no tie — expect exactly `["rain"]`. If scoring returns two moods, the implementation's tie rule is wrong, not the test.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: HearthLib pure logic with node --test coverage"
```

---

### Task 5: `js/doodles.js` — 34 bespoke doodles + flame + avatar

**Files:**
- Create: `js/doodles.js`, `tests/doodles.test.mjs`, `doodle-gallery.html` (dev-only page, committed — it's the doodles' regression fixture)

**Interfaces:**
- Consumes: doodle ids from `data/curation.json` (Task 3 table).
- Produces globals:
  - `DOODLES` — `{ [id]: { vb: "0 0 120 120", paths: ["M…", …] } }`. Every path is a stroke path (no fills).
  - `doodleSvg(id, cls)` → SVG markup string: `<svg class="doodle ${cls}" viewBox="…" aria-hidden="true">` with one `<path>` per entry, `fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"`.
  - `igniteDoodles(rootEl)` → finds `.doodle:not(.lit)` under rootEl, and for each: computes every path's `getTotalLength()`, sets `stroke-dasharray`/`stroke-dashoffset` to it, forces reflow, adds class `lit` (CSS transitions offset to 0, staggered 120ms per path via `transition-delay`). If `matchMedia("(prefers-reduced-motion: reduce)").matches`, just adds `lit` with no dash setup (renders fully drawn).
- Dual-export like lib.js so node tests can `require` it (guard all DOM access inside `igniteDoodles`).

**Required registry keys** (35 + 2 non-post): every `doodle` value in `data/curation.json` (the 34 ids in the Task 3 table) plus `young-flame` (default for uncurated/live posts), `hearth-flame` (header), `scribbler-quill` (about avatar).

**Design brief per doodle** (the concept is decided here; the path data is drawn at execution and verified visually in the gallery — single-stroke, naive hand-drawn feel, 120×120 viewBox, 2–6 paths each):

| id | concept |
|---|---|
| domino-ripples | three dominoes mid-topple, the last dissolving into concentric ripples |
| train-window | rounded train window, two facing silhouettes, small moon outside |
| cane-path | winding path traced by a cane's tapping arcs |
| park-bench | empty park bench, earphone cord curling up into the air, a bird above |
| rain-cupped-hands | cupped hands catching slanted rain strokes |
| walled-heart | small heart behind a neat brick wall with one brick missing |
| boat-adrift | tiny boat on long swells, deliberately no horizon line |
| shifting-dunes | two dune crests, wind strokes lifting grains off the top |
| almost-touch | two hands reaching toward each other, dotted line across the small gap |
| platform-goodbye | suitcase alone on a platform edge, motion lines of a departed train |
| double-blade | a blade whose two edges ripple like water |
| cradled-home | pair of worn hands cradling a small house |
| spun-compass | compass rose with needle mid-spin (motion arcs) |
| empty-summit | mountain peak, tiny flag, hollow circle sun above |
| echo-rings | small figure speaking, sound arcs curving back at them |
| cracked-pillar | classical pillar with hairline cracks, still holding its roof line |
| melting-rewind | double-triangle rewind symbol with bottom edges dripping |
| heat-mirage | flat horizon, shimmer squiggles, faint upside-down oasis reflection |
| kaleidoscope | eye at center, mirrored shards radiating outward |
| puppet-strings | marionette control bar, strings down to a small figure, one string cut |
| two-masks-brush | theatre mask beside a plain face, paintbrush between them |
| avatar-select | two standing figures, selection brackets around one, swap arrows |
| grave-question | headstone whose top curls into a question mark |
| shattered-cabinet | cabinet with cracked panes, one door open spilling a single line |
| branching-paths | one line branching three ways, one branch bolder ending in a dot |
| mobius-strip | möbius band with a tiny figure walking its surface |
| mind-garden | head in profile, a flower and a weed sprouting from it, tiny shears |
| hourglass-sun | hourglass with a small sun sifting down as sand |
| wobbled-circle | almost-perfect hand-drawn circle with a tiny gap where it fails to close |
| inner-island | small island with one tree, a rowboat approaching it |
| stitched-heart | heart crossed by visible stitches, needle mid-stitch |
| moon-notes | crescent moon with music notes drifting off, fading to dots |
| lens-crack | magnifying glass held over a tiny crack in an otherwise smooth line |
| labyrinth | round maze, dot at center, entrance path partly traced |
| young-flame | single small candle flame, one wavering inner stroke |
| hearth-flame | taller doodled flame with two inner licks (header; Task 8 animates flicker) |
| scribbler-quill | quill pen whose feather tip curls into a small flame |

Example of the required shape (fully worked — use as the pattern for all others):

```js
const DOODLES = {
  "young-flame": {
    vb: "0 0 120 120",
    paths: [
      "M60 96 C38 84 34 62 46 44 C52 36 56 28 55 18 C70 30 84 48 82 68 C81 82 72 92 60 96 Z",
      "M60 84 C52 78 50 68 56 60 C59 56 60 52 59 47 C67 54 72 63 70 72 C69 78 65 82 60 84",
    ],
  },
  "wobbled-circle": {
    vb: "0 0 120 120",
    paths: [
      "M63 22 C88 24 102 44 99 66 C96 88 76 101 55 98 C34 95 20 76 23 55 C26 36 40 24 57 22",
    ],
  },
  "branching-paths": {
    vb: "0 0 120 120",
    paths: [
      "M18 98 C40 84 48 70 52 56",
      "M52 56 C50 40 44 30 34 22",
      "M52 56 C58 42 58 30 54 16",
      "M52 56 C68 46 84 40 100 40",
      "M100 40 a3.5 3.5 0 1 0 0.1 0",
    ],
  },
  // …all remaining ids, same structure…
};

function doodleSvg(id, cls = "") {
  const d = DOODLES[id] || DOODLES["young-flame"];
  const paths = d.paths.map(p =>
    `<path d="${p}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
  ).join("");
  return `<svg class="doodle ${cls}" viewBox="${d.vb}" aria-hidden="true">${paths}</svg>`;
}

function igniteDoodles(rootEl) {
  const reduced = typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  rootEl.querySelectorAll("svg.doodle:not(.lit)").forEach(svg => {
    if (!reduced) {
      svg.querySelectorAll("path").forEach((p, i) => {
        const len = p.getTotalLength();
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
        p.style.transitionDelay = `${i * 120}ms`;
      });
      svg.getBoundingClientRect(); // reflow so the transition runs
    }
    svg.classList.add("lit");
  });
}
```

And in `css/hearth.css` add:

```css
.doodle { color: var(--ember); width: 72px; height: 72px; }
.doodle path { transition: stroke-dashoffset 1.4s ease-out; }
.doodle.lit path { stroke-dashoffset: 0 !important; }
```

- [ ] **Step 1: Write failing registry test** — `tests/doodles.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import doodles from "../js/doodles.js";

test("every curated doodle id exists with valid stroke paths", () => {
  const posts = JSON.parse(fs.readFileSync("data/posts.json", "utf-8")).posts;
  const needed = new Set([...posts.map(p => p.doodle), "young-flame", "hearth-flame", "scribbler-quill"]);
  for (const id of needed) {
    const d = doodles.DOODLES[id];
    assert.ok(d, `missing doodle: ${id}`);
    assert.match(d.vb, /^0 0 \d+ \d+$/);
    assert.ok(d.paths.length >= 1 && d.paths.length <= 8, `${id} path count`);
    for (const p of d.paths) assert.match(p, /^M/, `${id} path must start with M`);
  }
});

test("doodleSvg falls back to young-flame for unknown ids", () => {
  assert.ok(doodles.doodleSvg("no-such-id").includes("svg"));
});
```

- [ ] **Step 2: Run, verify failure** — `node --test tests/doodles.test.mjs` → cannot find module.

- [ ] **Step 3: Create `doodle-gallery.html`** — a dev page that loads `doodles.js` and renders every registry entry with its id label on the dark ground, and an "ignite all" button calling `igniteDoodles(document.body)`:

```html
<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>doodle gallery (dev)</title><link rel="stylesheet" href="css/hearth.css">
<style>.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:1rem;padding:1rem}
.g figure{text-align:center}.g figcaption{font:0.6rem/1.4 var(--font-label);color:var(--parchment-dim)}</style>
</head><body>
<button onclick="igniteDoodles(document.body)" style="margin:1rem">ignite all</button>
<div class="g" id="g"></div>
<script src="js/doodles.js"></script>
<script>
  document.getElementById("g").innerHTML = Object.keys(DOODLES).map(id =>
    `<figure>${doodleSvg(id)}<figcaption>${id}</figcaption></figure>`).join("");
</script>
</body></html>
```

- [ ] **Step 4: Draw all 37 doodles in `js/doodles.js`** per the design-brief table, iterating against the gallery in the browser (`python -m http.server 8080` → `/doodle-gallery.html`). Screenshot the gallery. Acceptance: every doodle is recognizable as its concept at 72px, reads as hand-drawn line work (slightly imperfect curves, no straight ruler lines except where the concept demands), no fills, all strokes visible on the dark ground.

- [ ] **Step 5: Run tests, verify pass** — `node --test tests/doodles.test.mjs` → PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: 34 bespoke essay doodles plus flame and quill, self-drawing on ignite"
```

---

### Task 6: Feed — cards, mood chips, ember-year rail, doodle ignition

**Files:**
- Create: `js/app.js`
- Modify: `css/hearth.css` (append feed styles)

**Interfaces:**
- Consumes: `HearthLib`, `DOODLES`/`doodleSvg`/`igniteDoodles`, `data/posts.json`, DOM ids from Task 1.
- Produces (used by Tasks 7–9): global `App = { posts: [], moods: {}, filter: null }`; `Store` wrapper with `Store.get(key, fallback)` / `Store.set(key, value)` and keys `hearth.kept` (array of slugs), `hearth.resume` (`{slug, ratio}` or null), `hearth.textsize` (number 0|1|2); functions `render()` (routes on `location.hash`), `renderFeed()`, `cardHtml(post)`; router mapping `#/` → feed, `#/kept`, `#/about`, `#/<slug>` → reader (Task 7 fills in reader/kept/about — until then they render the feed).

- [ ] **Step 1: Write `js/app.js` core** (complete reference implementation):

```js
/* Deep Currents app: state, storage, router, feed. Reader/shelf/about in later tasks. */
const Store = (() => {
  let ok = true; const mem = {};
  try { localStorage.setItem("__t", "1"); localStorage.removeItem("__t"); }
  catch (e) { ok = false; }
  return {
    get(k, fallback) {
      try { const v = ok ? localStorage.getItem(k) : mem[k];
            return v == null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set(k, v) {
      const s = JSON.stringify(v);
      if (ok) { try { localStorage.setItem(k, s); return; } catch (e) { ok = false; } }
      mem[k] = s;
    },
  };
})();

const App = { posts: [], moods: {}, filter: null };
const L = HearthLib;
const view = document.getElementById("view");

function keptSlugs() { return Store.get("hearth.kept", []); }
function isKept(slug) { return keptSlugs().includes(slug); }
function toggleKept(slug) {
  const k = keptSlugs();
  Store.set("hearth.kept", k.includes(slug) ? k.filter(s => s !== slug) : [...k, slug]);
}

/* ---------- feed ---------- */
function cardHtml(p) {
  const chips = p.moods.map(m =>
    `<span class="chip chip-static">${L.escapeHtml(App.moods[m] || m)}</span>`).join("");
  return `<article class="card${p.fresh ? " fresh" : ""}" data-year="${L.yearOf(p.published)}">
    <a class="card-link" href="#/${p.slug}">
      <div class="card-doodle">${doodleSvg(p.doodle)}</div>
      <h2 class="card-title">${L.escapeHtml(p.title)}</h2>
      <p class="card-meta">${L.formatDate(p.published)} · ${p.readLength}${p.fresh ? " · fresh from the fire" : ""}</p>
      <p class="card-excerpt">${L.escapeHtml(p.excerpt)}</p>
      <span class="card-moods">${chips}</span>
    </a>
  </article>`;
}

function resumeCardHtml() {
  const r = Store.get("hearth.resume", null);
  if (!r) return "";
  const p = App.posts.find(x => x.slug === r.slug);
  if (!p || r.ratio < 0.02 || r.ratio > 0.97) return "";
  return `<a class="resume-card" href="#/${p.slug}">
    <span class="resume-flame">${doodleSvg("young-flame")}</span>
    <span>still burning: <em>${L.escapeHtml(p.title)}</em></span>
  </a>`;
}

function renderChips() {
  const el = document.getElementById("chips");
  el.innerHTML = Object.entries(App.moods).map(([k, label]) =>
    `<button class="chip${App.filter === k ? " on" : ""}" data-mood="${k}">${L.escapeHtml(label)}</button>`
  ).join("");
  el.querySelectorAll(".chip").forEach(b => b.onclick = () => {
    App.filter = App.filter === b.dataset.mood ? null : b.dataset.mood;
    renderChips(); renderFeed();
  });
}

function renderRail() {
  const years = [...new Set(App.posts.map(p => L.yearOf(p.published)))].sort((a, b) => b - a);
  const el = document.getElementById("rail");
  el.innerHTML = years.map(y =>
    `<button class="rail-seg" data-year="${y}" aria-label="essays from ${y}"><span></span><small>${y}</small></button>`
  ).join("");
  el.querySelectorAll(".rail-seg").forEach(b => b.onclick = () => {
    const card = view.querySelector(`.card[data-year="${b.dataset.year}"]`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

let feedObserver = null;
function watchFeed() {
  if (feedObserver) feedObserver.disconnect();
  feedObserver = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      igniteDoodles(e.target);
      const y = e.target.dataset.year;
      document.querySelectorAll(".rail-seg").forEach(s =>
        s.classList.toggle("glow", s.dataset.year === y));
    }
  }, { threshold: 0.35 });
  view.querySelectorAll(".card").forEach(c => feedObserver.observe(c));
}

function renderFeed() {
  const posts = App.filter ? App.posts.filter(p => p.moods.includes(App.filter)) : App.posts;
  document.getElementById("rail").hidden = false;
  document.getElementById("chips").hidden = false;
  view.innerHTML = resumeCardHtml() + (posts.length
    ? `<div class="feed">${posts.map(cardHtml).join("")}</div>`
    : `<p class="empty">no embers here tonight.</p>`);
  watchFeed();
}

/* ---------- router ---------- */
function render() {
  const h = location.hash.replace(/^#\/?/, "");
  if (feedObserver) feedObserver.disconnect();
  if (!h) return renderFeed();
  if (h === "kept" || h === "about") return renderFeed();   // Task 8 replaces
  const post = App.posts.find(p => p.slug === h);
  return post ? renderFeed() : renderFeed();                 // Task 7 replaces with renderReader(post)
}

/* ---------- boot ---------- */
async function boot() {
  const data = await (await fetch("data/posts.json")).json();
  App.posts = data.posts;
  App.moods = data.moods;
  document.getElementById("headerFlame").innerHTML = doodleSvg("hearth-flame", "flame");
  igniteDoodles(document.querySelector(".hearth-header"));
  renderChips(); renderRail(); render();
  window.addEventListener("hashchange", render);
}
boot();
```

- [ ] **Step 2: Append feed CSS to `css/hearth.css`**

```css
/* ===== mood chips ===== */
.mood-chips { display: flex; gap: 0.5rem; overflow-x: auto; padding: 0.4rem 1.1rem 0.8rem;
  max-width: 46rem; margin: 0 auto; scrollbar-width: none; }
.mood-chips::-webkit-scrollbar { display: none; }
.chip { font-family: var(--font-label); font-size: 0.72rem; letter-spacing: 0.03em;
  color: var(--dusty); background: none; border: 1px solid color-mix(in srgb, var(--dusty) 35%, transparent);
  border-radius: 999px; padding: 0.3rem 0.8rem; white-space: nowrap; cursor: pointer;
  transition: color 0.25s, border-color 0.25s, background 0.25s; }
.chip.on { color: var(--ink-deep); background: var(--ember); border-color: var(--ember); }
.chip-static { pointer-events: none; font-size: 0.62rem; padding: 0.15rem 0.55rem; }

/* ===== ember rail ===== */
.ember-rail { position: sticky; top: 0; z-index: 5; display: flex; gap: 0.4rem;
  justify-content: center; padding: 0.35rem 1.1rem;
  background: color-mix(in srgb, var(--ink-deep) 82%, transparent); backdrop-filter: blur(6px); }
.rail-seg { background: none; border: 0; cursor: pointer; display: grid; gap: 2px;
  justify-items: center; padding: 0.2rem 0.4rem; }
.rail-seg span { width: 44px; height: 3px; border-radius: 2px;
  background: color-mix(in srgb, var(--ember) 25%, transparent); transition: background 0.4s, box-shadow 0.4s; }
.rail-seg small { font-family: var(--font-label); font-size: 0.58rem; color: var(--parchment-dim); }
.rail-seg.glow span { background: var(--ember-bright); box-shadow: 0 0 8px var(--ember); }

/* ===== feed cards ===== */
.feed { display: grid; gap: 1.1rem; padding-top: 0.8rem; scroll-snap-type: y proximity; }
.card { scroll-snap-align: start; scroll-margin-top: 3.2rem; background: var(--card);
  border: 1px solid color-mix(in srgb, var(--ember) 12%, transparent);
  border-radius: 14px; transition: border-color 0.4s, transform 0.4s; }
.card:hover { border-color: color-mix(in srgb, var(--ember) 40%, transparent); transform: translateY(-2px); }
.card-link { display: block; color: inherit; padding: 1.2rem 1.2rem 1.1rem; }
.card-doodle { margin-bottom: 0.5rem; }
.card-title { font-family: var(--font-display); font-weight: 600; font-size: 1.22rem;
  line-height: 1.3; color: var(--parchment); }
.card-meta { font-family: var(--font-label); font-size: 0.68rem; color: var(--dusty);
  letter-spacing: 0.05em; margin: 0.4rem 0 0.55rem; }
.card-excerpt { color: var(--parchment-dim); font-size: 0.92rem;
  -webkit-mask-image: linear-gradient(180deg, #000 60%, transparent); mask-image: linear-gradient(180deg, #000 60%, transparent); }
.card-moods { display: flex; gap: 0.4rem; margin-top: 0.6rem; }
.card.fresh { border-color: color-mix(in srgb, var(--ember-bright) 45%, transparent); }
.empty { text-align: center; color: var(--dusty); font-style: italic; padding: 3rem 0; }

/* ===== resume card ===== */
.resume-card { display: flex; align-items: center; gap: 0.7rem; margin-top: 0.8rem;
  padding: 0.7rem 1rem; border: 1px dashed color-mix(in srgb, var(--ember) 45%, transparent);
  border-radius: 12px; color: var(--parchment-dim); font-size: 0.9rem; }
.resume-card em { color: var(--ember); font-style: italic; }
.resume-flame .doodle { width: 26px; height: 30px; }
```

- [ ] **Step 3: Verify in browser** — serve, open at 390px viewport: 34 cards render newest-first; each doodle self-draws as it scrolls into view; year rail glows per visible card's year and clicking `2025` jumps to the first 2025 card; tapping a chip filters (e.g. "rain & melancholy" shows only rain-tagged essays), tapping again clears; a mood with no matches is impossible here but temporarily set `App.filter="nonexistent"` in console → "no embers here tonight."; no horizontal scroll; no console errors. Screenshot the feed for the user.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: hearth feed with mood chips, ember-year rail, self-drawing doodles"
```

---

### Task 7: Reader — full-screen essay view

**Files:**
- Modify: `js/app.js` (replace the router's post branch with `renderReader(post)`), `css/hearth.css` (append)

**Interfaces:**
- Consumes: `App`, `Store`, `L`, `doodleSvg`, `igniteDoodles`, `toggleKept`/`isKept` from Task 6.
- Produces: `renderReader(post)`; resume tracking writing `Store.set("hearth.resume", {slug, ratio})`; text-size persisted at `hearth.textsize` (0 small / 1 default / 2 large → reader font-size 1rem / 1.08rem / 1.18rem).

- [ ] **Step 1: Implement `renderReader` in `js/app.js`** and wire the router (`const post = App.posts.find(p => p.slug === h); return post ? renderReader(post) : renderFeed();`):

```js
function renderReader(post) {
  document.getElementById("rail").hidden = true;
  document.getElementById("chips").hidden = true;
  const next = L.anotherCurrent(post.slug, App.posts);
  const size = Store.get("hearth.textsize", 1);
  view.innerHTML = `
  <div class="reader" data-size="${size}">
    <div class="reader-progress"><span id="emberBar"></span></div>
    <p class="reader-top"><a href="#/">&larr; back to the fire</a>
      <span class="sizer">
        <button data-s="0" aria-label="small text">A</button><button data-s="1" aria-label="medium text">A</button><button data-s="2" aria-label="large text">A</button>
      </span></p>
    <div class="reader-doodle">${doodleSvg(post.doodle)}</div>
    <h1 class="reader-title">${L.escapeHtml(post.title)}</h1>
    <p class="reader-meta">${L.formatDate(post.published)} · ${post.readLength}</p>
    <div class="essay">${post.html}</div>
    <div class="reader-foot">
      <button class="keep${isKept(post.slug) ? " kept" : ""}" id="keepBtn">
        ${isKept(post.slug) ? "kept by the fire" : "keep by the fire"}</button>
      <p class="canonical"><a href="${post.url}" rel="canonical noopener" target="_blank">this essay also lives at Deep Currents on Blogger</a></p>
      ${next ? `<div class="another"><h3>another current</h3>${cardHtml(next)}</div>` : ""}
    </div>
  </div>`;
  window.scrollTo(0, 0);
  igniteDoodles(view.querySelector(".reader-doodle"));

  const readerEl = view.querySelector(".reader");
  view.querySelectorAll(".sizer button").forEach(b => b.onclick = () => {
    Store.set("hearth.textsize", Number(b.dataset.s));
    readerEl.dataset.size = b.dataset.s;
  });

  document.getElementById("keepBtn").onclick = (ev) => {
    toggleKept(post.slug);
    ev.target.classList.toggle("kept", isKept(post.slug));
    ev.target.textContent = isKept(post.slug) ? "kept by the fire" : "keep by the fire";
    renderHeaderFlame(); // Task 8; safe no-op if not yet defined? NO — define stub now: function renderHeaderFlame(){} until Task 8.
  };

  // ember progress + resume tracking
  const bar = document.getElementById("emberBar");
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const ratio = max > 0 ? Math.min(1, scrollY / max) : 1;
      bar.style.width = (ratio * 100) + "%";
      Store.set("hearth.resume", ratio > 0.97 ? null : { slug: post.slug, ratio });
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  const stop = () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("hashchange", stop); };
  window.addEventListener("hashchange", stop);
  const r = Store.get("hearth.resume", null);
  if (r && r.slug === post.slug && r.ratio > 0.02) {
    requestAnimationFrame(() =>
      window.scrollTo(0, r.ratio * (document.documentElement.scrollHeight - innerHeight)));
  }
}
```

Include the stub `function renderHeaderFlame() {}` at the top of app.js in this task (Task 8 replaces it).

- [ ] **Step 2: Append reader CSS**

```css
/* ===== reader ===== */
.reader { padding-top: 0.5rem; }
.reader-progress { position: fixed; inset: 0 0 auto 0; height: 3px; z-index: 10;
  background: color-mix(in srgb, var(--ember) 12%, transparent); }
#emberBar { display: block; height: 100%; width: 0;
  background: linear-gradient(90deg, var(--ember), var(--ember-bright));
  box-shadow: 0 0 8px var(--ember); }
.reader-top { display: flex; justify-content: space-between; align-items: center;
  font-family: var(--font-label); font-size: 0.78rem; margin: 0.8rem 0 1.4rem; }
.sizer button { background: none; border: 1px solid color-mix(in srgb, var(--dusty) 35%, transparent);
  color: var(--dusty); border-radius: 6px; cursor: pointer; margin-left: 0.3rem;
  font-family: var(--font-body); line-height: 1; padding: 0.25rem 0.45rem; }
.sizer button:nth-child(1) { font-size: 0.7rem; }
.sizer button:nth-child(2) { font-size: 0.85rem; }
.sizer button:nth-child(3) { font-size: 1rem; }
.reader-doodle .doodle { width: 84px; height: 84px; }
.reader-title { font-family: var(--font-display); font-weight: 600; font-size: 1.7rem;
  line-height: 1.25; margin: 0.6rem 0 0.3rem; }
.reader-meta { font-family: var(--font-label); font-size: 0.7rem; color: var(--dusty);
  letter-spacing: 0.05em; margin-bottom: 1.6rem; }
.essay { max-width: 65ch; }
.essay p { margin-bottom: 1.15em; }
.essay blockquote { border-left: 2px solid var(--ember); padding-left: 1rem;
  color: var(--parchment-dim); font-style: italic; margin: 1.2em 0; }
.reader[data-size="0"] .essay { font-size: 1rem; }
.reader[data-size="1"] .essay { font-size: 1.08rem; }
.reader[data-size="2"] .essay { font-size: 1.18rem; }
.reader-foot { margin-top: 2.5rem; border-top: 1px solid color-mix(in srgb, var(--ember) 15%, transparent);
  padding-top: 1.4rem; }
.keep { font-family: var(--font-label); font-size: 0.8rem; letter-spacing: 0.04em;
  color: var(--ember); background: none; cursor: pointer;
  border: 1px solid color-mix(in srgb, var(--ember) 50%, transparent);
  border-radius: 999px; padding: 0.5rem 1.1rem; transition: background 0.3s, color 0.3s; }
.keep.kept { background: var(--ember); color: var(--ink-deep); }
.canonical { margin: 1rem 0 1.8rem; font-size: 0.8rem; }
.another h3 { font-family: var(--font-label); font-size: 0.7rem; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--dusty); margin-bottom: 0.6rem; }
.another .card { border-color: color-mix(in srgb, var(--ember) 35%, transparent);
  box-shadow: 0 0 18px color-mix(in srgb, var(--ember) 12%, transparent); }
```

- [ ] **Step 3: Verify in browser** — open a card: reader shows doodle drawing in, title, "2 July 2026 · a short sit", essay in Literata with our typography (no Blogger fonts/colors leaking — inspect a paragraph). Scroll: ember bar fills, no percentage anywhere. Change text size: essay font changes and persists across reload. Tap "keep by the fire" → becomes "kept by the fire", survives reload. Scroll halfway, go back (←), reload: feed shows "still burning: <title>"; tapping resumes near halfway. Finish an essay (scroll to end): "another current" shows exactly one glowing card of a mood-adjacent essay; resume card no longer appears for it. Back button returns to feed. Screenshot reader top + reader foot.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: full-screen reader with ember progress, resume, keep-by-the-fire, another current"
```

---

### Task 8: Kept shelf, About, header flame (flicker + growth)

**Files:**
- Modify: `js/app.js`, `css/hearth.css`, `index.html` (nothing structural — routes already exist)

**Interfaces:**
- Consumes: everything prior.
- Produces: `renderKept()`, `renderAbout()`, real `renderHeaderFlame()` (replaces Task 7 stub); router's `kept`/`about` branches call them.

- [ ] **Step 1: Implement in `js/app.js`**

```js
function renderKept() {
  document.getElementById("rail").hidden = true;
  document.getElementById("chips").hidden = true;
  const kept = App.posts.filter(p => keptSlugs().includes(p.slug));
  view.innerHTML = `<h1 class="page-title">kept by the fire</h1>` + (kept.length
    ? `<div class="feed">${kept.map(cardHtml).join("")}</div>`
    : `<p class="empty">nothing kept yet — essays you keep will wait for you here, warm.</p>`);
  watchFeed();
}

function renderAbout() {
  document.getElementById("rail").hidden = true;
  document.getElementById("chips").hidden = true;
  view.innerHTML = `<div class="about">
    <div class="about-doodle">${doodleSvg("scribbler-quill")}</div>
    <h1 class="page-title">Scribbler</h1>
    <p>I write from the deep hours — the 3 a.m. questions, the strangers on trains,
    the rain we secretly crave. Deep Currents is where I set those thoughts down:
    small essays on solitude, purpose, and the quiet mechanics of being a person.</p>
    <p>If one of them keeps you company for a night, it has done its work.</p>
    <p class="canonical"><a href="https://deepcurrentswrites.blogspot.com/" rel="noopener" target="_blank">Deep Currents began on Blogger — the archive lives there too.</a></p>
  </div>`;
  igniteDoodles(view);
}

function renderHeaderFlame() {
  const el = document.getElementById("headerFlame");
  const grow = 1 + Math.min(keptSlugs().length, 12) * 0.02;
  el.innerHTML = doodleSvg("hearth-flame", "flame");
  el.style.transform = `scale(${grow})`;
  igniteDoodles(el.parentElement);
}
```

Router update: `if (h === "kept") return renderKept(); if (h === "about") return renderAbout();` and `boot()` calls `renderHeaderFlame()` instead of setting `headerFlame.innerHTML` directly. Delete the Task 7 stub.

- [ ] **Step 2: Flicker CSS** (append):

```css
.page-title { font-family: var(--font-display); font-weight: 600; font-size: 1.5rem; margin: 1rem 0; }
.about { max-width: 60ch; padding-top: 1rem; }
.about p { margin-bottom: 1em; color: var(--parchment-dim); }
.about-doodle .doodle { width: 84px; height: 84px; }
#headerFlame { transform-origin: bottom center; transition: transform 0.6s; }
#headerFlame .doodle { width: 100%; height: 100%; animation: flicker 2.8s ease-in-out infinite; }
@keyframes flicker {
  0%, 100% { transform: scaleY(1) rotate(0deg); opacity: 1; }
  30%      { transform: scaleY(1.05) rotate(-1.2deg); opacity: 0.92; }
  55%      { transform: scaleY(0.97) rotate(0.8deg); opacity: 1; }
  80%      { transform: scaleY(1.03) rotate(-0.5deg); opacity: 0.95; }
}
```

(The global reduced-motion rule from Task 1 already kills the flicker animation.)

- [ ] **Step 3: Verify** — header flame flickers gently; keep 3 essays → flame visibly slightly larger after toggling (scale transition); `#/kept` lists exactly the kept essays and unkeeping in the reader removes them; empty kept state shows its copy; `#/about` shows quill doodle + bio; with DevTools "emulate prefers-reduced-motion" everything is static and doodles render fully drawn. Screenshot kept + about.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: kept shelf, about page, flickering header flame that grows with kept essays"
```

---

### Task 9: Live Blogger refresh (JSONP)

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `L.guessMoods`, `L.stripTags`, `L.excerptOf`, `L.readLengthLabel`, Python-equivalent id extraction in JS (inline regex, same `.post-(\d+)$` rule).
- Produces: `liveRefresh()` called at the end of `boot()`; fresh posts get `fresh: true`, `doodle: "young-flame"`, guessed moods; feed re-renders only if the user is on the feed route and hasn't scrolled past 200px (never yank the page).

- [ ] **Step 1: Implement `liveRefresh` in `js/app.js`** and call it as the last line of `boot()`:

```js
function liveRefresh() {
  window.__hearthFeed = (data) => {
    try {
      const known = new Set(App.posts.map(p => p.id));
      const entries = (data.feed && data.feed.entry) || [];
      const fresh = [];
      for (const e of entries) {
        const m = /\.post-(\d+)$/.exec(e.id.$t);
        const id = m ? m[1] : e.id.$t;
        if (known.has(id)) continue;
        const title = e.title.$t.trim();
        const raw = (e.content && e.content.$t) || "";
        const text = L.stripTags(raw);
        fresh.push({
          id, fresh: true,
          slug: title.toLowerCase().normalize("NFKD").replace(/['‘’]/g, "")
                 .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48),
          title,
          published: e.published.$t,
          url: (e.link.find(l => l.rel === "alternate") || {}).href || "",
          words: text.split(/\s+/).length,
          readLength: L.readLengthLabel(text.split(/\s+/).length),
          excerpt: L.excerptOf(text),
          moods: L.guessMoods(title, text),
          doodle: "young-flame",
          html: text.split(/\n\n+/).map(t => `<p>${L.escapeHtml(t)}</p>`).join("") ||
                `<p>${L.escapeHtml(text)}</p>`,
        });
      }
      if (!fresh.length) return;
      App.posts = [...fresh, ...App.posts]
        .sort((a, b) => b.published.localeCompare(a.published));
      const onFeed = !location.hash.replace(/^#\/?/, "");
      if (onFeed && scrollY < 200) { renderRail(); render(); }
    } catch (err) { /* silent by design */ }
  };
  const s = document.createElement("script");
  s.src = "https://deepcurrentswrites.blogspot.com/feeds/posts/default"
        + "?alt=json-in-script&max-results=12&callback=__hearthFeed";
  s.async = true;
  s.onerror = () => s.remove();
  document.head.appendChild(s);
}
```

Note the deliberate simplification: live-fresh posts render their content as escaped plain-text paragraphs (split on blank lines), NOT trusted HTML — the Python sanitizer isn't available in the browser and injecting unsanitized feed HTML would be an XSS hole. Once the author re-runs `refresh_posts.py`, the post gets properly sanitized rich HTML.

- [ ] **Step 2: Verify — three states**

1. Normal: reload site with network open — no errors, no duplicate cards (all 34 already known).
2. Fresh post simulation: in DevTools console, call `window.__hearthFeed({feed:{entry:[{id:{$t:"tag:blogger.com,1999:blog-1.post-999999"},title:{$t:"A Test Ember"},published:{$t:"2026-07-06T00:00:00Z"},content:{$t:"Some new words about rain and loneliness."},link:[{rel:"alternate",href:"https://example.com"}]}]}})` → card "A Test Ember" appears at top with young-flame doodle, "fresh from the fire" meta, a rain-ish mood chip; opening it renders escaped paragraphs.
3. Failure: DevTools → block request domain `deepcurrentswrites.blogspot.com`, reload → site fully works, zero error UI, only a net-log failure.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: silent live refresh of fresh Blogger posts via JSONP"
```

---

### Task 10: Polish pass, accessibility, performance, README, deploy

**Files:**
- Modify: `css/hearth.css` (responsive + polish), `index.html` (only if checks demand)
- Create: `README.md`

- [ ] **Step 1: Responsive + polish sweep** — verify at 390px, 768px, 1200px: no horizontal scroll anywhere (feed, reader, gallery); tablet gets slightly larger type (`@media (min-width: 700px) { .card-title { font-size: 1.35rem; } .reader-title { font-size: 2rem; } }` — add if not present); tap targets ≥ 40px for chips/rail/sizer (pad if needed); check contrast of `--parchment-dim` on `--card` (must be ≥ 4.5:1 — if not, lighten the token, not individual rules).

- [ ] **Step 2: Reduced-motion + keyboard audit** — emulate reduced motion: flame static, doodles pre-drawn, no smooth scroll. Tab through the feed: cards, chips, rail, nav all reachable and visibly focused; reader reachable end-to-end.

- [ ] **Step 3: Lighthouse mobile run** — Chrome DevTools Lighthouse, mobile, Performance + Accessibility + Best Practices. Expected: Performance ≥ 90 (posts.json ~200KB is the big item; if it drags, add `<link rel="preload" href="data/posts.json" as="fetch" crossorigin>` to index.html), Accessibility ≥ 95. Fix what it flags; re-run until met. Record scores in the commit message.

- [ ] **Step 4: Write `README.md`**

```markdown
# Deep Currents — hearth feed

A warm, candlelit, mobile-first home for the essays of
[Deep Currents](https://deepcurrentswrites.blogspot.com/), by Scribbler.

Fully static: no build step, no dependencies. Open `index.html` via any
static server.

## Updating content

New Blogger posts appear automatically (live feed refresh) with a default
flame doodle. To bake them in with full styling:

    python scripts/refresh_posts.py

Then give the new post its own doodle in `js/doodles.js` and its moods in
`data/curation.json` (re-run the refresh script after editing curation),
and push.

## Tests

    python -m unittest discover tests -v   # content pipeline
    node --test tests/                     # JS logic + doodle registry

## Dev pages

`doodle-gallery.html` — renders every doodle for visual regression.
```

- [ ] **Step 5: Deploy to GitHub Pages**

```bash
gh repo create deep-currents --public --source . --push
gh api repos/{owner}/deep-currents/pages -X POST -f "source[branch]=main" -f "source[path]=/"
```
Then verify the live URL (`https://<user>.github.io/deep-currents/`) renders correctly — fonts load, posts.json loads (paths are relative, so subpath hosting works), live refresh fires. NOTE: creating the repo publishes the content publicly — confirm with the user before this step if not already authorized.

- [ ] **Step 6: Final full verification** — run BOTH test suites (`python -m unittest discover tests -v`, `node --test tests/`), then walk the deployed site on a real phone if available (or 390px emulation): feed → filter → read → keep → resume → kept shelf → about. Screenshot the deployed feed and reader for the user.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore: polish pass, README, GitHub Pages deploy"
```

---

## Self-review notes (already applied)

- Spec coverage: hybrid pipeline (T2/T9), GitHub Pages (T10), 34 doodles (T3/T5), per-year ember rail (T6), mood chips + empty state (T6), reader with ember bar/read-length/text-size/canonical link (T7), another current (T7), keep by the fire + flame growth (T7/T8), resume card (T6/T7), about (T8), reduced motion (T1 global + T5/T8), sanitization incl. live-post XSS guard (T2/T9), localStorage degradation (T6 Store), README/update workflow (T10). No spec item unimplemented.
- Deliberate execution-time design points (not placeholders): the 34 doodle path d-strings are drawn against the gallery in Task 5 — their concepts, structure, registry contract, and tests are fully specified here; inventing path coordinates blind in a document would produce unverifiable art.
- Type consistency: `Store.get/set`, `keptSlugs/isKept/toggleKept`, `cardHtml`, `renderFeed/renderReader/renderKept/renderAbout/renderHeaderFlame`, `igniteDoodles`, `doodleSvg`, `HearthLib` signatures are used identically across tasks; `renderHeaderFlame` stub introduced in T7 and replaced in T8 is called out in both.
