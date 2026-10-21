// Touch screens have no hover: the hero card that passes through the middle of the viewport is activated as if hovered.
(function () {
  var mq = window.matchMedia ? window.matchMedia("(hover: none)") : null;
  var cards = document.querySelectorAll(".hero-track .mock");
  var hero = document.querySelector(".hero-window");
  if (!mq || !cards.length || !hero) return;
  var frame = 0,
    active = null;
  function setActive(el) {
    if (el === active) return;
    if (active) active.classList.remove("is-active");
    if (el) el.classList.add("is-active");
    active = el;
  }
  var tOn = true,
    tIdle = false;
  if ("IntersectionObserver" in window)
    new IntersectionObserver(
      function (es) {
        tOn = es[es.length - 1].isIntersecting;
        if (tOn && tIdle) {
          tIdle = false;
          requestAnimationFrame(tick);
        }
      },
      { rootMargin: "100px" },
    ).observe(hero);
  function tick() {
    if (!tOn) {
      tIdle = true;
      return;
    }
    requestAnimationFrame(tick);
    if (++frame % 4) return;
    if (!mq.matches) {
      setActive(null);
      return;
    }
    var h = hero.getBoundingClientRect();
    if (h.bottom < 0 || h.top > window.innerHeight) {
      setActive(null);
      return;
    }
    var mid = window.innerWidth / 2,
      best = null,
      bestD = Infinity;
    for (var i = 0; i < cards.length; i++) {
      var r = cards[i].getBoundingClientRect();
      var d = Math.abs(r.left + r.width / 2 - mid);
      if (d < bestD) {
        bestD = d;
        best = cards[i];
      }
    }
    setActive(bestD < best.getBoundingClientRect().width * 0.6 ? best : null);
  }
  requestAnimationFrame(tick);
})();
