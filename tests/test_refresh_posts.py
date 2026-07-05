import sys, os, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
from refresh_posts import (sanitize_html, slugify, post_num_id, excerpt_of,
                           read_length, strip_tags, build)

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

    def test_div_wrapping_block_children_does_not_nest_p(self):
        raw = '<div><p>one</p><p>two</p></div>'
        self.assertEqual(sanitize_html(raw), '<p>one</p><p>two</p>')

    def test_strip_tags_returns_plain_unescaped_text(self):
        self.assertEqual(strip_tags(sanitize_html('<p>It\'s a "test"</p>')),
                         'It\'s a "test"')

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

    def test_read_length_boundaries(self):
        self.assertEqual(read_length(449), "a short sit")
        self.assertEqual(read_length(450), "an evening ember")
        self.assertEqual(read_length(1100), "an evening ember")
        self.assertEqual(read_length(1101), "a long night")

def _entry(pid, title, published, content="<p>words here</p>", href="https://x/1"):
    return {
        "id": {"$t": f"tag:blogger.com,1999:blog-1.post-{pid}"},
        "title": {"$t": title},
        "published": {"$t": published},
        "content": {"$t": content},
        "link": [{"rel": "alternate", "href": href}],
    }

class TestBuild(unittest.TestCase):
    def test_posts_sorted_newest_first(self):
        feed = {"feed": {"entry": [
            _entry("111", "Older Post", "2026-01-01T00:00:00Z"),
            _entry("222", "Newer Post", "2026-03-01T00:00:00Z"),
        ]}}
        data = build(feed, curation={})
        self.assertEqual([p["id"] for p in data["posts"]], ["222", "111"])

    def test_slug_collision_gets_suffix(self):
        feed = {"feed": {"entry": [
            _entry("111", "Same Title", "2026-03-01T00:00:00Z"),
            _entry("222", "Same Title", "2026-01-01T00:00:00Z"),
        ]}}
        data = build(feed, curation={})
        slugs = [p["slug"] for p in data["posts"]]
        self.assertEqual(slugs, ["same-title", "same-title-2"])

    def test_uncurated_posts_get_defaults(self):
        feed = {"feed": {"entry": [
            _entry("111", "A Post", "2026-01-01T00:00:00Z"),
        ]}}
        data = build(feed, curation={})
        p = data["posts"][0]
        self.assertEqual(p["moods"], [])
        self.assertEqual(p["doodle"], "young-flame")

    def test_curation_dict_applies_moods_and_doodle(self):
        feed = {"feed": {"entry": [
            _entry("111", "A Post", "2026-01-01T00:00:00Z"),
        ]}}
        curation = {"111": {"moods": ["cosmic"], "doodle": "domino-ripples"}}
        data = build(feed, curation=curation)
        p = data["posts"][0]
        self.assertEqual(p["moods"], ["cosmic"])
        self.assertEqual(p["doodle"], "domino-ripples")

if __name__ == "__main__":
    unittest.main()
