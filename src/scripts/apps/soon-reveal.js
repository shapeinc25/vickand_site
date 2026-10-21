import { reducedMotion } from "../common/motion.js";

// Coming Soon: same appearing animation as Section 2 (each part reveals once at least 30% of it is in view)
(function () {
  if (!("IntersectionObserver" in window)) return;
  if (reducedMotion) return;
  var parts = document.querySelectorAll(
    ".section-soon .soon-title, .section-soon .soon-mock, .section-soon .soon-counter, .section-soon .soon-notify, .section-soon .soon-form",
  );
  if (!parts.length) return;
  document.documentElement.classList.add("js-anim");
  var obs = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        obs.unobserve(e.target);
      });
    },
    { threshold: 0.3 },
  );
  parts.forEach(function (el) {
    obs.observe(el);
  });
})();
