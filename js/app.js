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

const REACTIONS = ["this found me", "sat with me a while", "needed this tonight", "still thinking about it"];
const FEEDBACK_ENDPOINT = "https://formspree.io/f/xpqvygdd";

function renderHeaderFlame() {
  const el = document.getElementById("headerFlame");
  const grow = 1 + Math.min(keptSlugs().length, 12) * 0.02;
  el.innerHTML = doodleSvg("hearth-flame", "flame");
  el.style.transform = `scale(${grow})`;
  igniteDoodles(el.parentElement);
}

function keptSlugs() { return Store.get("hearth.kept", []); }
function isKept(slug) { return keptSlugs().includes(slug); }
function toggleKept(slug) {
  const k = keptSlugs();
  Store.set("hearth.kept", k.includes(slug) ? k.filter(s => s !== slug) : [...k, slug]);
}

/* ---------- current read (bookmark) ---------- */
function getBookmark() { return Store.get("hearth.bookmark", null); }
function setBookmark(slug, ratio) { Store.set("hearth.bookmark", { slug, ratio }); }
function clearBookmark() { Store.set("hearth.bookmark", null); }

function currentScrollRatio() {
  const max = document.documentElement.scrollHeight - innerHeight;
  return max > 0 ? Math.min(1, scrollY / max) : 1;
}

/* explicit bookmark wins; ambient resume is the fallback (today's behavior) */
function currentReadInfo() {
  const b = getBookmark();
  if (b) {
    const p = App.posts.find(x => x.slug === b.slug);
    if (p) return { post: p, source: "bookmark" };
  }
  const r = Store.get("hearth.resume", null);
  if (r && r.ratio >= 0.02 && r.ratio <= 0.97) {
    const p = App.posts.find(x => x.slug === r.slug);
    if (p) return { post: p, source: "resume" };
  }
  return null;
}

/* ---------- feed ---------- */
function cardHtml(p, extraClass = "", excerptOverride = null) {
  const chips = p.moods.map(m =>
    `<span class="chip chip-static">${L.escapeHtml(App.moods[m] || m)}</span>`).join("");
  const excerpt = excerptOverride || p.excerpt;
  return `<article class="card${p.fresh ? " fresh" : ""}${extraClass}" data-year="${L.yearOf(p.published)}">
    <a class="card-link" href="#/${p.slug}">
      <div class="card-doodle">${doodleSvg(p.doodle)}</div>
      <h2 class="card-title">${L.escapeHtml(p.title)}</h2>
      <p class="card-meta">${L.formatDate(p.published)} · ${p.readLength}${p.fresh ? " · fresh from the fire" : ""}</p>
      <p class="card-excerpt">${L.escapeHtml(excerpt)}</p>
      <span class="card-moods">${chips}</span>
    </a>
  </article>`;
}

/* the newest essay in view gets a distinct, larger treatment */
function featuredHtml(p) {
  const chips = p.moods.map(m =>
    `<span class="chip chip-static">${L.escapeHtml(App.moods[m] || m)}</span>`).join("");
  const excerpt = L.excerptOf(L.stripTags(p.html), 380);
  return `<article class="card featured" data-year="${L.yearOf(p.published)}">
    <a class="card-link" href="#/${p.slug}">
      <span class="featured-eyebrow">latest current</span>
      <div class="card-doodle">${doodleSvg(p.doodle)}</div>
      <h2 class="card-title">${L.escapeHtml(p.title)}</h2>
      <p class="card-meta">${L.formatDate(p.published)} · ${p.readLength}${p.fresh ? " · fresh from the fire" : ""}</p>
      <p class="card-excerpt">${L.escapeHtml(excerpt)}</p>
      <span class="card-moods">${chips}</span>
    </a>
  </article>`;
}

/* word-count tertiles across the whole archive, not just the tier label — most Deep
   Currents essays are short, so the "short sit"/"long night" labels alone barely vary;
   relative position within the actual archive does. */
function wordTertiles() {
  const words = App.posts.map(p => p.words).sort((a, b) => a - b);
  const n = words.length;
  return { low: words[Math.floor(n / 3)], high: words[Math.floor((2 * n) / 3)] };
}

/* size follows substance: shortest third reads compact, longest third gets more room */
function feedCardHtml(p, tertiles) {
  if (p.words <= tertiles.low) return cardHtml(p, " compact");
  if (p.words >= tertiles.high) return cardHtml(p, " rich", L.excerptOf(L.stripTags(p.html), 320));
  return cardHtml(p);
}

/* featured essay, then the rest threaded through real year sections */
function feedListHtml(posts) {
  if (!posts.length) return `<p class="empty">no embers here tonight.</p>`;
  const tertiles = wordTertiles();
  const [first, ...rest] = posts;
  const groups = [];
  for (const p of rest) {
    const y = L.yearOf(p.published);
    const g = groups[groups.length - 1];
    if (!g || g.year !== y) groups.push({ year: y, posts: [p] });
    else g.posts.push(p);
  }
  const groupsHtml = groups.map(g => `
    <section class="year-group">
      <h3 class="year-label">${g.year}</h3>
      ${g.posts.map(p => feedCardHtml(p, tertiles)).join("")}
    </section>`).join("");
  return `<div class="feed">
    ${featuredHtml(first)}
    <div class="current-line" aria-hidden="true"></div>
    ${groupsHtml}
  </div>`;
}

