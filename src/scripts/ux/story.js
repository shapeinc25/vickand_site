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
    var s = -r.top / vh;
    var S = mobile.matches ? Math.min(window.innerWidth * 0.18, 64) : Math.min(window.innerWidth * 0.55, 640);
    var aIn = slide(mobile.matches ? seg(s, -0.2, 0) : seg(s, 0, 0.7));
    var aOut = ease(mobile.matches ? seg(s, 0.34, 0.5) : seg(s, 1.5, 2.6));
    var bIn = slide(mobile.matches ? seg(s, 0.5, 0.7) : seg(s, 1.7, 2.7));
    set(A, -S * (1 - aIn) + (mobile.matches ? S * aOut : 0), aIn * (1 - aOut));
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
