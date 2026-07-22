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
    ("The Möbius Strip of Life",        ["cosmic", "quiet"],  "mobius-strip"),
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
