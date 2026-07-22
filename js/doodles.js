(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    const api = factory();
    root.HearthDoodles = api;
    root.DOODLES = api.DOODLES;
    root.doodleSvg = api.doodleSvg;
    root.igniteDoodles = api.igniteDoodles;
  }
})(typeof self !== "undefined" ? self : this, function () {
  const VB = "0 0 120 120";
  const v = (paths) => ({ vb: VB, paths });

  const DOODLES = {
    // three dominoes mid-topple, the last dissolving into concentric ripples
    "domino-ripples": v([
      "M26 90 L30 52 L40 54 L36 92 Z",
      "M44 90 L54 58 L64 63 L52 94 Z",
      "M58 92 L80 66 L90 72 L68 98 Z",
      "M92 52 C104 60 104 78 92 86",
      "M96 44 C114 56 114 82 96 94",
    ]),
    // rounded train window, two facing silhouettes, small moon outside
    "train-window": v([
      "M30 34 Q30 26 40 26 L80 26 Q90 26 90 34 L90 82 Q90 90 80 90 L40 90 Q30 90 30 82 Z",
      "M42 88 C42 72 44 66 50 62 a5 5 0 1 0 0.1 0",
      "M78 88 C78 72 76 66 70 62 a5 5 0 1 0 0.1 0",
      "M104 18 C97 21 97 33 104 36 C99 30 99 24 104 18",
    ]),
    // winding path traced by a cane's tapping arcs
    "cane-path": v([
      "M28 100 C50 92 40 70 60 62 C80 54 70 34 88 26",
      "M32 96 q6 -5 11 -1",
      "M52 78 q6 -5 11 -1",
      "M70 58 q6 -5 11 -1",
      "M100 40 C100 31 91 31 91 40 L92 98",
    ]),
    // empty park bench, earphone cord curling up into the air, a bird above
    "park-bench": v([
      "M26 76 L86 76",
      "M30 76 L34 58 L78 58 L82 76",
      "M34 76 L32 92 M76 76 L78 92",
      "M84 76 C97 70 92 55 84 51 C78 48 80 41 87 39",
      "M38 30 Q45 23 52 30 Q59 23 66 30",
    ]),
    // cupped hands catching slanted rain strokes
    "rain-cupped-hands": v([
      "M34 62 C29 59 25 63 28 70 C31 82 43 88 54 85",
      "M86 62 C91 59 95 63 92 70 C89 82 77 88 66 85",
      "M48 24 L40 46",
      "M60 20 L52 44",
      "M72 24 L64 46",
      "M60 32 L54 48",
    ]),
    // small heart behind a neat brick wall with one brick missing (heart peeks through the gap)
    "walled-heart": v([
      "M60 46 C57 39 48 39 48 47 C48 55 60 63 60 63 C60 63 72 55 72 47 C72 39 63 39 60 46",
      "M26 40 L50 40 M72 40 L94 40 M26 58 L94 58 M26 76 L94 76 M26 94 L94 94",
      "M38 40 L38 58 M84 40 L84 58",
      "M32 58 L32 76 M54 58 L54 76 M76 58 L76 76",
      "M44 76 L44 94 M66 76 L66 94",
    ]),
    // tiny boat on long swells, deliberately no horizon line
    "boat-adrift": v([
      "M14 78 C34 70 46 86 64 78 C82 70 96 84 112 76",
      "M14 94 C36 86 48 100 66 92 C84 84 98 98 110 90",
      "M48 64 L72 64 L67 73 L53 73 Z",
      "M60 64 L60 44",
      "M60 46 L73 62",
    ]),
    // two dune crests, wind strokes lifting grains off the top
    "shifting-dunes": v([
      "M16 90 C34 66 52 66 66 84",
      "M52 94 C74 70 92 72 106 90",
      "M60 68 C72 60 80 60 92 55",
      "M50 76 C64 65 74 63 88 66",
      "M94 52 a1.6 1.6 0 1 0 0.1 0",
      "M100 60 a1.6 1.6 0 1 0 0.1 0",
    ]),
    // two hands reaching toward each other, dotted line across the small gap
    "almost-touch": v([
      "M12 90 C22 84 31 80 37 78 C39 72 44 71 43 76 C47 73 50 70 53 68 C51 72 50 74 48 76 C51 74 54 72 56 71 C54 75 52 77 49 79 C45 83 41 86 38 88",
      "M10 100 C21 94 30 90 38 88",
      "M108 30 C98 36 89 40 83 42 C81 48 76 49 77 44 C73 47 70 50 67 52 C69 48 70 46 72 44 C69 46 66 48 64 49 C66 45 68 43 71 41 C75 37 79 34 82 32",
      "M110 20 C99 26 90 30 82 32",
      "M57 64 a1.2 1.2 0 1 0 0.1 0 M60.5 60.5 a1.2 1.2 0 1 0 0.1 0 M64 57 a1.2 1.2 0 1 0 0.1 0",
    ]),
    // suitcase alone on a platform edge, motion lines of a departed train
    "platform-goodbye": v([
      "M30 66 L58 66 L58 92 L30 92 Z",
      "M38 66 C38 58 50 58 50 66",
      "M18 100 L64 100 L64 106 L104 106",
      "M70 50 L104 50",
      "M72 61 L104 61",
      "M76 72 L104 72",
    ]),
    // a blade whose two edges ripple like water
    "double-blade": v([
      "M56 34 C52 44 60 54 54 64 C48 74 58 84 54 92",
      "M64 34 C68 44 60 54 66 64 C72 74 62 84 66 92",
      "M56 34 C57 25 60 18 60 18 C60 18 63 25 64 34",
      "M45 92 L75 92",
      "M60 92 L60 104",
    ]),
    // pair of worn hands cradling a small house
    "cradled-home": v([
      "M50 56 L50 72 L74 72 L74 56",
      "M45 57 L62 42 L79 57",
      "M58 72 L58 63 L66 63 L66 72",
      "M32 76 C36 90 52 94 62 92 C74 94 88 88 90 76",
      "M32 76 C28 70 30 66 35 68",
      "M90 76 C94 70 90 66 85 68",
    ]),
    // compass rose with needle mid-spin (motion arcs)
    "spun-compass": v([
      "M60 24 C82 24 96 40 96 60 C96 80 80 96 60 96 C40 96 24 80 24 60 C24 40 40 24 60 24",
      "M52 68 L61 38 L69 68 L60 61 Z",
      "M60 60 a2 2 0 1 0 0.1 0",
      "M98 44 C104 51 104 60 99 67",
      "M22 76 C16 69 16 60 21 53",
    ]),
    // mountain peak, tiny flag, hollow circle sun above
    "empty-summit": v([
      "M18 96 L44 54 L58 72 L72 46 L102 96",
      "M72 46 L72 30",
      "M72 30 L85 34 L72 39",
      "M34 32 C42 32 47 38 47 44 C47 51 41 55 34 55 C27 55 21 50 21 43 C21 37 27 32 34 32",
    ]),
    // small figure speaking, sound arcs curving back at them
    "echo-rings": v([
      "M32 46 a7 7 0 1 0 0.1 0",
      "M32 60 L32 82 M32 66 L22 76 M32 66 L42 76 M32 82 L24 96 M32 82 L40 96",
      "M42 46 C58 40 70 48 68 60 C66 71 56 73 49 68",
      "M45 38 C68 30 86 44 81 66",
    ]),
    // classical pillar with hairline cracks, still holding its roof line
    "cracked-pillar": v([
      "M28 30 L92 30 M32 38 L88 38",
      "M40 38 L40 44 L80 44 L80 38",
      "M44 44 L46 92 M76 44 L74 92",
      "M38 92 L82 92 M40 98 L80 98",
      "M56 46 L60 56 L53 66 L58 80",
    ]),
    // double-triangle rewind symbol with bottom edges dripping
    "melting-rewind": v([
      "M60 40 L40 56 L60 72 Z",
      "M84 40 L64 56 L84 72 Z",
      "M45 68 C44 76 48 79 47 87",
      "M67 68 C66 78 70 81 69 89",
      "M80 68 C79 76 83 78 82 85",
    ]),
    // flat horizon, shimmer squiggles, faint upside-down oasis (palm) reflection below
    "heat-mirage": v([
      "M14 63 C38 61 72 66 106 62",
      "M26 50 q6 -4 12 0 q6 4 12 0 q6 -4 12 0",
      "M44 38 q6 -4 12 0 q6 4 12 0",
      "M80 64 C79 72 81 80 79 86",
      "M79 86 C71 90 62 91 54 87 M79 86 C74 94 68 99 60 101 M79 86 C87 90 96 91 104 87 M79 86 C84 94 90 99 98 101",
    ]),
    // eye at center, mirrored shards radiating outward
    "kaleidoscope": v([
      "M48 60 C54 52 66 52 72 60 C66 68 54 68 48 60 Z",
      "M60 60 a4 4 0 1 0 0.1 0",
      "M60 60 L60 20 M60 60 L94 40 M60 60 L94 80 M60 60 L60 100 M60 60 L26 80 M60 60 L26 40",
      "M60 20 L94 40 L94 80 L60 100 L26 80 L26 40 Z",
    ]),
    // marionette control bar, strings down to a small figure, one string cut
    "puppet-strings": v([
      "M32 24 L88 24 M60 24 L60 32",
      "M40 26 L46 56 M60 26 L60 54",
      "M80 26 L84 42 M74 52 L77 62",
      "M60 62 a6 6 0 1 0 0.1 0",
      "M60 74 L60 90 M60 80 L48 86 M60 80 L72 86 M60 90 L52 102 M60 90 L68 102",
    ]),
    // theatre mask beside a plain face, paintbrush between them
    "two-masks-brush": v([
      "M38 34 C50 34 54 46 52 60 C50 74 44 84 38 84 C32 84 26 74 24 60 C22 46 26 34 38 34 Z",
      "M30 52 q4 -4 9 0 M32 68 C36 74 45 74 49 67",
      "M84 40 C94 40 99 50 99 60 C99 71 92 82 82 82 C72 82 67 70 67 60 C67 49 74 40 84 40 Z",
      "M77 56 a1.4 1.4 0 1 0 0.1 0 M88 56 a1.4 1.4 0 1 0 0.1 0 M76 70 L90 70",
      "M60 28 L60 78 M56 78 L60 90 L64 78 Z",
    ]),
    // two standing figures, selection brackets around one, swap arrows
    "avatar-select": v([
      "M40 34 a6 6 0 1 0 0.1 0 M40 46 L40 72 M40 54 L30 62 M40 54 L50 62 M40 72 L32 90 M40 72 L48 90",
      "M84 34 a6 6 0 1 0 0.1 0 M84 46 L84 72 M84 54 L74 62 M84 54 L94 62 M84 72 L76 90 M84 72 L92 90",
      "M22 30 L22 24 L28 24 M52 24 L58 24 L58 30 M22 96 L22 90 M22 96 L28 96 M58 96 L52 96 M58 96 L58 90",
      "M56 52 L66 52 L63 49 M66 52 L63 55 M78 68 L68 68 L71 65 M68 68 L71 71",
    ]),
    // headstone whose top curls into a question mark
    "grave-question": v([
      "M42 98 L42 64 M78 98 L78 64",
      "M30 98 L90 98",
      "M42 64 C42 40 78 40 78 56 C78 66 60 66 60 76",
      "M60 86 a2.4 2.4 0 1 0 0.1 0",
    ]),
    // cabinet with cracked panes, one door open spilling a single line
    "shattered-cabinet": v([
      "M30 28 L30 98 L90 98 L90 28 Z",
      "M60 28 L60 98 M30 62 L90 62",
      "M40 36 L46 48 L40 58 M74 74 L80 84 L74 92",
      "M90 28 L104 34 L104 92 L90 98",
      "M92 64 C98 70 104 72 111 70",
    ]),
    // one line branching three ways, one branch bolder ending in a dot (verbatim from brief)
    "branching-paths": v([
      "M18 98 C40 84 48 70 52 56",
      "M52 56 C50 40 44 30 34 22",
      "M52 56 C58 42 58 30 54 16",
      "M52 56 C68 46 84 40 100 40",
      "M100 40 a3.5 3.5 0 1 0 0.1 0",
    ]),
    // mobius band with a tiny figure walking its surface (infinity ribbon, twist at the crossing)
    "mobius-strip": v([
      "M60 60 C48 46 26 46 26 60 C26 74 48 74 60 60 C72 46 94 46 94 60 C94 74 72 74 60 60",
      "M60 60 C50 50 32 50 32 60 C32 70 50 70 60 60 C70 50 88 50 88 60 C88 70 70 70 60 60",
      "M55 55 L65 65 M65 55 L55 65",
      "M79 42 a3 3 0 1 0 0.1 0",
      "M79 48 L79 56 M79 51 L75 55 M79 51 L83 55 M79 56 L76 62 M79 56 L82 62",
    ]),
    // head in profile, a flower and a weed sprouting from it, tiny shears
    "mind-garden": v([
      "M44 96 C34 88 32 70 40 56 C46 46 58 42 68 46 M68 46 L74 56 L67 58 M67 58 C68 68 60 74 52 74 L52 96",
      "M52 46 L54 30 M54 30 C49 25 58 24 55 31 C61 28 61 35 55 31 C58 37 49 37 55 31",
      "M62 44 L67 28 M67 33 C71 31 73 33 73 35 M65 35 C61 33 59 35 59 37",
      "M78 28 L86 36 M78 36 L86 28 M75 26 a2.2 2.2 0 1 0 0.1 0 M75 38 a2.2 2.2 0 1 0 0.1 0",
    ]),
    // hourglass with a small sun sifting down as sand
    "hourglass-sun": v([
      "M40 30 L80 30 L60 60 Z",
      "M60 60 L80 90 L40 90 Z",
      "M36 28 L84 28 M36 92 L84 92",
      "M56 42 a5 5 0 1 0 0.1 0 M56 33 L56 30 M64 39 L67 36 M48 39 L45 36 M64 47 L67 50 M48 47 L45 50",
      "M60 62 L60 68 M59 72 L59 76 M61 80 L61 84",
    ]),
    // almost-perfect hand-drawn circle with a tiny gap where it fails to close (verbatim)
    "wobbled-circle": v([
      "M63 22 C88 24 102 44 99 66 C96 88 76 101 55 98 C34 95 20 76 23 55 C26 36 40 24 57 22",
    ]),
    // small island with one tree, a rowboat approaching it
    "inner-island": v([
      "M40 74 C46 66 74 66 82 74 C88 78 82 81 60 81 C42 81 34 78 40 74 Z",
      "M60 68 L60 54 M60 54 C50 54 48 44 58 44 C56 38 66 38 64 44 C72 44 70 54 60 54",
      "M18 86 q6 -3 12 0 q6 3 12 0 M76 86 q6 -3 12 0 q6 3 12 0",
      "M18 90 L34 90 L31 96 L21 96 Z M26 90 L18 82",
    ]),
    // heart crossed by visible stitches, needle mid-stitch
    "stitched-heart": v([
      "M60 42 C54 30 36 30 36 46 C36 62 60 80 60 80 C60 80 84 62 84 46 C84 30 66 30 60 42",
      "M54 45 L60 49 M51 53 L57 57 M48 61 L54 65 M45 69 L51 73",
      "M52 64 L74 80",
      "M74 80 C79 82 79 87 74 89",
    ]),
    // crescent moon with music notes drifting off, fading to dots
    "moon-notes": v([
      "M46 28 C30 34 30 66 46 72 C36 60 36 40 46 28 Z",
      "M64 42 L64 58 M55 58 a5 4 0 1 0 0.1 0",
      "M84 52 L84 66 M77 66 a4 3 0 1 0 0.1 0",
      "M98 60 a2 2 0 1 0 0.1 0 M106 68 a1.3 1.3 0 1 0 0.1 0",
    ]),
    // magnifying glass held over a tiny crack in an otherwise smooth line
    "lens-crack": v([
      "M14 88 L52 88 L56 80 L60 92 L64 86 L106 86",
      "M58 42 C70 42 76 50 76 60 C76 70 68 76 58 76 C48 76 42 68 42 58 C42 48 48 42 58 42 Z",
      "M72 74 L88 90",
    ]),
    // round maze, dot at center, entrance path partly traced
    "labyrinth": v([
      "M58 100 C38 99 20 84 20 60 C20 34 40 20 60 20 C80 20 100 34 100 60 C100 82 84 98 66 100",
      "M60 34 C78 34 86 46 86 60 C86 76 74 86 60 86 C46 86 34 74 34 60 C34 47 44 34 58 34",
      "M60 48 C70 48 72 56 72 62 C72 70 64 74 58 72 C50 70 48 60 53 52",
      "M60 60 a2.5 2.5 0 1 0 0.1 0",
      "M62 108 L62 100",
    ]),
    // single small candle flame, one wavering inner stroke (verbatim from brief)
    "young-flame": v([
      "M60 96 C38 84 34 62 46 44 C52 36 56 28 55 18 C70 30 84 48 82 68 C81 82 72 92 60 96 Z",
      "M60 84 C52 78 50 68 56 60 C59 56 60 52 59 47 C67 54 72 63 70 72 C69 78 65 82 60 84",
    ]),
    // taller doodled flame with two inner licks (header; Task 8 animates flicker)
    "hearth-flame": v([
      "M60 102 C34 86 30 56 46 34 C54 24 58 16 56 8 C77 24 90 46 86 70 C84 87 74 97 60 102 Z",
      "M60 88 C48 78 46 60 54 48 C58 42 59 35 57 30 C69 40 75 55 72 67 C71 77 66 83 60 88",
      "M60 74 C54 68 53 57 58 50 C63 60 65 67 60 74",
    ]),
    // quill pen whose feather tip curls into a small flame
    "scribbler-quill": v([
      "M40 98 L46 88",
      "M44 92 C54 74 63 56 72 42",
      "M52 78 C44 72 48 60 62 50 C70 44 75 39 74 42 C76 50 71 63 59 70 C56 72 54 75 52 78 Z",
      "M74 42 C68 36 70 27 76 23 C74 31 80 33 82 29 C84 35 81 44 73 45",
    ]),
  };

  function doodleSvg(id, cls = "") {
    const d = DOODLES[id] || DOODLES["young-flame"];
    const paths = d.paths.map(p =>
      `<path d="${p}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
    ).join("");
    return `<svg class="doodle ${cls}" viewBox="${d.vb}" aria-hidden="true">${paths}</svg>`;
  }

  function igniteDoodles(rootEl) {
    const reduced = typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    rootEl.querySelectorAll("svg.doodle:not(.lit)").forEach(svg => {
      if (!reduced) {
        svg.querySelectorAll("path").forEach((p, i) => {
          const len = p.getTotalLength();
          p.style.strokeDasharray = len;
          p.style.strokeDashoffset = len;
          p.style.transitionDelay = `${i * 120}ms`;
        });
        svg.getBoundingClientRect(); // reflow so the transition runs
      }
      svg.classList.add("lit");
    });
  }

  return { DOODLES, doodleSvg, igniteDoodles };
});
