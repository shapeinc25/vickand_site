/* UX & Design story: scroll-driven. Text block 1 slides in from the left, goes away to the right; text block 2 slides in from the right;
   the next container then scrolls over the pinned stage. */
(function () {
  "use strict";
  var story = document.getElementById("ux-story");
  if (!story) return;

  var A = story.querySelector(".ux-sp-a .ux-tb"),
    B = story.querySelector(".ux-sp-b .ux-tb");
  if (window.__reduced) return;
  var mobile = window.matchMedia("(max-width: 760px)");
  var stage = story.querySelector(".ux-story-stage");
  var ticking = false;
  function clamp(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }
  function ease(t) {
    return t * t * (3 - 2 * t);
  }
  // CSS-style cubic-bezier(x1,y1,x2,y2) easing: fast start, long soft landing
  function bezier(x1, y1, x2, y2) {
    function cx(t) {
      return 3 * x1 * t * (1 - t) * (1 - t) + 3 * x2 * t * t * (1 - t) + t * t * t;
    }
    function cy(t) {
      return 3 * y1 * t * (1 - t) * (1 - t) + 3 * y2 * t * t * (1 - t) + t * t * t;
    }
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var lo = 0,
        hi = 1,
        t = x;
      for (var i = 0; i < 24; i++) {
        t = (lo + hi) / 2;
        if (cx(t) < x) lo = t;
        else hi = t;
      }
      return cy(t);
    };
  }
  var slide = bezier(0.16, 1, 0.3, 1);
  // segment(s, from, to): 0 before, 1 after (in viewport heights of scroll)
  function seg(s, a, b) {
    return clamp((s - a) / (b - a));
  }
  function set(el, tx, o) {
    el.style.setProperty("--tx", tx.toFixed(1) + "px");
    el.style.setProperty("--o", o.toFixed(3));
  }
  function update() {
    ticking = false;
    if (!story.offsetParent) return; // page not showing
    var vh = window.innerHeight,
      r = story.getBoundingClientRect();
    if (mobile.matches) {
      var second = story.dataset.storyStep === "second";
      // A small dead band keeps a settling swipe from changing panels twice.
      var changeAt = stage.clientHeight * (second ? 0.13 : 0.17);
      var step = -r.top >= changeAt ? "second" : "first";
      if (step !== story.dataset.storyStep) story.dataset.storyStep = step;
      return;
    }
    var s = -r.top / vh;
    var S = Math.min(window.innerWidth * 0.55, 640);
    var aIn = slide(seg(s, 0, 0.7));
    var narrow = window.innerWidth <= 1184;
    var aOut = ease(seg(s, 1.5, narrow ? 1.9 : 2.6));
    var bIn = slide(seg(s, narrow ? 1.9 : 1.7, 2.7));
    set(A, -S * (1 - aIn) - (narrow ? 56 * aOut : 0), aIn * (1 - aOut));
    set(B, S * (1 - bIn), bIn);
  }
  function req() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }
  window.addEventListener("scroll", req, { passive: true });
  window.addEventListener("resize", req);
  window.addEventListener("hashchange", req);
  update();
})();
