const alternate = document.querySelector("a.page-toggle");

if (alternate) {
  // Animate the arriving control, while the new document stays interactive.
  if (document.referrer && performance.getEntriesByType("navigation")[0]?.type === "navigate") {
    const previous = new URL(document.referrer);
    if (previous.origin === location.origin && previous.pathname === alternate.pathname && !location.hash)
      alternate.classList.add("mode-arriving");
  }

  let warmed = false;
  function warmAlternate() {
    if (
      warmed ||
      document.hidden ||
      navigator.connection?.saveData ||
      /(^|-)2g$/.test(navigator.connection?.effectiveType || "")
    )
      return;
    warmed = true;
    if (window.HTMLScriptElement.supports?.("speculationrules")) {
      const rules = document.createElement("script");
      rules.type = "speculationrules";
      rules.textContent = JSON.stringify({ prefetch: [{ urls: [alternate.href], eagerness: "immediate" }] });
      document.head.append(rules);
    } else {
      const hint = document.createElement("link");
      if (!hint.relList.supports("prefetch")) return;
      hint.rel = "prefetch";
      hint.href = alternate.href;
      document.head.append(hint);
    }
  }

  const afterLoad = () => {
    if (window.requestIdleCallback) window.requestIdleCallback(warmAlternate);
    else window.setTimeout(warmAlternate, 300);
  };
  if (document.readyState === "complete") afterLoad();
  else window.addEventListener("load", afterLoad, { once: true });
  alternate.addEventListener("pointerenter", warmAlternate, { once: true, passive: true });
  alternate.addEventListener("focus", warmAlternate, { once: true });
}
