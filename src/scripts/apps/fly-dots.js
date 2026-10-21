export let vkFly;

// Shared: dots fly to a word like to a magnet, leaving traces, and light its letters up
(function () {
  var DOTS = 10,
    GHOSTS = 5;
  vkFly = function (seg, fx, section, later, speed) {
    var K = 1 / (speed || 1); // speed > 1 = faster flight
    var sr = section.getBoundingClientRect(),
      n = seg.chars.length,
      rects = seg.chars.map(function (c) {
        return c.getBoundingClientRect();
      });
    var longest = 0;
    for (var i = 0; i < DOTS; i++) {
      var size = 2 + 16 * Math.pow(Math.random(), 1.5); // 2 - 18px
      var ci = Math.min(n - 1, Math.floor(((i + Math.random() * 0.8) / DOTS) * n)); // spread the targets along the word
      var r = rects[ci],
        tx = r.left - sr.left + r.width * (0.25 + Math.random() * 0.5),
        ty = r.top - sr.top + r.height * (0.35 + Math.random() * 0.4);
      var ang = Math.random() * 6.2832,
        dist = 200 + Math.random() * 360;
      var sx = Math.max(10, Math.min(sr.width - 10, tx + Math.cos(ang) * dist)),
        sy = Math.max(10, Math.min(sr.height - 10, ty + Math.sin(ang) * dist * 0.7));
      var dx = tx - sx,
        dy = ty - sy,
        len = Math.sqrt(dx * dx + dy * dy) || 1,
        bend = (Math.random() - 0.5) * 0.5 * len,
        nx = (-dy / len) * bend,
        ny = (dx / len) * bend;
      var kf = [0, 0.2, 0.4, 0.6, 0.8, 1].map(function (t) {
        // curved flight (quadratic bezier), so the dots swing in
        var u = 1 - t,
          bx = u * u * sx + 2 * u * t * (sx + dx / 2 + nx) + t * t * tx,
          by = u * u * sy + 2 * u * t * (sy + dy / 2 + ny) + t * t * ty;
        return {
          transform:
            "translate(" + bx.toFixed(1) + "px," + by.toFixed(1) + "px) scale(" + (1 - 0.65 * t * t).toFixed(2) + ")",
          offset: t,
        };
      });
      var delay = (i * 60 + Math.random() * 90) * K,
        dur = (650 + Math.random() * 300) * K;
      longest = Math.max(longest, delay + dur + GHOSTS * 34 * K);
      for (var g = 0; g <= GHOSTS; g++) {
        // g = 0 is the dot, the rest are fading traces behind it
        var d = document.createElement("i"),
          s = size * (1 - g * 0.11);
        d.style.cssText =
          "width:" +
          s +
          "px;height:" +
          s +
          "px;margin:" +
          -s / 2 +
          "px 0 0 " +
          -s / 2 +
          "px;background:" +
          seg.col +
          ";opacity:0;" +
          (g === 0 ? "box-shadow:0 0 " + size * 0.9 + "px " + seg.col + ";" : "");
        fx.appendChild(d);
        var k = kf.map(function (f, j) {
          return {
            transform: f.transform,
            offset: f.offset,
            opacity: j === 0 ? 0 : g === 0 ? 1 : 0.5 * (1 - g / (GHOSTS + 1)),
          };
        });
        k[k.length - 1].opacity = 0;
        var an = d.animate(k, {
          duration: dur,
          delay: delay + g * 34 * K,
          easing: "cubic-bezier(.55,.05,.9,.45)",
          fill: "both",
        });
        an.onfinish = (function (el) {
          return function () {
            if (el.parentNode) el.parentNode.removeChild(el);
          };
        })(d);
      }
      // the letters under the dot light up when it arrives
      (function (idx) {
        later(delay + dur - 30, function () {
          for (var j = idx - 1; j <= idx + 1; j++) if (seg.chars[j]) seg.chars[j].classList.add("is-lit");
        });
      })(ci);
    }
    later(longest, function () {
      seg.chars.forEach(function (c) {
        c.classList.add("is-lit");
      });
    });
    return longest;
  };
  var gen = 0,
    TYPE_MS = [250, 300]; // typing time per sentence: the first 250ms, the three-line one 300ms
})();
