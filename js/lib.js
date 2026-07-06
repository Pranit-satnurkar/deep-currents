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
    if (posts.length < 2) return null;
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
