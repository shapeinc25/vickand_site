import morphLogoLight from "../../assets/images/morph-logo-light.webp";
import morphLogoDark from "../../assets/images/morph-logo-dark.webp";
import { reducedMotion, lowPower } from "../common/motion.js";

// Hero morph: the logo and the headline take turns. The switch breaks the first shape into
// particles that fly to the second shape. Resting states use the real logo and headline.
(function () {
  "use strict";
  var morph = document.querySelector(".hero-morph");
  var canvas = morph && morph.querySelector(".morph-canvas");
  var headline = document.getElementById("hero-title");
  if (!morph || !canvas || !canvas.getContext || !headline) return;
  if (reducedMotion || lowPower) return; // the logo stays, the headline is still read out

  var ctx = canvas.getContext("2d");
  var lines = headline.querySelectorAll("span");

  // The logo SVG cannot be read as pixels (it uses foreignObject), so the particles are sampled from raster copies.
  // Only the copy of the logo on screen is fetched, on first use.
  var rasters = { light: null, dark: null };
  function raster(dark) {
    var k = dark ? "dark" : "light";
    if (!rasters[k]) {
      rasters[k] = new Image();
      rasters[k].src = dark ? morphLogoDark : morphLogoLight;
    }
    return rasters[k];
  }

  // Timeline (ms, loops every PERIOD): logo rests, breaks apart, headline rests, particles rebuild the logo
  var PERIOD = 9000,
    LOGO_END = 3000,
    TO_TEXT_END = 5000,
    TEXT_END = 7000,
    TO_LOGO_END = 9000;
  var STAGGER = 400,
    FLY = 1200,
    MAX_PARTICLES = 2600,
    DOT = 3.1,
    TEXT_DOT = 1.8,
    STRAGGLERS = 5;
  // Ms into a switch when the real asset takes over from the particles (they are still landing)
  var DOM_SWITCH = 1200;
  // Particle headline offset (px, down) from the span centre, as set by the design check
  var TEXT_DY = 2;

  var current = "logo";
  var parts = [];
  var start = 0;

  // Layout box of an element in morph coordinates; the centre comes from the screen rect, the size from layout
  // (so a scaled element is sampled at its real size)
  function relRect(el) {
    var m = morph.getBoundingClientRect(),
      r = el.getBoundingClientRect();
    var w = el.offsetWidth || r.width,
      h = el.offsetHeight || r.height;
    var cx = r.left - m.left + r.width / 2,
      cy = r.top - m.top + r.height / 2;
    return { x: cx - w / 2, y: cy - h / 2, width: w, height: h };
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
    var img = raster(logo.classList.contains("logo-dark"));
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
      dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(m.width * dpr);
    canvas.height = Math.round(m.height * dpr);
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

  function draw(elapsed) {
    clearCanvas();
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var local = Math.min(1, Math.max(0, (elapsed - p.d) / FLY));
      var e = ease(local),
        bump = Math.sin(Math.PI * local);
      var x = p.ax + (p.bx - p.ax) * e + p.sx * bump;
      var y = p.ay + (p.by - p.ay) * e + p.sy * bump;
      var r = Math.round(p.ac[0] + (p.bc[0] - p.ac[0]) * e);
      var g = Math.round(p.ac[1] + (p.bc[1] - p.ac[1]) * e);
      var b = Math.round(p.ac[2] + (p.bc[2] - p.ac[2]) * e);
      ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
      var sz = p.asz + (p.bsz - p.asz) * e; // logo dots and text dots differ in size
      if (local > 0.6) sz *= 1 - (0.6 * (local - 0.6)) / 0.4; // the last part of the flight shrinks the dot to 40%
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
    canvas.classList.add("is-holding");
    try {
      sizeCanvas();
      parts = s === "to-text" ? build(sampleLogo(), sampleText()) : build(sampleText(), sampleLogo());
    } catch {
      parts = []; // switch without particles if the logo cannot be read
    }
    setState(s);
  }

  // Resting state: the particle layer is cleared and the real logo or headline is shown
  function rest(s) {
    canvas.classList.remove("is-holding"); // the particle layer fades out (styles.css), then is cleared
    parts = [];
    setState(s);
    window.setTimeout(clearCanvas, 260);
  }

  var heroEl = document.querySelector(".hero"),
    heroOn = true,
    frameIdle = false;
  if ("IntersectionObserver" in window && heroEl)
    new IntersectionObserver(
      function (es) {
        heroOn = es[es.length - 1].isIntersecting;
        if (heroOn && frameIdle) {
          frameIdle = false;
          requestAnimationFrame(frame);
        }
      },
      { rootMargin: "100px" },
    ).observe(heroEl);
  function frame(now) {
    var t = (now - start) % PERIOD;
    var seg =
      t < LOGO_END
        ? "logo"
        : t < TO_TEXT_END
          ? "to-text"
          : t < TEXT_END
            ? "text"
            : t < TO_LOGO_END
              ? "to-logo"
              : "logo";
    if (seg !== current) {
      if (seg === "to-text" || seg === "to-logo") startMove(seg);
      else rest(seg);
    }
    if (current === "to-text" || current === "to-logo") {
      var elapsed = current === "to-text" ? t - LOGO_END : t - TEXT_END;
      var shown = elapsed >= DOM_SWITCH ? (current === "to-text" ? "text" : "logo") : current;
      if (morph.getAttribute("data-state") !== shown) morph.setAttribute("data-state", shown);
      draw(elapsed);
    }
    if (heroOn) requestAnimationFrame(frame);
    else frameIdle = true;
  }

  window.addEventListener("resize", function () {
    if (current === "to-text" || current === "to-logo") sizeCanvas();
  });

  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  // the raster is fetched once the page has loaded, so it never competes with the first screen
  var pageLoaded =
    document.readyState === "complete"
      ? Promise.resolve()
      : new Promise(function (res) {
          window.addEventListener("load", res, { once: true });
        });
  var rastersReady = pageLoaded.then(function () {
    var img = raster(visibleLogo().classList.contains("logo-dark"));
    return img.complete
      ? null
      : new Promise(function (res) {
          img.onload = res;
          img.onerror = res;
        });
  });
  Promise.all([fontsReady, rastersReady]).then(function () {
    start = performance.now();
    requestAnimationFrame(frame);
  });
})();
