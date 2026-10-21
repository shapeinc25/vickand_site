// Hero carousel: moves by itself (left to right, one set per 55s), stops on hover, can be swiped / dragged / scrolled sideways,
// and goes on moving 50ms after the gesture (and its momentum) ends.
(function () {
  var track = document.querySelector(".hero-track[data-carousel]");
  if (!track) return;
  var cards = track.children;
  if (cards.length < 12) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia && window.matchMedia("(hover: hover)").matches;
  var hero = track.closest(".hero-window") || track; // the whole window is the drag surface, not just the cards
  var x = 0,
    vel = 0,
    last = 0,
    period = 0,
    speed = 0,
    idle = false;
  var hovering = false,
    focused = false,
    dragging = false,
    resumeAt = 0,
    visible = true;
  var drag = { id: null, sx: 0, sy: 0, lx: 0, lt: 0, moved: false, v: 0, s: [] };

  function measure() {
    period = cards[6].offsetLeft - cards[0].offsetLeft; // one set = the first six cards; moving exactly one set and starting over is seamless
    speed = period / 55; // px per second, same pace as the old CSS animation
  }
  function wrap() {
    while (x > 0) x -= period;
    while (x < -period) x += period;
  }
  function paint() {
    track.style.setProperty("--cx", x.toFixed(2) + "px");
  }
  function begin() {
    measure();
    if (!period) return;
    // continue from where the CSS animation currently is, so there is no jump when the script takes over
    var mt = new DOMMatrixReadOnly(getComputedStyle(track).transform);
    x = mt.m41;
    if (!isFinite(x)) x = -period;
    track.classList.add("is-js");
    hero.classList.add("is-draggable");
    wrap();
    paint();
    last = performance.now();
    requestAnimationFrame(tick);
  }
  function tick(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (visible && !dragging) {
      if (Math.abs(vel) > 8) {
        x += vel * dt;
        vel *= Math.pow(0.14, dt);
        if (Math.abs(vel) <= 8) {
          vel = 0;
          resumeAt = now + 50;
        }
      } else if (!reduce && !(canHover && hovering) && !focused && now >= resumeAt) x += speed * dt;
      wrap();
      paint();
    }
    if (visible) requestAnimationFrame(tick);
    else idle = true;
  }

  hero.addEventListener("pointerenter", function (e) {
    if (e.pointerType === "mouse") hovering = true;
  });
  hero.addEventListener("pointerleave", function (e) {
    if (e.pointerType === "mouse") {
      hovering = false;
      resumeAt = Math.max(resumeAt, performance.now() + 50);
    }
  });
  track.addEventListener("focusin", function (e) {
    focused = !!(e.target.matches && e.target.matches(":focus-visible"));
  });
  track.addEventListener("focusout", function () {
    focused = false;
  });

  hero.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.id = e.pointerId;
    drag.sx = drag.lx = e.clientX;
    drag.sy = e.clientY;
    drag.lt = performance.now();
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
      } // a clear vertical move is a page scroll
      if (Math.abs(e.clientY - drag.sy) > Math.abs(e.clientX - drag.sx) && e.pointerType === "touch") {
        drag.id = null;
        return;
      } // vertical scroll wins
      drag.moved = true;
      dragging = true;
      track.classList.add("is-dragging");
      try {
        hero.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
    x += dx;
    wrap();
    paint();
    drag.s.push({ x: e.clientX, t: now });
    while (drag.s.length > 2 && now - drag.s[0].t > 120) drag.s.shift();
    drag.lx = e.clientX;
    drag.lt = now;
  });
  function end(e) {
    if (e.pointerId !== drag.id) return;
    drag.id = null;
    if (!drag.moved) return;
    dragging = false;
    track.classList.remove("is-dragging");
    var s0 = drag.s[0],
      s1 = drag.s[drag.s.length - 1],
      span = Math.max(16, s1.t - s0.t);
    drag.v = performance.now() - s1.t > 90 ? 0 : ((s1.x - s0.x) / span) * 1000; // speed of the last ~120ms
    vel = Math.abs(drag.v) > 60 ? Math.max(-6000, Math.min(6000, drag.v * 1.15)) : 0; // flicks keep gliding over many cards
    if (!vel) resumeAt = performance.now() + 50;
    last = performance.now();
  }
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);
  window.addEventListener("blur", function () {
    if (drag.id !== null) end({ pointerId: drag.id });
  });
  // a drag must not count as a click on the card underneath
  hero.addEventListener(
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
  hero.addEventListener("dragstart", function (e) {
    e.preventDefault();
  });

  // trackpad / shift+wheel sideways scrolling
  hero.addEventListener(
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
        visible = es[0].isIntersecting;
        last = performance.now();
        if (visible && idle) {
          idle = false;
          requestAnimationFrame(tick);
        }
      },
      { rootMargin: "100px" },
    ).observe(hero);
  window.addEventListener("resize", function () {
    var r = period ? x / period : -1;
    measure();
    x = r * period;
    wrap();
    paint();
  });
  if (document.fonts && document.fonts.ready)
    document.fonts.ready.then(function () {
      if (!track.classList.contains("is-js")) begin();
    });
  else begin();
  window.addEventListener("load", function () {
    if (!track.classList.contains("is-js")) begin();
  });
})();
