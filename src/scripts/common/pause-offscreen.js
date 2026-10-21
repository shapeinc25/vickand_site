/* Pauses every CSS animation inside a section while that section is out of view (the tangled-flows hero has its own start/stop). */
(function () {
  "use strict";
  if (!("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(
    function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) e.target.removeAttribute("data-off");
        else e.target.setAttribute("data-off", "");
      });
    },
    { rootMargin: "120px" },
  );
  [].forEach.call(document.querySelectorAll("section, header, footer"), function (el) {
    if (!el.classList.contains("ux-hero")) io.observe(el);
  });
})();
