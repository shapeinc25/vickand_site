// Header: half size while the page is scrolled, full size only at the very top.
(function () {
  var docEl = document.documentElement;
  function update() {
    docEl.classList.toggle("is-scrolled", (window.scrollY || window.pageYOffset) > 0);
  }
  window.addEventListener("scroll", update, { passive: true });
  update();
})();
