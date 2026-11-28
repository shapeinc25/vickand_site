document.querySelectorAll("a.page-toggle").forEach((link) => {
  const container = link.parentElement;
  let timer;
  link.addEventListener("click", (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      window.__reduced
    )
      return;
    event.preventDefault();
    if (timer !== undefined) return;

    const target = document.documentElement.dataset.page === "ux" ? "light" : "dark";
    container.dataset.theme = target;
    link.classList.add(`to-${target}`);
    timer = setTimeout(() => location.assign(link.href), 420);
  });

  // A page returned from history should show its own pill, rather than the outgoing animation.
  window.addEventListener("pagehide", () => clearTimeout(timer));
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    timer = undefined;
    delete container.dataset.theme;
    link.classList.remove("to-dark", "to-light");
  });
});
// With no script, a closed navigation still needs a usable way to reach the other pages.
document.documentElement.classList.add("nav-ready");
