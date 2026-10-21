import { reducedMotion } from "../common/motion.js";

/* Services carousel: moves by itself (right to left), pauses on hover / focus, can be swiped, dragged or scrolled sideways,
   and goes on moving shortly after the gesture and its momentum end. Same behaviour as the Apps hero carousel. */
(function () {
  "use strict";
  var win = document.getElementById("ux-svc-win"),
    track = document.getElementById("ux-svc-row");
  if (!win || !track) return;
  // the row holds the cards twice so that it can loop: the markup has one set, the copy is made here
  [].slice.call(track.children).forEach(function (card) {
    var copy = card.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    track.appendChild(copy);
  });
  var cards = track.children,
    N = cards.length / 2;
  var reduce = reducedMotion;
  var canHover = window.matchMedia && window.matchMedia("(hover: hover)").matches;
  var x = 0,
    vel = 0,
    last = 0,
    period = 0,
    speed = 0,
    ready = false,
    idle = false;
  var hovering = false,
    focused = false,
    dragging = false,
    resumeAt = 0,
    visible = false;
  var drag = { id: null, sx: 0, sy: 0, lx: 0, moved: false, v: 0, s: [] };
  function measure() {
    if (!win.offsetParent) return false;
    period = cards[N].offsetLeft - cards[0].offsetLeft; // one set; moving exactly one set and starting over is seamless
    speed = period / 60; // px per second: one set per minute
    return period > 0;
  }
  function wrap() {
    while (x > 0) x -= period;
    while (x < -period) x += period;
  }
  function paint() {
    track.style.setProperty("--cx", x.toFixed(2) + "px");
  }
  function begin() {
    if (!measure()) return;
    if (!ready) {
      x = -period * 0.35;
      ready = true;
      last = performance.now();
      requestAnimationFrame(tick);
    }
    wrap();
    paint();
  }
  function tick(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (visible && !dragging && period) {
      if (Math.abs(vel) > 8) {
        x += vel * dt;
        vel *= Math.pow(0.14, dt);
        if (Math.abs(vel) <= 8) {
          vel = 0;
          resumeAt = now + 50;
        }
      } else if (!reduce && !(canHover && hovering) && !focused && now >= resumeAt) x -= speed * dt;
      wrap();
      paint();
    }
    if (visible) requestAnimationFrame(tick);
    else idle = true;
  }
  // title, text and button fade in and the cards rise one by one when the section comes into view. Replays every time it is entered, always in the same order.
  var secEl = document.getElementById("ux-svc");
  // fixed delays and distances (identical every time) that are simply out of order, so the cards look like they rise at random
  var RD = [0.35, 0.05, 0.7, 0.2, 0.55, 0.9, 0.15, 0.45],
    RU = [110, 80, 130, 95, 120, 75, 105, 90];
  function shuffleCards() {
    [].forEach.call(cards, function (cd, k) {
      cd.style.setProperty("--rd", RD[k % N] + "s");
      cd.style.setProperty("--ru", RU[k % N] + "px");
    });
  }
  if (!reduce && "IntersectionObserver" in window && secEl) {
    secEl.classList.add("fade");
    shuffleCards();
    var so = new IntersectionObserver(
      function (es) {
        var e = es[es.length - 1];
        var enough =
          e.isIntersecting &&
          (e.intersectionRatio >= 0.3 || (e.rootBounds && e.intersectionRect.height >= 0.3 * e.rootBounds.height));
        if (enough) {
          shuffleCards();
          void secEl.offsetWidth;
          secEl.classList.add("in");
          so.disconnect();
        } // plays once and stays
      },
      { threshold: [0, 0.3] },
    );
    so.observe(secEl);
  }
  // ---- card hover: border takes a brand colour and the dot field from the "We care about UX" background plays inside the card ----
  var HC = ["#ff701f", "#8a5dd8", "#47d55f", "#ece44f", "#48a9e5", "#ff701f", "#8a5dd8", "#47d55f"]; // brand 400 colours, no neighbours alike
  var GRAD = [
    [46, 207, 73],
    [233, 224, 55],
    [255, 92, 0],
    [122, 71, 211],
  ];
  function grad(t) {
    t = (((t % 1) + 1) % 1) * (GRAD.length - 1);
    var i = Math.min(GRAD.length - 2, Math.floor(t)),
      f = t - i,
      p = GRAD[i],
      q = GRAD[i + 1];
    return (
      "rgb(" +
      Math.round(p[0] + (q[0] - p[0]) * f) +
      "," +
      Math.round(p[1] + (q[1] - p[1]) * f) +
      "," +
      Math.round(p[2] + (q[2] - p[2]) * f) +
      ")"
    );
  }
  var hot = null,
    hotDots = [],
    hw = 0,
    hh = 0,
    hdpr = 1,
    hctx = null,
    hcv = null,
    hm = { x: -999, y: -999 },
    hraf = 0,
    hstop = 0;
  function hframe(now) {
    hraf = 0;
    if (!hot) return;
    var REACH = 170,
      PULL = 16,
      MAXR = 8,
      tShift = now / 9000,
      n = hotDots.length,
      i,
      d,
      dx,
      dy,
      dist,
      k,
      ox,
      oy,
      pos = new Array(n);
    hctx.setTransform(hdpr, 0, 0, hdpr, 0, 0);
    hctx.clearRect(0, 0, hw, hh);
    hctx.lineWidth = 1;
    hctx.strokeStyle = "rgba(255,255,255,.09)";
    hctx.beginPath();
    for (i = 0; i < n; i++) {
      d = hotDots[i];
      dx = hm.x - d.x;
      dy = hm.y - d.y;
      dist = Math.sqrt(dx * dx + dy * dy);
      k = Math.min(PULL, dist) / (dist || 1);
      ox = d.x + dx * k;
      oy = d.y + dy * k;
      pos[i] = [ox, oy, dist];
      if (dist < REACH) {
        hctx.moveTo(d.x, d.y);
        hctx.lineTo(ox, oy);
      }
    }
    hctx.stroke();
    for (i = 0; i < n; i++) {
      var q = pos[i],
        near = Math.max(0, 1 - q[2] / REACH),
        r = 1.3 + near * near * MAXR;
      hctx.beginPath();
      hctx.arc(q[0], q[1], r, 0, 6.2832);
      hctx.fillStyle =
        r > 3
          ? grad((1 - near) * 1.1 + (hotDots[i].x / hw) * 0.2 + tShift)
          : "rgba(211,207,207," + (0.2 + near * 0.5).toFixed(2) + ")";
      hctx.fill();
    }
    hraf = requestAnimationFrame(hframe);
  }
  function heat(card, e) {
    clearTimeout(hstop);
    if (hot && hot !== card) cool(hot, true);
    hot = card;
    hcv = card.querySelector("canvas");
    hctx = hcv.getContext("2d");
    hdpr = Math.min(window.devicePixelRatio || 1, 2);
    hw = card.clientWidth;
    hh = card.clientHeight;
    hcv.width = Math.round(hw * hdpr);
    hcv.height = Math.round(hh * hdpr);
    var cols = Math.max(2, Math.round(hw / 40) + 1),
      rows = Math.max(2, Math.round(hh / 40) + 1);
    hotDots = [];
    for (var a = 0; a < cols; a++)
      for (var b = 0; b < rows; b++) hotDots.push({ x: (hw * a) / (cols - 1), y: (hh * b) / (rows - 1) });
    var r = card.getBoundingClientRect();
    hm.x = e.clientX - r.left;
    hm.y = e.clientY - r.top;
    card.classList.add("is-hot");
    if (!hraf) hraf = requestAnimationFrame(hframe);
  }
  function cool(card, now) {
    card.classList.remove("is-hot");
    if (now) {
      if (hot === card) {
        hot = null;
        cancelAnimationFrame(hraf);
        hraf = 0;
      }
      return;
    }
    hstop = setTimeout(function () {
      if (hot === card) {
        hot = null;
        cancelAnimationFrame(hraf);
        hraf = 0;
      }
    }, 400);
  }
  [].forEach.call(cards, function (card, i) {
    card.style.setProperty("--hc", HC[i % N]);
    var cv = document.createElement("canvas");
    cv.setAttribute("aria-hidden", "true");
    card.insertBefore(cv, card.firstChild);
    // one handler for every kind of pointer: starts the effect (or restarts it if it was switched off) and follows the pointer
    function move(e) {
      if (dragging) return;
      if (hot !== card || !card.classList.contains("is-hot")) heat(card, e);
      else {
        var r = card.getBoundingClientRect();
        hm.x = e.clientX - r.left;
        hm.y = e.clientY - r.top;
      }
    }
    function leave() {
      if (hot === card) cool(card);
    }
    ["pointerenter", "pointermove", "mouseenter", "mousemove", "pointerdown"].forEach(function (t) {
      card.addEventListener(t, move, { passive: true });
    }); // touch: pressing a card plays it
    ["pointerleave", "mouseleave", "pointerup", "pointercancel"].forEach(function (t) {
      card.addEventListener(t, leave, { passive: true });
    });
  });
  win.addEventListener("pointerenter", function (e) {
    if (e.pointerType === "mouse") hovering = true;
  });
  win.addEventListener("pointerleave", function (e) {
    if (e.pointerType === "mouse") {
      hovering = false;
      resumeAt = Math.max(resumeAt, performance.now() + 50);
    }
  });
  win.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.id = e.pointerId;
    drag.sx = drag.lx = e.clientX;
    drag.sy = e.clientY;
    drag.moved = false;
    drag.v = 0;
    drag.s = [{ x: e.clientX, t: performance.now() }];
    vel = 0;
  });
  window.addEventListener("pointermove", function (e) {
    if (e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.lx,
      now = performance.now();
    if (!drag.moved) {
      if (Math.abs(e.clientX - drag.sx) < 4) {
        if (e.pointerType === "touch" && Math.abs(e.clientY - drag.sy) > 10) drag.id = null;
        return;
      }
      if (Math.abs(e.clientY - drag.sy) > Math.abs(e.clientX - drag.sx) && e.pointerType === "touch") {
        drag.id = null;
        return;
      } // vertical scroll wins
      drag.moved = true;
      dragging = true;
      win.classList.add("is-dragging");
      try {
        win.setPointerCapture(e.pointerId);
      } catch {}
    }
    x += dx;
    wrap();
    paint();
    drag.s.push({ x: e.clientX, t: now });
    while (drag.s.length > 2 && now - drag.s[0].t > 120) drag.s.shift();
    drag.lx = e.clientX;
  });
  function end(e) {
    if (e.pointerId !== drag.id) return;
    drag.id = null;
    if (!drag.moved) return;
    dragging = false;
    win.classList.remove("is-dragging");
    var s0 = drag.s[0],
      s1 = drag.s[drag.s.length - 1],
      span = Math.max(16, s1.t - s0.t);
    drag.v = performance.now() - s1.t > 90 ? 0 : ((s1.x - s0.x) / span) * 1000;
    vel = Math.abs(drag.v) > 60 ? Math.max(-6000, Math.min(6000, drag.v * 1.15)) : 0;
    if (!vel) resumeAt = performance.now() + 50;
    last = performance.now();
  }
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);
  win.addEventListener(
    "click",
    function (e) {
      if (drag.moved) {
        e.preventDefault();
        e.stopPropagation();
        drag.moved = false;
      }
    },
    true,
  );
  win.addEventListener("dragstart", function (e) {
    e.preventDefault();
  });
  // trackpad / shift+wheel sideways scrolling
  win.addEventListener(
    "wheel",
    function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      x -= e.deltaX;
      wrap();
      paint();
      vel = 0;
      resumeAt = performance.now() + 50;
    },
    { passive: false },
  );
  if ("IntersectionObserver" in window)
    new IntersectionObserver(
      function (es) {
        visible = es[es.length - 1].isIntersecting;
        last = performance.now();
        if (visible) {
          begin();
          if (idle && ready) {
            idle = false;
            requestAnimationFrame(tick);
          }
        }
      },
      { rootMargin: "100px" },
    ).observe(win);
  else {
    visible = true;
    begin();
  }
  window.addEventListener("resize", function () {
    var r = period ? x / period : 0;
    if (measure()) {
      x = r * period;
      wrap();
      paint();
    }
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(begin);
})();
