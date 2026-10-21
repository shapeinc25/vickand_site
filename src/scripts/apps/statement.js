import { vkFly } from "./fly-dots.js";

// Statement screen: slides over Coming Soon (which stays pinned) and types its sentences like code.
// Coloured words start white; dots in the word's colour fly to them like to a magnet, leaving traces, and light the letters up.
(function () {
  var box = document.querySelector("[data-statement]");
  if (!box) return;
  var host = box.querySelector(".statement-type");
  var soon = document.getElementById("coming-soon"),
    section = document.getElementById("statement");
  var fx = section.querySelector(".statement-fx");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var COL = { "c-purple": "#bca3e9", "c-yellow": "#efe96f", "c-green": "#69dc7c", "c-orange": "#ff8a47" };
  var SENTENCES = [
    [
      ["Building", "c-purple"],
      [" software is ", ""],
      ["easier than ever", "c-yellow"],
      [".", ""],
    ],
    [
      ["Creating an experience ", "c-green"],
      ["people understand and enjoy ", ""],
      ["is another matter", "c-orange"],
      [".", ""],
    ],
  ];
  // Coming Soon stays pinned until the statement screen has covered it
  function pin() {
    if (soon) soon.style.top = Math.min(0, window.innerHeight - soon.offsetHeight) + "px";
  } // Coming Soon stays pinned until the story section has covered it
  pin();
  window.addEventListener("resize", pin);

  var caret = document.createElement("span");
  caret.className = "statement-caret";
  var chars = [],
    segs = [];
  function build(s) {
    // every character is in place from the start (hidden), so typing never moves the layout
    host.textContent = "";
    chars = [];
    segs = [];
    var line = document.createElement("span");
    line.className = "statement-line";
    host.appendChild(line);
    s.forEach(function (seg) {
      var colour = document.createElement("span"),
        mine = [];
      if (seg[1]) {
        colour.className = seg[1] + " is-pending";
        colour.style.setProperty("--seg-col", COL[seg[1]]);
        segs.push({ el: colour, col: COL[seg[1]], chars: mine });
      }
      line.appendChild(colour);
      function add(parent, t) {
        var c = document.createElement("span");
        c.className = "statement-ch";
        c.textContent = t;
        parent.appendChild(c);
        chars.push(c);
        mine.push(c);
        return c;
      }
      seg[0].split(/( )/).forEach(function (tok) {
        if (!tok) return;
        if (tok === " ") {
          add(colour, " ");
          return;
        }
        var w = document.createElement("span");
        w.className = "statement-word";
        colour.appendChild(w);
        tok.split("").forEach(function (ch) {
          add(w, ch);
        });
      });
    });
  }
  function lightAll() {
    segs.forEach(function (s) {
      s.chars.forEach(function (c) {
        c.classList.add("is-lit");
      });
    });
  }
  function setCaret(n, idle) {
    // caret sits right after the last typed character
    if (caret.parentNode) caret.parentNode.removeChild(caret);
    var after = n > 0 ? chars[n - 1] : chars[0];
    if (!after) return;
    after.parentNode.insertBefore(caret, n > 0 ? after.nextSibling : after);
    caret.classList.toggle("is-idle", !!idle);
  }
  function show(n) {
    for (var i = 0; i < chars.length; i++) chars[i].classList.toggle("is-on", i < n);
  }
  // keep the height of the tallest sentence so the text never jumps between sentences
  function fit() {
    var h = 0;
    box.style.minHeight = "";
    SENTENCES.forEach(function (s) {
      build(s);
      show(chars.length);
      h = Math.max(h, host.offsetHeight);
    });
    box.style.minHeight = h + "px";
    build(SENTENCES[cur]);
    show(reduce ? chars.length : 0);
    if (reduce) lightAll();
  }
  var cur = 0,
    timers = [],
    running = false,
    visible = false;
  function later(ms, fn) {
    var t = setTimeout(fn, ms);
    timers.push(t);
    return t;
  }
  function clearFx() {
    timers.forEach(clearTimeout);
    timers = [];
    while (fx.firstChild) fx.removeChild(fx.firstChild);
  }

  function launch(seg) {
    return vkFly(seg, fx, section, later);
  }
  var gen = 0,
    TYPE_MS = [250, 300]; // typing time per sentence: the first 250ms, the three-line one 300ms

  function typeIn() {
    var g = gen,
      t0 = performance.now(),
      len = chars.length;
    // the dots start flying as soon as typing starts, word after word
    segs.forEach(function (seg, i) {
      later(i * 300, function () {
        if (g === gen) launch(seg);
      });
    });
    (function step(now) {
      if (!running || g !== gen) return;
      var p = Math.min(1, (performance.now() - t0) / TYPE_MS[cur]),
        n = Math.ceil(p * len);
      show(n);
      setCaret(n, p >= 1);
      if (p < 1) return requestAnimationFrame(step);
      later((300 * Math.max(0, segs.length - 1) + 1800 + 2200) / 2, function () {
        eraseOut(chars.length);
      }); // wait between two sentences (halved)
    })();
  }
  function eraseOut(n) {
    if (!running) return;
    if (n <= 0) {
      cur = (cur + 1) % SENTENCES.length;
      build(SENTENCES[cur]);
      setCaret(0, true);
      return later(225, function () {
        typeIn();
      });
    }
    show(n);
    setCaret(n, false);
    later(14, function () {
      eraseOut(n - 2);
    });
  }
  function start() {
    if (running) return;
    running = true;
    var typed = chars.length && chars[chars.length - 1].classList.contains("is-on");
    if (typed) {
      setCaret(chars.length, true);
      lightAll();
      later(1800, function () {
        eraseOut(chars.length);
      });
    } else {
      setCaret(0, true);
      later(400, function () {
        typeIn();
      });
    }
  }
  function stop() {
    running = false;
    gen++;
    clearFx();
  }
  fit();
  window.addEventListener("resize", function () {
    var was = running;
    stop();
    fit();
    if (was && visible && !reduce) {
      running = false;
      start();
    }
  });
  if (reduce) return;
  if ("IntersectionObserver" in window)
    new IntersectionObserver(
      function (es) {
        visible = es[0].isIntersecting;
        visible ? start() : stop();
      },
      { threshold: 0.45 },
    ).observe(section);
  else start();
})();
