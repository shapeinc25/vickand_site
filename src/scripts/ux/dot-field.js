/* Dot-field background for the UX story stage (rewritten from "Heavy Dots" by Nick Sheffield, MIT).
   Dots fill the whole stage; they lean toward the pointer and grow near it; large active dots take colours from the brand gradient. */
(function () {
  "use strict";
  var cv = document.getElementById("ux-dots");
  if (!cv) return;
  var stage = cv.parentNode,
    ctx = cv.getContext("2d");
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var GRAD = [
    [46, 207, 73],
    [233, 224, 55],
    [255, 92, 0],
    [122, 71, 211],
  ]; // green-500, yellow-500, orange-500, purple-500
  var SPACING = 52,
    REACH = 230,
    PULL = 20,
    MAXR = 11;
  var dots = [],
    W = 0,
    H = 0,
    dpr = 1,
    running = false,
    raf = 0;
  var mouse = { x: -9999, y: -9999, seen: 0 };

  function grad(t) {
    // t 0..1 (wraps) -> rgb along the brand gradient
    t = (((t % 1) + 1) % 1) * (GRAD.length - 1);
    var i = Math.min(GRAD.length - 2, Math.floor(t)),
      f = t - i,
      a = GRAD[i],
      b = GRAD[i + 1];
    return (
      "rgb(" +
      Math.round(a[0] + (b[0] - a[0]) * f) +
      "," +
      Math.round(a[1] + (b[1] - a[1]) * f) +
      "," +
      Math.round(a[2] + (b[2] - a[2]) * f) +
      ")"
    );
  }
  function resize() {
    var r = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    // fill the whole stage edge to edge, evenly spaced
    var cols = Math.max(2, Math.round(W / SPACING) + 1),
      rows = Math.max(2, Math.round(H / SPACING) + 1);
    dots = [];
    for (var i = 0; i < cols; i++)
      for (var j = 0; j < rows; j++) dots.push({ x: (W * i) / (cols - 1), y: (H * j) / (rows - 1) });
  }
  function onMove(e) {
    var r = stage.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
    mouse.seen = performance.now();
  }
  function frame(now) {
    raf = 0;
    if (!running) return;
    // with no pointer (touch / idle) a soft virtual pointer wanders across the whole field
    var px = mouse.x,
      py = mouse.y;
    if (now - mouse.seen > 2500) {
      px = W * (0.5 + 0.42 * Math.sin(now / 2600));
      py = H * (0.5 + 0.4 * Math.sin(now / 1900 + 1));
    }
    var tShift = now / 9000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var n = dots.length,
      i,
      d,
      dx,
      dy,
      dist,
      k,
      ang,
      ox,
      oy,
      pos = new Array(n);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,.09)";
    ctx.beginPath();
    for (i = 0; i < n; i++) {
      d = dots[i];
      dx = px - d.x;
      dy = py - d.y;
      dist = Math.sqrt(dx * dx + dy * dy);
      k = Math.min(PULL, dist) / (dist || 1);
      ox = d.x + dx * k;
      oy = d.y + dy * k;
      pos[i] = [ox, oy, dist];
      if (dist < REACH) {
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(ox, oy);
      }
    }
    ctx.stroke();
    for (i = 0; i < n; i++) {
      var p = pos[i],
        near = Math.max(0, 1 - p[2] / REACH),
        r = 1.4 + near * near * MAXR;
      ctx.beginPath();
      ctx.arc(p[0], p[1], r, 0, 6.2832);
      if (r > 3.2) {
        // large, active dot: colour moves through the brand gradient with distance, position and time
        ctx.fillStyle = grad((1 - near) * 1.1 + (dots[i].x / W) * 0.2 + tShift);
      } else {
        ctx.fillStyle = "rgba(211,207,207," + (0.22 + near * 0.5).toFixed(2) + ")";
      }
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!running) {
      running = true;
      raf = requestAnimationFrame(frame);
    }
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onMove, { passive: true });
  if (still) {
    // reduced motion: one static frame
    mouse.seen = 0;
    running = true;
    frame(6000);
    running = false;
    return;
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      function (es) {
        if (es[es.length - 1].isIntersecting) {
          resize();
          start();
        } else stop();
      },
      { threshold: 0 },
    ).observe(stage);
  } else start();
})();