const HERO_FRAMING = "Small essays on solitude, purpose, and the quiet mechanics of being a person — written from the deep hours.";

function heroHtml(visited) {
  if (visited) return `<p class="hero-compact">${L.escapeHtml(HERO_FRAMING)}</p>`;
  return `<div class="hero-full">
    <div class="hero-doodle">${doodleSvg("hearth-flame", "flame")}</div>
    <h1 class="hero-title">Deep Currents</h1>
    <p class="hero-tagline">quiet essays for the deep hours</p>
    <p class="hero-framing">${L.escapeHtml(HERO_FRAMING)}</p>
    <button class="hero-cta" id="heroCta">step into the fire &darr;</button>
  </div>`;
}

function currentReadHtml() {
  const info = currentReadInfo();
  if (!info) return "";
  return `<div class="current-read">
    <a class="resume-card" href="#/${info.post.slug}">
      <span class="resume-flame">${doodleSvg("young-flame")}</span>
      <span>still burning: <em>${L.escapeHtml(info.post.title)}</em></span>
    </a>
    <button class="dismiss-current" id="dismissCurrent" aria-label="dismiss currently reading">&times;</button>
  </div>`;
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
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (card) card.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
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
  const visited = Store.get("hearth.visited", false);
  view.innerHTML = currentReadHtml() + heroHtml(visited) + feedListHtml(posts);
  if (!visited) Store.set("hearth.visited", true);
  const dismiss = document.getElementById("dismissCurrent");
  if (dismiss) dismiss.onclick = (ev) => {
    ev.preventDefault();
    const info = currentReadInfo();
    if (info && info.source === "bookmark") clearBookmark();
    else Store.set("hearth.resume", null);
    renderFeed();
  };
  const heroDoodle = view.querySelector(".hero-doodle");
  if (heroDoodle) igniteDoodles(heroDoodle);
  const cta = document.getElementById("heroCta");
  if (cta) cta.onclick = () => {
    const target = view.querySelector(".feed") || view.querySelector(".empty");
    if (!target) return;
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };
  watchFeed();
}

/* ---------- kept shelf ---------- */
function renderKept() {
  document.getElementById("rail").hidden = true;
  document.getElementById("chips").hidden = true;
  const kept = App.posts.filter(p => keptSlugs().includes(p.slug));
  view.innerHTML = `<h1 class="page-title">kept by the fire</h1>` + (kept.length
    ? `<div class="feed">${kept.map(cardHtml).join("")}</div>`
    : `<p class="empty">nothing kept yet — essays you keep will wait for you here, warm.</p>`);
  watchFeed();
}

/* ---------- about ---------- */
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

