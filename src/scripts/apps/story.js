import { vkFly } from "./fly-dots.js";
import { reducedMotion } from "../common/motion.js";

// Story section (one section, driven by scrolling): the stage is pinned; the sentence is typed on the dark screen, then a white dot grows
// from the centre as an overlay (a soft-edged mask, clip-path where masks are unsupported) and turns the screen light. The CTA text sits
// inside the overlay, so the same circle reveals it. When the dot has grown a little the CTA sequence plays by itself (time, not scroll):
// the first sentence is large and its words are lit, the second grows past it ("smart animate") and its words are lit, the button pulses.
(function () {
  var story = document.getElementById("story"),
    sec = document.getElementById("cta");
  if (!story || !sec) return;
  var fx = sec.querySelector(".cta-fx");
  var text = sec.querySelector(".cta-text");
  var reduce = reducedMotion;
  var COL = { blue: "#298ac6", green: "#219535" };

  // ----- "smart animate": every word is one element that moves, scales and changes colour from its place in state A to its place in state B -----
  var L1 = ["You've built an app or a", "game using AI-assistant."],
    L2 = ["We help improve the UX", "of your product."]; // the same line breaks in both sizes
  // the same line breaks in both sizes: the small copy is the large one scaled down, so its box is narrower by the same factor
  var SENT = [
    { A: L1, B: L1, hi: 2, col: "blue", bigIn: "A" },
    { A: L2, B: L2, hi: 3, col: "green", bigIn: "B" },
  ];
  var words = [],
    segs = [];
  text.textContent = "";
  SENT.forEach(function (S, si) {
    var toks = S.A.join(" ").split(" "),
      mine = [],
      chars = [];
    toks.forEach(function (tk, i) {
      var w = document.createElement("span");
      w.className = "cta-w cta-w" + (si + 1);
      tk.split("").forEach(function (ch) {
        var c = document.createElement("span");
        c.className = "cta-ch";
        c.textContent = ch;
        if (i < S.hi) {
          c.style.setProperty("--seg-col", COL[S.col]);
          chars.push(c);
        }
        w.appendChild(c);
      });
      text.appendChild(w);
      mine.push(w);
    });
    S.words = mine;
    words.push(mine);
    segs.push({ col: COL[S.col], chars: chars });
  });
  var sr = document.createElement("span");
  sr.className = "sr-only";
  sr.textContent = "You've built an app or a game using AI-assistant. We help improve the UX of your product.";
  text.appendChild(sr);

  var metrics = null;
  var TIERS = [
    { big: 48, bigL: 56, sm: 36, smL: 44 },
    { big: 36, bigL: 44, sm: 28, smL: 36 },
    { big: 28, bigL: 36, sm: 22, smL: 28 },
  ];
  function measure() {
    // pick the largest size at which the Figma line breaks fit the available width; only below that, wrap greedily
    var avail = Math.max(200, sec.clientWidth - 48),
      M = null;
    var probe = document.createElement("span");
    probe.className = "cta-w";
    probe.style.cssText = "visibility:hidden;white-space:pre";
    text.appendChild(probe);
    for (var t = 0; t < TIERS.length; t++) {
      var T = TIERS[t];
      M = { big: T.big, bigL: T.bigL, sm: T.sm, smL: T.smL, W: Math.min(avail, 574), narrow: false };
      words.forEach(function (list) {
        list.forEach(function (w) {
          w.style.fontSize = M.big + "px";
          w.style.lineHeight = M.bigL + "px";
          w.style.whiteSpace = "nowrap";
          w.style.transition = "none";
          w.style.transform = "none";
        });
      });
      M.ww = words.map(function (list) {
        return list.map(function (w) {
          return w.getBoundingClientRect().width;
        });
      });
      probe.style.fontSize = M.big + "px";
      probe.textContent = "a a";
      var w1 = probe.getBoundingClientRect().width;
      probe.textContent = "aa";
      M.sp = w1 - probe.getBoundingClientRect().width;
      var fits = true;
      SENT.forEach(function (S, si) {
        ["A", "B"].forEach(function (st) {
          var big = S.bigIn === st,
            s = big ? 1 : M.sm / M.big,
            n = 0;
          S[st].forEach(function (ln) {
            var c = ln.split(" ").length,
              lw = 0;
            for (var i = n; i < n + c; i++) lw += M.ww[si][i] + (i > n ? M.sp : 0);
            if (lw * s > avail + 0.5) fits = false;
            n += c;
          });
        });
      });
      if (fits) break;
      if (t === TIERS.length - 1) M.narrow = true; // nothing fits: wrap greedily at the smallest size
    }
    text.removeChild(probe);
    return M;
  }
  function layoutLines(si, big, M, isB) {
    // which words sit on which line (Figma line breaks on desktop, greedy wrap on narrow screens)
    var S = SENT[si],
      s = big ? 1 : M.sm / M.big,
      ww = M.ww[si],
      lines = [];
    if (!M.narrow) {
      var n = 0;
      S[isB ? "B" : "A"].forEach(function (ln) {
        var c = ln.split(" ").length;
        lines.push([n, n + c]);
        n += c;
      });
      return lines;
    }
    var start = 0,
      cur = 0;
    for (var i = 0; i < ww.length; i++) {
      var add = (i > start ? M.sp : 0) + ww[i];
      if (i > start && (cur + add) * s > M.W) {
        lines.push([start, i]);
        start = i;
        cur = ww[i];
      } else cur += add;
    }
    lines.push([start, ww.length]);
    return lines;
  }
  function place(isB, animate) {
    var M = metrics || (metrics = measure()),
      top = 0;
    for (var si = 0; si < 2; si++) {
      var big = (SENT[si].bigIn === "B") === !!isB,
        s = big ? 1 : M.sm / M.big,
        lh = big ? M.bigL : M.smL,
        ww = M.ww[si],
        lines = layoutLines(si, big, M, isB);
      lines.forEach(function (ln, li) {
        var lw = 0,
          i;
        for (i = ln[0]; i < ln[1]; i++) lw += ww[i] + (i > ln[0] ? M.sp : 0);
        var x = (M.W - lw * s) / 2,
          y = top + li * lh + (lh - M.bigL * s) / 2; // the scaled glyph box is centred in its line, exactly like native text of that size
        for (i = ln[0]; i < ln[1]; i++) {
          var w = SENT[si].words[i];
          w.style.transition = animate ? "" : "none";
          w.style.transform = "translate(" + x.toFixed(2) + "px," + y.toFixed(2) + "px) scale(" + s.toFixed(4) + ")";
          x += (ww[i] + M.sp) * s;
        }
      });
      top += lines.length * lh + 24;
    }
    return top - 24;
  }
  function relayout() {
    metrics = null;
    var M = measure();
    metrics = M;
    var hA = place(false, false);
    place(sec.classList.contains("is-b"), false);
    text.style.height = Math.max(hA, place(true, false)) + "px";
    text.style.width = M.W + "px";
    place(sec.classList.contains("is-b"), false);
    text.classList.add("is-ready");
  }
  var mo = new MutationObserver(function () {
    if (metrics) place(sec.classList.contains("is-b"), true);
  });
  mo.observe(sec, { attributes: true, attributeFilter: ["class"] });
  relayout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  window.addEventListener("resize", relayout);

  function lit(seg, on) {
    seg.chars.forEach(function (c) {
      c.classList.toggle("is-lit", on);
    });
  }
  var timers = [],
    gen = 0,
    state = "idle";
  function later(ms, fn) {
    var t = setTimeout(fn, ms);
    timers.push(t);
    return t;
  }
  function clear() {
    timers.forEach(clearTimeout);
    timers = [];
    while (fx.firstChild) fx.removeChild(fx.firstChild);
  }

  var useMask = !!(
    window.CSS &&
    CSS.supports &&
    (CSS.supports("mask-image", "radial-gradient(#000, #000)") ||
      CSS.supports("-webkit-mask-image", "radial-gradient(#000, #000)"))
  );
  function setCircle(r) {
    // overlay revealed through a circle of radius r at the centre
    if (r <= 0) {
      sec.style.visibility = "hidden";
      return;
    }
    sec.style.visibility = "visible";
    if (useMask) {
      var g =
        "radial-gradient(circle at 50% 50%, #000 " + r.toFixed(1) + "px, transparent " + (r + 2.5).toFixed(1) + "px)";
      sec.style.webkitMaskImage = g;
      sec.style.maskImage = g;
    } else sec.style.clipPath = "circle(" + r.toFixed(1) + "px at 50% 50%)";
  }
  function open() {
    sec.style.visibility = "visible";
    sec.style.webkitMaskImage = sec.style.maskImage = "none";
    sec.style.clipPath = "none";
    sec.style.background = "";
  }

  function finish() {
    sec.classList.remove("is-armed");
    sec.classList.add("is-b", "is-btn", "is-pulse");
    lit(segs[0], false);
    lit(segs[1], true);
  }
  function arm() {
    clear();
    gen++;
    state = "armed";
    sec.classList.add("is-armed");
    sec.classList.remove("is-b", "is-btn", "is-pulse");
    lit(segs[0], false);
    lit(segs[1], false);
  }
  function play() {
    if (state === "playing" || state === "done") return;
    state = "playing";
    var g = gen;
    later(100, function () {
      vkFly(segs[0], fx, sec, later, 2.2);
    }); // first sentence is large: its words are lit (fast flight)
    later(300, function () {
      sec.classList.add("is-btn");
    });
    later(1500, function () {
      sec.classList.add("is-b");
      lit(segs[0], false);
    }); // the second grows past the first
    later(1550, function () {
      vkFly(segs[1], fx, sec, later, 2.2);
    });
    later(2700, function () {
      if (g === gen) {
        sec.classList.add("is-pulse");
        state = "done";
      }
    });
  }

  if (reduce || !sec.style) {
    open();
    finish();
    return;
  }
  arm();
  setCircle(0);

  var ticking = false,
    lastR = -1;
  function update() {
    ticking = false;
    var rect = story.getBoundingClientRect(),
      vh = window.innerHeight,
      scrollable = Math.max(1, rect.height - vh);
    var p = Math.max(0, Math.min(1, -rect.top / scrollable));
    var t = Math.max(0, Math.min(1, (p - 0.25) / 0.35)); // the dot grows between 25% and 60% of the scroll
    var maxR = Math.hypot(sec.offsetWidth, sec.offsetHeight) / 2 + 6;
    var e = t * t * (3 - 2 * t);
    var r = t <= 0 ? 0 : 7 + (maxR - 7) * e; // starts as a 14px dot
    sec.style.background =
      "rgb(" +
      [0, 1, 2]
        .map(function (i) {
          var a = [255, 255, 255][i],
            b = [229, 226, 223][i];
          return Math.round(a + (b - a) * Math.min(1, t / 0.4));
        })
        .join(",") +
      ")"; // white dot takes the screen colour
    if (t >= 1) {
      if (lastR !== -2) {
        open();
        sec.style.background = "rgb(229,226,223)";
        lastR = -2;
      }
    } else if (lastR !== r) {
      setCircle(r);
      lastR = r;
    }
    // the text and button animation runs by itself (time, not scroll): it starts as the dot begins to grow and is reset only when the dot is gone
    if (t >= 0.2) play();
    else if (t <= 0.02 && state !== "armed") arm();
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
