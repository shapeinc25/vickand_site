/* Bubbles fly in from outside the screen toward the headline; once close enough each flips from "before" (orange) to "after" (green) and floats. */
(function () {
  "use strict";
  var sec = document.getElementById("ux-next");
  if (!sec) return;
  var stage = sec.querySelector(".ux-next-stage"),
    bs = [].slice.call(sec.querySelectorAll(".ux-b"));
  var T = [
    [0.26, 0.26],
    [0.74, 0.26],
    [0.31, 0.75],
    [0.69, 0.75],
  ]; // resting spots around the headline (fractions of the stage)
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ticking = false;
  function clamp(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }
  function out(t) {
    return 1 - Math.pow(1 - t, 3);
  } // soft landing
  function update() {
    ticking = false;
    if (!sec.offsetParent) return;
    var W = window.innerWidth,
      H = window.innerHeight,
      r = sec.getBoundingClientRect(),
      narrow = W <= 760,
      i,
      b;
    if (narrow) {
      // phones: static column, state flips as each bubble reaches mid-screen
      for (i = 0; i < bs.length; i++) {
        b = bs[i];
        b.style.transform = "";
        var br = b.getBoundingClientRect();
        b.classList.toggle("is-after", still || br.top + br.height / 2 < H * 0.62);
      }
      return;
    }
    var START = [0.3, 0.27, 0.1, 0.07]; // section top edge position (fraction of screen height) at which each bubble sets off: top pair when 70% is in view, bottom pair when 90% is in view                     // starts once 70% of the section is in the viewport (top edge at 30% of the screen), done shortly after it is pinned
    var sh = Math.max(stage.clientHeight, 560),
      S = bs[0].offsetWidth;
    for (i = 0; i < bs.length; i++) {
      b = bs[i];
      var WC = Math.min(W, 1440),
        tx = (W - WC) / 2 + WC * T[i][0],
        ty = i < 2 ? 92 + S / 2 : sh - 36 - S / 2; // top row clears the header pill, bottom row keeps a margin so no bubble looks cut off
      var dx = tx - W / 2,
        dy = ty - sh / 2,
        len = Math.sqrt(dx * dx + dy * dy) || 1;
      var far = Math.max(W, sh) * 0.75 + S; // start distance: fully outside the viewport
      var q = still ? 1 : clamp((START[i] * H - r.top) / (0.95 * H));
      var e = out(q),
        rem = 1 - e,
        df = Math.sqrt(dx * dx + dy * dy);
      b.style.transform =
        "translate3d(" +
        (tx - S / 2 + (dx / len) * far * rem).toFixed(1) +
        "px," +
        (ty - S / 2 + (dy / len) * far * rem).toFixed(1) +
        "px,0)";
      b.classList.toggle("is-after", rem * far < 70); // within 70px of its spot beside the headline -> changes state
    }
  }
  function req() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }
  window.addEventListener("scroll", req, { passive: true });
  window.addEventListener("resize", req);
  update();
})();
