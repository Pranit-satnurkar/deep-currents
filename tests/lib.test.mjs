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
  assert.equal(lib.anotherCurrent("d", posts).slug, "a"); // no shared moods → nearest date wins
  assert.equal(lib.anotherCurrent("x", [posts[0]]), null);
});
