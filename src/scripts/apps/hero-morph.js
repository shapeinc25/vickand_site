// Hero morph: the logo and the headline take turns. The switch breaks the first shape into
// particles that fly to the second shape. Resting states use the real logo and headline.
(function () {
  "use strict";
  var morph = document.querySelector(".hero-morph");
  var canvas = morph && morph.querySelector(".morph-canvas");
  var headline = document.getElementById("hero-title");
  if (!morph || !canvas || !canvas.getContext || !headline) return;
  if (window.__reduced) return;

  var ctx = canvas.getContext("2d");
  var lines = headline.querySelectorAll("span");

  // The logo SVG cannot be read as pixels (it uses foreignObject), so the particles are sampled from PNG copies
  var rasters = { light: new Image(), dark: new Image() };
  rasters.light.src = __asset("img/raster-874fd651.webp");
  rasters.dark.src = __asset("img/raster-41abc27b.webp");

  // Timeline: hold the logo, move to the title, hold the title, move back to the logo.
  var MOVE = 2300,
    LOGO_END = 3000,
    TO_TEXT_END = LOGO_END + MOVE,
    TEXT_END = TO_TEXT_END + 2000,
    PERIOD = TEXT_END + MOVE;
  var STAGGER = 400,
    FLY = 1320,
    MAX_PARTICLES = 2600,
    DOT = 3.1,
    TEXT_DOT = 1.8,
    STRAGGLERS = 5;
  var DEPART = 280,
    ARRIVE = 1650;
  // Particle headline offset (px, down) from the span centre, as set by the design check
  var TEXT_DY = 2;

  var current = "logo";
  var parts = [];
  var time = 0;
  var lastFrame = null;
  var frameId = 0;
  var ready = false;
  var canvasWidth = 0;
  var canvasHeight = 0;

  // Measure the same, unscaled box used by the real shape at the end of the morph.
  function relRect(el) {
    var m = morph.getBoundingClientRect(),
      r = el.getBoundingClientRect();
    return { x: r.left - m.left, y: r.top - m.top, width: r.width, height: r.height };
  }

  function visibleLogo() {
    var list = morph.querySelectorAll(".morph-logo");
    for (var i = 0; i < list.length; i++) {
      if (getComputedStyle(list[i]).display !== "none") return list[i];
    }
    return list[0];
  }

  function rgbOf(str) {
    var m = str.match(/[\d.]+/g) || [0, 0, 0];
    return [+m[0], +m[1], +m[2]];
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  // Points of the visible logo, in morph coordinates, with their pixel colours
  function sampleLogo() {
    var logo = visibleLogo(),
      r = relRect(logo);
    var img = logo.classList.contains("logo-dark") ? rasters.dark : rasters.light;
    if (!img.complete || !img.naturalWidth) throw new Error("logo raster not ready");
    var w = Math.max(1, Math.round(r.width)),
      h = Math.max(1, Math.round(r.height));
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    var cx = c.getContext("2d", { willReadFrequently: true });
    cx.drawImage(img, 0, 0, w, h);
    var d = cx.getImageData(0, 0, w, h).data,
      pts = [],
      step = 3;
    for (var y = 0; y < h; y += step) {
      for (var x = 0; x < w; x += step) {
        var i = (y * w + x) * 4;
        if (d[i + 3] > 128) pts.push({ x: r.x + x, y: r.y + y, c: [d[i], d[i + 1], d[i + 2]], sz: DOT });
      }
    }
    return pts;
  }

  // Points of the headline, one colour per line (the accent line takes the accent colour)
  function sampleText() {
    var m = morph.getBoundingClientRect();
    var w = Math.max(1, Math.round(m.width)),
      h = Math.max(1, Math.round(m.height));
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    var cx = c.getContext("2d", { willReadFrequently: true });
    var cs = getComputedStyle(headline);
    cx.font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    cx.textAlign = "center";
    cx.textBaseline = "middle";
    cx.fillStyle = "#000";
    var pts = [],
      step = 2;
    for (var k = 0; k < lines.length; k++) {
      var r = relRect(lines[k]);
      var col = rgbOf(getComputedStyle(lines[k]).color);
      cx.clearRect(0, 0, w, h);
      cx.fillText(lines[k].textContent, r.x + r.width / 2, r.y + r.height / 2 + TEXT_DY);
      var d = cx.getImageData(0, 0, w, h).data;
      for (var y = 0; y < h; y += step) {
        for (var x = 0; x < w; x += step) {
          var i = (y * w + x) * 4;
          if (d[i + 3] > 128) pts.push({ x: x, y: y, c: col, sz: TEXT_DOT });
        }
      }
    }
    return pts;
  }

  // Pair every particle with a start point and an end point, with a random delay and a scatter
  function build(from, to) {
    if (!from.length || !to.length) return [];
    var a = shuffle(from.slice()),
      b = shuffle(to.slice());
    var n = Math.min(MAX_PARTICLES, Math.max(a.length, b.length)),
      out = [];
    for (var i = 0; i < n; i++) {
      var p = a[i % a.length],
        q = b[i % b.length];
      out.push({
        ax: p.x,
        ay: p.y,
        ac: p.c,
        asz: p.sz,
        bx: q.x,
        by: q.y,
        bc: q.c,
        bsz: q.sz,
        d: Math.random() * STAGGER,
        sx: (Math.random() - 0.5) * 140,
        sy: (Math.random() - 0.5) * 140,
      });
    }
    // A few particles start late and keep flying after the real asset is visible, catching up with the rest
    for (var k = 0; k < STRAGGLERS && k < out.length; k++) {
      out[Math.floor(Math.random() * out.length)].d = 650 + Math.random() * 150;
    }
    return out;
  }

  function sizeCanvas() {
    var m = morph.getBoundingClientRect(),
      dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = m.width;
    canvasHeight = m.height;
    var w = Math.round(m.width * dpr),
      h = Math.round(m.height * dpr);
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function clearCanvas() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function smooth(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  function draw(elapsed) {
    clearCanvas();
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var local = Math.min(1, Math.max(0, (elapsed - p.d) / FLY));
      var e = ease(local),
        bump = Math.sin(Math.PI * local) ** 2;
      var x = p.ax + (p.bx - p.ax) * e + p.sx * bump;
      var y = p.ay + (p.by - p.ay) * e + p.sy * bump;
      var r = Math.round(p.ac[0] + (p.bc[0] - p.ac[0]) * e);
      var g = Math.round(p.ac[1] + (p.bc[1] - p.ac[1]) * e);
      var b = Math.round(p.ac[2] + (p.bc[2] - p.ac[2]) * e);
      ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
      var sz = p.asz + (p.bsz - p.asz) * e; // logo dots and text dots differ in size
      sz *= 1 - 0.6 * smooth((local - 0.6) / 0.4);
      ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
    }
  }

  function setState(s) {
    morph.setAttribute("data-state", s);
    current = s;
  }

  // Start of a switch: sample both shapes while they are still laid out
  function startMove(s) {
    parts = [];
    try {
      sizeCanvas();
      parts = s === "to-text" ? build(sampleLogo(), sampleText()) : build(sampleText(), sampleLogo());
    } catch {
      parts = []; // switch without particles if the logo cannot be read
    }
    setState(s);
  }

  function renderMove(elapsed) {
    var depart = smooth(elapsed / DEPART);
    var arrive = smooth((elapsed - ARRIVE) / (MOVE - ARRIVE));
    if (parts.length) draw(elapsed);
    else depart = arrive = smooth(elapsed / MOVE); // Keep both assets visible through a fallback crossfade.

    var fromLogo = current === "to-text";
    morph.style.setProperty("--morph-logo", fromLogo ? 1 - depart : arrive);
    morph.style.setProperty("--morph-text", fromLogo ? arrive : 1 - depart);
    morph.style.setProperty("--morph-particles", parts.length ? depart * (1 - arrive) : 0);
  }

  function rest(state) {
    setState(state);
    parts = [];
    clearCanvas();
  }

  var hero = morph.closest(".hero"),
    heroOn = true;
  function schedule() {
    if (heroOn && ready && !frameId) frameId = window.vkRaf(frame);
  }
  if ("IntersectionObserver" in window && hero) {
    new IntersectionObserver(
      function ([entry]) {
        heroOn = entry.isIntersecting;
        if (heroOn) schedule();
        else {
          window.vkCancelRaf(frameId);
          frameId = 0;
          lastFrame = null;
        }
      },
      { rootMargin: "100px" },
    ).observe(hero);
  }

  function frame(now) {
    frameId = 0;
    time = (time + (lastFrame === null ? 0 : Math.min(50, now - lastFrame))) % PERIOD;
    lastFrame = now;
    var seg = time < LOGO_END ? "logo" : time < TO_TEXT_END ? "to-text" : time < TEXT_END ? "text" : "to-logo";
    if (seg !== current) {
      if (seg.startsWith("to-")) startMove(seg);
      else rest(seg);
    }
    if (seg.startsWith("to-")) renderMove(time - (seg === "to-text" ? LOGO_END : TEXT_END));
    schedule();
  }

  window.addEventListener("resize", function () {
    if (!current.startsWith("to-")) return;
    var bounds = morph.getBoundingClientRect();
    if (bounds.width !== canvasWidth || bounds.height !== canvasHeight) startMove(current);
  });

  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  var rastersReady = Promise.all(
    [rasters.light, rasters.dark].map(function (img) {
      return img.complete
        ? Promise.resolve()
        : new Promise(function (res) {
            img.onload = res;
            img.onerror = res;
          });
    }),
  );
  Promise.all([fontsReady, rastersReady]).then(function () {
    ready = true;
    schedule();
  });
})();
