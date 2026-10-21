// Section 2 on mobile: the dots follow the swipe position and can be tapped.
(function () {
  document.querySelectorAll(".product").forEach(function (product) {
    var track = product.querySelector(".product-mocks");
    var dots = product.querySelectorAll(".product-dots button");
    var items = track ? track.children : [];
    if (!track || !dots.length) return;
    function current() {
      var mid = track.scrollLeft + track.clientWidth / 2,
        best = 0,
        bestD = Infinity;
      for (var i = 0; i < items.length; i++) {
        var c = items[i].offsetLeft + items[i].offsetWidth / 2,
          d = Math.abs(c - mid);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return best;
    }
    function update() {
      var i = current();
      dots.forEach(function (d, n) {
        d.classList.toggle("is-active", n === i);
      });
    }
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    dots.forEach(function (d, n) {
      d.addEventListener("click", function () {
        var it = items[n];
        track.scrollTo({
          left: it.offsetLeft + it.offsetWidth / 2 - track.clientWidth / 2 - it.offsetWidth / 28,
          behavior: "smooth",
        });
      });
    });
    update();
  });
})();
