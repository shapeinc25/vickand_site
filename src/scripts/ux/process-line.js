import { reducedMotion } from "../common/motion.js";

/* Process line: pointer (or keyboard / auto-advance) picks the active step; the line bends up under it. */
(function () {
  "use strict";
  var sec = document.getElementById("ux-proc"),
    cv = document.getElementById("ux-proc-line");
  if (!sec || !cv) return;
  var cards = [].slice.call(sec.querySelectorAll(".ux-pc")),
    track = sec.querySelector(".ux-proc-track");
  var ctx = cv.getContext("2d"),
    COLORS = ["#8a5dd8", "#47d55f", "#ece44f", "#48a9e5"];
  var still = reducedMotion;
  var W = 0,
    H = 64,
    dpr = 1,
    HMAX = 34,
    BASE = 44,
    cur = 0,
    hover = false,
    inView = false,
    raf = 0,
    timer = 0;
  var secs = cards.map(function () {
    return { h: 0 };
  });
  function resize() {
    var r = cv.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    draw();
  }
  function setActive(i) {
    if (i < 0 || i >= cards.length || (i === cur && cards[i].classList.contains("is-active"))) return;
    cur = i;
    cards.forEach(function (c, k) {
      c.classList.toggle("is-active", k === i);
    });
    kick();
  }
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var n = secs.length,
      w = W / n,
      wm = w * 0.3;
    secs.forEach(function (s, i) {
      var x0 = i * w,
        hm = s.h * HMAX,
        mid = x0 + w / 2;
      ctx.beginPath();
      ctx.moveTo(x0, BASE);
      ctx.bezierCurveTo(x0 + wm, BASE, x0 + wm, BASE - hm, mid, BASE - hm);
      ctx.bezierCurveTo(x0 + w - wm, BASE - hm, x0 + w - wm, BASE, x0 + w, BASE);
      ctx.lineWidth = 3;
      ctx.strokeStyle = COLORS[i];
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = COLORS[i];
      ctx.arc(mid, BASE - hm, 7 + s.h * 2, 0, 6.2832);
      ctx.fill();
    });
  }
  function step() {
    raf = 0;
    var moving = false;
    secs.forEach(function (s, i) {
      var target = i === cur ? 1 : 0,
        d = target - s.h;
      if (still) {
        s.h = target;
        return;
      }
      if (Math.abs(d) > 0.004) {
        s.h += d * (target ? 0.12 : 0.18);
        moving = true;
      } else s.h = target;
    });
    draw();
    if (moving) raf = requestAnimationFrame(step);
  }
  function kick() {
    if (!raf) raf = requestAnimationFrame(step);
  }
  function auto() {
    clearInterval(timer);
    if (!still)
      timer = setInterval(function () {
        if (inView && !hover) setActive((cur + 1) % cards.length);
      }, 3600);
  }
  track.addEventListener("pointermove", function (e) {
    if (window.innerWidth <= 760) return;
    hover = true;
    var r = track.getBoundingClientRect();
    setActive(Math.max(0, Math.min(cards.length - 1, Math.floor((e.clientX - r.left) / (r.width / cards.length)))));
  });
  track.addEventListener("pointerleave", function () {
    hover = false;
  });
  cards.forEach(function (c, i) {
    c.addEventListener("focus", function () {
      setActive(i);
    });
  });
  window.addEventListener("resize", resize);
  // the page can be opened on another view (display:none -> width 0), so re-measure whenever the canvas gets a real size
  if ("ResizeObserver" in window)
    new ResizeObserver(function () {
      resize();
      kick();
    }).observe(cv);
  if ("IntersectionObserver" in window)
    new IntersectionObserver(
      function (es) {
        inView = es[es.length - 1].isIntersecting;
        if (inView) {
          resize();
          kick();
        }
      },
      { threshold: 0.3 },
    ).observe(sec);
  else inView = true;
  // the heading fades in and the steps rise one after another (fixed delays, out of order so it feels random) once 30% of the section is in view; it plays again after the section has left
  if (!still && "IntersectionObserver" in window) {
    var RDP = [0.3, 0.05, 0.55, 0.18];
    cards.forEach(function (c, k) {
      c.style.setProperty("--rd", RDP[k % 4] + "s");
    });
    sec.classList.add("fade");
    var po = new IntersectionObserver(
      function (es) {
        var e = es[es.length - 1];
        var enough =
          e.isIntersecting &&
          (e.intersectionRatio >= 0.3 || (e.rootBounds && e.intersectionRect.height >= 0.3 * e.rootBounds.height));
        if (enough) {
          void sec.offsetWidth;
          sec.classList.add("in");
          po.disconnect();
        } // plays once and stays
      },
      { threshold: [0, 0.3] },
    );
    po.observe(sec);
  }
  secs[0].h = still ? 1 : 0;
  resize();
  kick();
  auto();
})();
