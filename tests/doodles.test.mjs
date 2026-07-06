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
