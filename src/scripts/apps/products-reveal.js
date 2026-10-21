// Section 2 scroll animation: the title slides up first; the first product reveals mockups, then text, then buttons.
(function () {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var head = document.querySelector(".section-head");
  var products = document.querySelectorAll(".product[data-reveal]");
  if (!head || !products.length) return;
  document.documentElement.classList.add("js-anim");
  var headObs = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          headObs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.3 },
  );
  headObs.observe(head);
  products.forEach(function (product) {
    var mockObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          product.classList.add("is-revealed");
          mockObs.unobserve(e.target);
        });
      },
      { threshold: 0.3 },
    );
    product.querySelectorAll(".product-mock").forEach(function (el) {
      mockObs.observe(el);
    });

    // Text block and buttons each reveal when at least 30% of them is in view
    var textEls = product.querySelectorAll(".product-title, .product-desc");
    var textObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          textEls.forEach(function (t) {
            t.classList.add("is-in");
          });
          textObs.disconnect();
        });
      },
      { threshold: 0.3 },
    );
    textEls.forEach(function (t) {
      textObs.observe(t);
    });
    var ctas = product.querySelector(".store-ctas");
    if (ctas) {
      var ctaObs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            e.target.classList.add("is-in");
            ctaObs.unobserve(e.target);
          });
        },
        { threshold: 0.3 },
      );
      ctaObs.observe(ctas);
    }
  });
})();
