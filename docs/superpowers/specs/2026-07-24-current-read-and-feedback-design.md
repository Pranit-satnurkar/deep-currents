# Current Read + Reader Feedback — Design

**Status:** approved, ready for planning
**Builds on:** `docs/superpowers/specs/2026-07-05-hearth-feed-site-design.md` (the hearth feed site). This spec adds two features to the already-deployed site: a more prominent "currently reading" bookmark, and a private reader-feedback form. It amends that spec's "Out of scope (YAGNI)" line, which listed "Comments" — the feedback feature below is privately-delivered, not public comments, so the original YAGNI reasoning (avoid moderation, avoid a public surface) still holds; only the delivery mechanism is new.

## Context

The live site already has two related, single-slot mechanisms:
- **Resume** (`hearth.resume = {slug, ratio}`): ambient, auto-updated on every scroll tick in the reader. Powers a small "still burning: `<title>`" card that appears at the top of the feed, but only between 2% and 97% scroll — it's easy to miss among 34 feed cards and disappears once you scroll past it.
- **Keep by the fire** (`hearth.kept = [slug, ...]`): a permanent bookmark shelf at `#/kept`, unrelated to reading position.

The user wants the current-read signal to be harder to miss, plus a way for readers to leave the author private feedback (a reaction and/or a short note) — a capability the original spec explicitly deferred ("Comments" was listed as out of scope).

## Feature 1: Currently Reading + Bookmark

### Data model

Two independent `Store` slots (both go through the existing `Store` wrapper; both silently degrade to in-memory in private browsing, same as every other key):

- `hearth.resume = {slug, ratio}` — **unchanged.** Ambient, auto-updated by the existing scroll handler in `renderReader`. No behavior change to this key.
- `hearth.bookmark = {slug, ratio}` — **new.** Only written when the reader explicitly taps "mark my place." Not touched by ambient scrolling in *any* essay, including the bookmarked one — reading further in the bookmarked essay does not silently move or clear the bookmark; only finishing it (see clearing, below) or an explicit dismiss does.

These are deliberately separate slots, not a shared one, because they answer different questions: "where did I last scroll" (resume, ambient) vs. "where did I deliberately say I'd come back to" (bookmark, intentional). A reader can bookmark an essay, then read a completely different essay without bookmarking it — `hearth.resume` tracks the second essay's scroll position, but the pinned strip still shows the bookmarked essay (see priority rule below), and the second essay's ambient progress is not lost either — it's simply not surfaced by the pinned strip while a bookmark exists.

### Pinned strip (feed page)

