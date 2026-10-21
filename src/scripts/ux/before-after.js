import { reducedMotion } from "../common/motion.js";

/* Before / After slider: drag anywhere on it, use the arrow buttons or the keyboard. One gentle sweep hints at it the first time it is seen. */
(function () {
  "use strict";
  var sec = document.getElementById("ux-cmp"),
    box = document.getElementById("ux-cmp-box"),
    handle = document.getElementById("ux-cmp-handle");
  if (!sec || !box || !handle) return;
  var reduce = reducedMotion;
  var pos = 50,
    dragging = false,
    tween = 0,
    touched = false;
  function set(p) {
    pos = Math.max(0, Math.min(100, p));
    box.style.setProperty("--p", pos.toFixed(2));
    handle.setAttribute("aria-valuenow", Math.round(pos));
  }
  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function go(to, ms) {
    cancelAnimationFrame(tween);
    to = Math.max(0, Math.min(100, to));
    if (reduce) {
      set(to);
      return;
    }
    var from = pos,
      t0 = performance.now();
    (function step(now) {
      var k = Math.min(1, (now - t0) / ms);
      set(from + (to - from) * ease(k));
      if (k < 1) tween = requestAnimationFrame(step);
    })(t0);
  }
  function fromX(x) {
    var r = box.getBoundingClientRect();
    set(((x - r.left) / r.width) * 100);
  }
  box.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    touched = true;
    cancelAnimationFrame(tween);
    dragging = true;
    box.classList.add("is-dragging");
    fromX(e.clientX);
    try {
      box.setPointerCapture(e.pointerId);
    } catch {}
  });
  box.addEventListener("pointermove", function (e) {
    if (dragging) fromX(e.clientX);
  });
  function end() {
    dragging = false;
    box.classList.remove("is-dragging");
  }
  box.addEventListener("pointerup", end);
  box.addEventListener("pointercancel", end);
  var slides = box.querySelectorAll(".ux-cmp-slide"),
    dots = document.querySelectorAll("#ux-cmp-dots button"),
    cur = 0;
  var anims = [];
  function show(n, dir) {
    n = (n + slides.length) % slides.length;
    if (n === cur) {
      touched = true;
      go(50, 400);
      return;
    }
    anims.forEach(function (a) {
      a.cancel();
    });
    anims = [];
    for (var k = 0; k < slides.length; k++) slides[k].classList.remove("is-out");
    var out = slides[cur],
      inn = slides[n];
    dir = dir || (n > cur ? 1 : -1);
    cur = n;
    for (var i = 0; i < slides.length; i++) {
      slides[i].classList.toggle("is-on", i === cur);
      slides[i].setAttribute("aria-hidden", i === cur ? "false" : "true");
      dots[i].classList.toggle("is-on", i === cur);
      dots[i].setAttribute("aria-selected", i === cur);
    }
    touched = true;
    go(50, 400);
    if (reduce || !out.animate) return;
    out.classList.add("is-out");
    var o = { duration: 650, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" };
    var a1 = out.animate([{ transform: "translateX(0)" }, { transform: "translateX(" + -dir * 100 + "%)" }], o);
    var a2 = inn.animate([{ transform: "translateX(" + dir * 100 + "%)" }, { transform: "translateX(0)" }], o);
    anims = [a1, a2];
    a1.onfinish = function () {
      out.classList.remove("is-out");
      a1.cancel();
      a2.cancel();
      anims = [];
    };
  }
  document.getElementById("ux-cmp-prev").addEventListener("click", function () {
    show(cur - 1, -1);
  });
  document.getElementById("ux-cmp-next").addEventListener("click", function () {
    show(cur + 1, 1);
  });
  for (var d = 0; d < dots.length; d++)
    (function (n) {
      dots[n].addEventListener("click", function () {
        show(n);
      });
    })(d);
  handle.addEventListener("keydown", function (e) {
    var d =
      e.key === "ArrowLeft" || e.key === "ArrowDown"
        ? -5
        : e.key === "ArrowRight" || e.key === "ArrowUp"
          ? 5
          : e.key === "Home"
            ? -100
            : e.key === "End"
              ? 100
              : 0;
    if (!d) return;
    e.preventDefault();
    touched = true;
    cancelAnimationFrame(tween);
    set(pos + d);
  });
  // hint: a small sweep to both sides the first time half of the section is in view
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (es) {
        if (
          !es.some(function (e) {
            return e.isIntersecting;
          })
        )
          return;
        io.disconnect();
        setTimeout(function () {
          if (touched) return;
          go(36, 700);
          setTimeout(function () {
            if (!touched) go(64, 900);
            setTimeout(function () {
              if (!touched) go(50, 700);
            }, 1000);
          }, 800);
        }, 500);
      },
      { threshold: 0.5 },
    );
    io.observe(sec);
  }
})();
