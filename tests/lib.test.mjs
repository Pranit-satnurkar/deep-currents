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
  assert.equal(lib.excerptOf("a".repeat(30), 15), "a".repeat(15) + "…");
});

test("decodeEntities handles named, numeric, and hex entities in one pass", () => {
  assert.equal(lib.decodeEntities("cliché that &quot;the universe&quot;"), 'cliché that "the universe"');
  assert.equal(lib.decodeEntities("Rock &amp; Roll"), "Rock & Roll");
  assert.equal(lib.decodeEntities("&#39;quoted&#39; &#x27;again&#x27;"), "'quoted' 'again'");
  // must not cascade: a literal "&amp;quot;" decodes to "&quot;" text, not a real quote
  assert.equal(lib.decodeEntities("&amp;quot;"), "&quot;");
  assert.equal(lib.decodeEntities("no entities here"), "no entities here");
});

test("escapeHtml", () => {
  assert.equal(lib.escapeHtml(`<a b="c">&'`), "&lt;a b=&quot;c&quot;&gt;&amp;&#39;");
});

test("guessMoods finds rain, falls back to quiet", () => {
  assert.deepEqual(lib.guessMoods("Why We Crave the Rain", "sadness and melancholy tonight"), ["rain"]);
  assert.deepEqual(lib.guessMoods("Untitled", "nothing matching here at all zzz"), ["quiet"]);
});

test("resolveCurrentRead: bookmark wins over resume for its own post", () => {
  const bookmark = { slug: "a", ratio: 0.5 };
  const resume = { slug: "b", ratio: 0.3 };
  assert.deepEqual(lib.resolveCurrentRead(bookmark, resume, { slug: "a" }),
    { slug: "a", ratio: 0.5, source: "bookmark" });
});

test("resolveCurrentRead: falls back to resume when bookmark is for a different post", () => {
  const bookmark = { slug: "a", ratio: 0.5 };
  const resume = { slug: "b", ratio: 0.3 };
  assert.deepEqual(lib.resolveCurrentRead(bookmark, resume, { slug: "b" }),
    { slug: "b", ratio: 0.3, source: "resume" });
});

test("resolveCurrentRead: null when neither matches the requested slug", () => {
  const bookmark = { slug: "a", ratio: 0.5 };
  const resume = { slug: "b", ratio: 0.3 };
  assert.equal(lib.resolveCurrentRead(bookmark, resume, { slug: "c" }), null);
});

test("resolveCurrentRead: no slug filter picks bookmark first, else bounded resume", () => {
  assert.equal(lib.resolveCurrentRead(null, { slug: "b", ratio: 0.01 }), null); // below 0.02 min
  assert.equal(lib.resolveCurrentRead(null, { slug: "b", ratio: 0.98 }, { resumeMax: 0.97 }), null); // above resumeMax
  assert.deepEqual(lib.resolveCurrentRead(null, { slug: "b", ratio: 0.5 }, { resumeMax: 0.97 }),
    { slug: "b", ratio: 0.5, source: "resume" });
  assert.deepEqual(lib.resolveCurrentRead({ slug: "a", ratio: 0.99 }, { slug: "b", ratio: 0.5 }),
    { slug: "a", ratio: 0.99, source: "bookmark" });
});

test("anotherCurrent prefers shared moods then date proximity", () => {
  const posts = [
    { slug: "a", moods: ["rain", "quiet"], published: "2026-01-01T00:00:00Z" },
    { slug: "b", moods: ["rain"],          published: "2026-02-01T00:00:00Z" },
    { slug: "c", moods: ["rain", "quiet"], published: "2020-01-01T00:00:00Z" },
    { slug: "d", moods: ["cosmic"],        published: "2026-01-02T00:00:00Z" },
  ];
  assert.equal(lib.anotherCurrent("a", posts).slug, "c"); // 2 shared moods beats b's 1
  assert.equal(lib.anotherCurrent("d", posts).slug, "a"); // no shared moods → nearest date wins
  assert.equal(lib.anotherCurrent("x", [posts[0]]), null);
});