- Position: sticky, directly under the site header (same sticky mechanism already used by `.ember-rail`), so it stays visible while the feed scrolls underneath — not just a card at the top that scrolls away.
- Content priority: show `hearth.bookmark` if set; otherwise fall back to `hearth.resume` (today's existing card content/logic, unchanged) if that's set; otherwise render nothing.
- Copy: reuses the existing exact string `still burning: <title>` (em-wrapped title, same as today's resume card) — no new copy string invented for this state, keeping the site's small set of established phrases intact.
- Dismiss: a small `×` control clears whichever slot is currently powering the strip (`hearth.bookmark` if that's what's showing, else `hearth.resume`) without touching the other slot.
- Auto-clear on finish: extend the existing reader scroll handler so that when the ratio for the essay *currently open in the reader* crosses 0.97, it clears `hearth.bookmark` too if `hearth.bookmark.slug` matches the open essay's slug (mirrors the existing `hearth.resume` auto-clear at the same threshold, which is unchanged).
- Route visibility: shown only on the feed route, matching where the existing resume card lives today. Not shown on `#/kept`, `#/about`, or inside the reader itself.

### Reader control

- A new button, "mark my place," in the reader footer near "keep by the fire." Plain text, no emoji or icon glyph — the site's existing controls ("keep by the fire," the `A A A` text-size buttons, "← back to the fire") are all plain text or SVG doodles, never emoji, so this stays consistent with that pattern.
- Tapping it reads the current scroll ratio (same computation the ambient handler already does) and writes `{slug: <this post>, ratio: <current>}` to `hearth.bookmark`, overwriting any previous bookmark (single-slot — bookmarking a new place replaces the old one; there is no bookmark list, per the "make resume more prominent" direction chosen over "track multiple in-progress reads").
- No confirmation dialog; the action is idempotent and low-stakes, consistent with the site's quiet interaction style elsewhere (e.g., "keep by the fire" also has no confirmation).

### Reduced motion / accessibility

The pinned strip's sticky positioning uses no animation; its appearance/disappearance is instant (matching how the existing resume card already has no fade transition). No new work needed for the reduced-motion global rule since no new transitions are introduced.

## Feature 2: Reader Feedback

### Placement

A small form in the reader footer, below "another current" (the last element in the footer):

```
how did this sit with you?
○ this found me       ○ sat with me a while
○ needed this tonight ○ still thinking about it

[ a few words, if you like...        ]

         [ send it to the fire ]
```

### Interaction

- Reaction: single-select radio-style group, exactly these four phrases (verbatim, matching the site's established copy style):
  - "this found me"
  - "sat with me a while"
  - "needed this tonight"
  - "still thinking about it"
- Note: a single-line or short `<textarea>`, optional, no character-count UI (keep it minimal).
- Submit ("send it to the fire") sends whichever fields are filled. If neither a reaction nor any note text is present, the button is disabled (not merely a no-op) — a reader should never be able to tap it and wonder if anything happened.
- On successful submit: the form's contents are replaced in place with the exact acknowledgment string `reached the fire — thank you.` The form does not reappear for that essay in that session (no re-submitting the same essay's form repeatedly without reloading — no localStorage tracking of "already submitted" needed; a page reload simply re-shows the form, which is acceptable).
- On failed submit (network/Formspree error): the form stays populated with what the reader typed (nothing is lost) and shows the exact inline retry string `couldn't reach the fire — try again?` above the (re-enabled) submit button. This is a deliberate, narrow exception to the site's "always silent" global constraint — that constraint exists for *passive* background operations (the Blogger live-refresh) the reader never asked for and has no way to react to; this is a *reader-initiated* action they're actively waiting on, so silent failure would just look broken.

### Delivery mechanism

- **Formspree**, free tier. Endpoint: `https://formspree.io/f/xpqvygdd` (already created and provided by the site owner — no further account setup needed).
- Submission is a single `fetch()` POST fired only at the moment "send it to the fire" is tapped — no widget, no script loaded on page load, no per-page-view network cost. This is the one addition to the site's Global Constraint "no third-party requests at runtime except the Blogger JSONP feed" — amended to also permit this one explicit, user-triggered POST.
- Payload: reaction phrase (or empty), note text (or empty), essay title and slug (so the author knows which essay the feedback is about — Formspree's free tier delivers submitted fields via email, and without the essay identified the feedback would be meaningless to the recipient).
- No client-side or server-side aggregation, storage, or display of past submissions anywhere on the site. Feedback is genuinely private and ephemeral from the site's own perspective — it exists only in the author's inbox after submission.

## New exact copy strings (use verbatim, joins the original spec's list)

- Reader control: `mark my place`
- Reaction phrases (exactly these four, no more): `this found me`, `sat with me a while`, `needed this tonight`, `still thinking about it`
- Note field placeholder: `a few words, if you like...`
- Submit button: `send it to the fire`
- Feedback prompt heading: `how did this sit with you?`
- Success acknowledgment: `reached the fire — thank you.`
- Retry-after-failure message: `couldn't reach the fire — try again?`

## Explicitly out of scope (YAGNI)

- Multiple simultaneous bookmarks (one bookmark slot, replaced on each new "mark my place").
- Editing or retracting a submitted feedback entry.
- Any on-site display of past feedback, reaction counts, or aggregation — this is not a public comments feature (the original spec's "Comments" YAGNI item still stands for anything public-facing).
- A "your bookmark was overwritten" warning when marking a new place over an old one.
- Rate-limiting or spam protection beyond whatever Formspree's free tier provides by default.

## Error handling summary

- localStorage unavailable (private browsing): both new `Store` keys degrade to in-memory for the session, silently — same as every existing key, no change needed to `Store` itself.
- Formspree POST fails: inline retry message shown, reader's input preserved (see above) — the one deliberate non-silent failure path in the site.
- Bookmark references a slug no longer present in `posts.json` (e.g., very old bookmark from before a content refresh removed/renamed something — unlikely but possible): pinned strip should tolerate a missing post lookup the same way the existing resume card already does (`App.posts.find(...)` returns undefined → render nothing), no new guard needed beyond following that existing pattern.

## Testing / verification

Same behavioral-verification approach as the rest of the site (no unit-test harness for DOM/app.js code; Playwright-driven browser verification at 390px, per prior tasks):

- Mark a place in an essay → confirm `hearth.bookmark` is set correctly and the pinned strip appears on the feed, sticky, surviving a reload.
- Confirm priority: with both a bookmark (essay A) and ambient resume progress in a different essay (essay B), the strip shows essay A.
- Scroll the bookmarked essay past 97% → confirm the strip disappears and `hearth.bookmark` is cleared.
- Tap the strip's `×` → confirm it clears the correct slot without touching the other.
- Submit feedback with: reaction only, note only, both, neither (confirm neither is a no-op). Confirm the Formspree POST fires with the expected payload shape (mock/intercept the request in tests — do not spam the real endpoint during automated verification).
- Simulate a blocked/failing POST → confirm the retry message appears and the reader's typed note is not lost.
- `prefers-reduced-motion` sanity check: confirm no new animation was introduced (there shouldn't be any).
