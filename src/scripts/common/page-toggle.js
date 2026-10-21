/* Header pill: slides and bounces to the other page, then opens it.
   Apps & Games (/) is the light page, UX & Design (/ux/) the dark one.
   The toggle's container takes the target theme so the pill changes look during the slide. */
(function () {
  "use strict";

  var root = document.documentElement;
  var base = import.meta.env.BASE_URL;
  var toggles = document.querySelectorAll(".page-toggle");

  function reset() {
    toggles.forEach(function (t) {
      t.parentElement.removeAttribute("data-theme");
      t.classList.remove("to-dark", "to-light");
    });
  }

  toggles.forEach(function (toggle) {
    toggle.addEventListener("click", function (event) {
      event.preventDefault();
      var toDark = root.getAttribute("data-theme") !== "dark";
      toggle.parentElement.setAttribute("data-theme", toDark ? "dark" : "light");
      toggle.classList.remove("to-dark", "to-light");
      void toggle.offsetWidth;
      toggle.classList.add(toDark ? "to-dark" : "to-light");
      window.setTimeout(function () {
        window.location.href = base + (toDark ? "ux/" : "");
      }, 420);
    });
  });

  // Back / forward cache: the page comes back as it was left, mid-slide
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) reset();
  });
})();
