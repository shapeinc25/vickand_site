// A refresh starts from the top (no scroll restoration), so the scroll animations play again.
// A link to an anchor (/#find) still lands on its section.
(function () {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (!window.location.hash) window.scrollTo(0, 0);
})();
