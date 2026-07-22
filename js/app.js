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

function renderHeaderFlame() {} // Task 8 replaces this with a lit/flicker header flame

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
  view.innerHTML = resumeCardHtml() + (posts.length
    ? `<div class="feed">${posts.map(cardHtml).join("")}</div>`
    : `<p class="empty">no embers here tonight.</p>`);
  watchFeed();
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
    renderHeaderFlame(); // Task 8 gives this a real body; stub above keeps this call safe
  };

  // ember progress + resume tracking
  const bar = document.getElementById("emberBar");
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      const ratio = max > 0 ? Math.min(1, scrollY / max) : 1;
      bar.style.width = (ratio * 100) + "%";
      Store.set("hearth.resume", ratio > 0.97 ? null : { slug: post.slug, ratio });
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
  if (h === "kept" || h === "about") return renderFeed();   // Task 8 replaces
  const post = App.posts.find(p => p.slug === h);
  return post ? renderReader(post) : renderFeed();
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
