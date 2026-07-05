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
    out = out.replace("\xa0", " ")  # NBSP from &nbsp; entities
    out = re.sub(r"<p>(\s|<br>)*</p>", "", out)   # empty paragraphs
    out = re.sub(r"\s+", " ", out)
    out = re.sub(r"\s*(</?(?:p|blockquote|ul|ol|li|h2|h3|h4)>)\s*", r"\1", out)
    return out.strip()

def slugify(title, maxlen=48):
    t = unicodedata.normalize("NFKD", title)
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"[''']", "", t.lower())
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