/* ---------- reader ---------- */
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
      <div class="reader-actions">
        <button class="keep${isKept(post.slug) ? " kept" : ""}" id="keepBtn">
          ${isKept(post.slug) ? "kept by the fire" : "keep by the fire"}</button>
        <button class="mark-place" id="markPlaceBtn">mark my place</button>
      </div>
      <p class="canonical"><a href="${L.escapeHtml(post.url)}" rel="canonical noopener" target="_blank">this essay also lives at Deep Currents on Blogger</a></p>
      ${next ? `<div class="another"><h3>another current</h3>${cardHtml(next)}</div>` : ""}
      <div class="feedback" id="feedback">
        <p class="feedback-prompt">how did this sit with you?</p>
        <div class="feedback-reactions" role="radiogroup" aria-label="reaction">
          ${REACTIONS.map(r => `<button type="button" class="reaction" data-r="${L.escapeHtml(r)}">${L.escapeHtml(r)}</button>`).join("")}
        </div>
        <textarea class="feedback-note" id="feedbackNote" placeholder="a few words, if you like..." rows="2"></textarea>
        <p class="feedback-status" id="feedbackStatus" aria-live="polite"></p>
        <button type="button" class="feedback-submit" id="feedbackSubmit" disabled>send it to the fire</button>
      </div>
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
    renderHeaderFlame();
  };

  const markBtn = document.getElementById("markPlaceBtn");
  markBtn.onclick = () => {
    setBookmark(post.slug, currentScrollRatio());
    markBtn.textContent = "place marked";
    markBtn.classList.add("marked");
    setTimeout(() => {
      markBtn.textContent = "mark my place";
      markBtn.classList.remove("marked");
    }, 1400);
  };

  // ---------- feedback form ----------
  const feedbackEl = document.getElementById("feedback");
  const noteEl = document.getElementById("feedbackNote");
  const statusEl = document.getElementById("feedbackStatus");
  const submitEl = document.getElementById("feedbackSubmit");
  let selectedReaction = null;

  const refreshSubmitState = () => {
    submitEl.disabled = !selectedReaction && !noteEl.value.trim();
  };
  feedbackEl.querySelectorAll(".reaction").forEach(btn => btn.onclick = () => {
    const already = btn.classList.contains("on");
    feedbackEl.querySelectorAll(".reaction").forEach(b => b.classList.remove("on"));
    selectedReaction = already ? null : btn.dataset.r;
    if (!already) btn.classList.add("on");
    refreshSubmitState();
  });
  noteEl.addEventListener("input", refreshSubmitState);

  submitEl.onclick = async () => {
    submitEl.disabled = true;
    statusEl.textContent = "";
    try {
      const res = await fetch(FEEDBACK_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          reaction: selectedReaction || "",
          note: noteEl.value.trim(),
          title: post.title,
          slug: post.slug,
        }),
      });
      if (!res.ok) throw new Error("bad response");
      feedbackEl.innerHTML = `<p class="feedback-status">reached the fire — thank you.</p>`;
    } catch (err) {
      statusEl.textContent = "couldn't reach the fire — try again?";
      refreshSubmitState();
    }
  };

  // ember progress + resume tracking
  const bar = document.getElementById("emberBar");
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const ratio = currentScrollRatio();
      bar.style.width = (ratio * 100) + "%";
      Store.set("hearth.resume", ratio > 0.97 ? null : { slug: post.slug, ratio });
      // Only clear the bookmark once the reader has genuinely read past where they
      // marked — not merely because the scroll settled at/near the same position
      // (e.g. the auto-scroll that brings "mark my place" into view on tap).
      const bm = getBookmark();
      if (bm && bm.slug === post.slug && ratio > 0.97 && ratio > bm.ratio + 0.005) clearBookmark();
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  const stop = () => {
    window.removeEventListener("scroll", onScroll);
    document.removeEventListener("click", onNavClick, true);
    window.removeEventListener("hashchange", stop);
  };
  // With `html { scroll-behavior: smooth }` active, clicking any in-app link (back link,
  // "another current" card, nav) makes the browser smooth-scroll this still-mounted reader
  // to the top of the fragment *before* location.hash updates and hashchange fires — which
  // would otherwise feed a stream of spurious scroll events into onScroll and overwrite the
  // real resume ratio with 0. Detach eagerly, in the click capture phase, ahead of that.
  const onNavClick = (ev) => { if (ev.target.closest("a[href^='#']")) stop(); };
  document.addEventListener("click", onNavClick, true);
  window.addEventListener("hashchange", stop);
  const r = Store.get("hearth.resume", null);
  if (r && r.slug === post.slug && r.ratio > 0.02) {
    requestAnimationFrame(() =>
      window.scrollTo(0, r.ratio * (document.documentElement.scrollHeight - innerHeight)));
  }
}

/* ---------- router ---------- */
function render() {
  const h = location.hash.replace(/^#\/?/, "");
  if (feedObserver) feedObserver.disconnect();
  if (!h) return renderFeed();
  if (h === "kept") return renderKept();
  if (h === "about") return renderAbout();
  const post = App.posts.find(p => p.slug === h);
  return post ? renderReader(post) : renderFeed();
}

/* ---------- live refresh ---------- */
function liveRefresh() {
  window.__hearthFeed = (data) => {
    try {
      const known = new Set(App.posts.map(p => p.id));
      const entries = (data.feed && data.feed.entry) || [];
      const fresh = [];
      for (const e of entries) {
        try {
          const m = /\.post-(\d+)$/.exec(e.id.$t);
          const id = m ? m[1] : e.id.$t;
          if (known.has(id)) continue;
          const title = e.title.$t.trim();
          const raw = (e.content && e.content.$t) || "";
          const text = L.stripTags(raw);
          const href = (e.link.find(l => l.rel === "alternate") || {}).href || "";
          let url = "";
          try {
            const parsed = new URL(href, location.href);
            if (parsed.protocol === "http:" || parsed.protocol === "https:") url = href;
          } catch (err) { /* leave url as "" */ }
          fresh.push({
            id, fresh: true,
            slug: title.toLowerCase().normalize("NFKD").replace(/['‘’]/g, "")
                   .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48),
            title,
            published: e.published.$t,
            url,
            words: text.split(/\s+/).length,
            readLength: L.readLengthLabel(text.split(/\s+/).length),
            excerpt: L.excerptOf(text),
            moods: L.guessMoods(title, text),
            doodle: "young-flame",
            html: text.split(/\n\n+/).map(t => `<p>${L.escapeHtml(t)}</p>`).join("") ||
                  `<p>${L.escapeHtml(text)}</p>`,
          });
        } catch (err) { continue; }
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

/* ---------- boot ---------- */
async function boot() {
  const data = await (await fetch("data/posts.json")).json();
  App.posts = data.posts;
  App.moods = data.moods;
  renderHeaderFlame();
  renderChips(); renderRail(); render();
  window.addEventListener("hashchange", render);
  liveRefresh();
}
boot();
