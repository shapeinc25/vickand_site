(function () {
  "use strict";
  if (
    !("IntersectionObserver" in window) ||
    (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  )
    return;
  ["ux-cmp", "ux-req", "ux-about"].forEach(function (id) {
    var sec = document.getElementById(id);
    if (!sec) return;
    sec.classList.add("fade");
    var ro = new IntersectionObserver(
      function (es) {
        var e = es[es.length - 1];
        var enough =
          e.isIntersecting &&
          (e.intersectionRatio >= 0.3 || (e.rootBounds && e.intersectionRect.height >= 0.3 * e.rootBounds.height));
        if (enough) {
          void sec.offsetWidth;
          sec.classList.add("in");
          ro.disconnect();
        } // plays once and stays
      },
      { threshold: [0, 0.3] },
    );
    ro.observe(sec);
  });
})();
