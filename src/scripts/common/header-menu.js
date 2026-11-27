document.querySelectorAll(".hdr-menu").forEach((box) => {
  const button = box.querySelector(".hdr-menu-btn"),
    panel = box.querySelector(".hdr-menu-panel");
  if (!button || !panel) return;
  let timer, openingFrame;
  const items = () => [...panel.querySelectorAll("a,button")];
  const open = () => {
    clearTimeout(timer);
    panel.hidden = false;
    cancelAnimationFrame(openingFrame);
    openingFrame = requestAnimationFrame(() => {
      if (button.getAttribute("aria-expanded") === "true") panel.classList.add("is-open");
    });
    button.setAttribute("aria-expanded", "true");
  };
  const close = (refocus) => {
    cancelAnimationFrame(openingFrame);
    clearTimeout(timer);
    panel.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
    timer = setTimeout(
      () => {
        panel.hidden = true;
      },
      window.__reduced ? 0 : 200,
    );
    if (refocus) button.focus();
  };
  button.addEventListener("click", () => (button.getAttribute("aria-expanded") !== "true" ? open() : close()));
  button.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      open();
      items()[0]?.focus();
    }
  });
  panel.addEventListener("keydown", (event) => {
    const all = items(),
      current = all.indexOf(document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const index =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? all.length - 1
            : Math.max(0, Math.min(all.length - 1, current + (event.key === "ArrowDown" ? 1 : -1)));
      all[index]?.focus();
    }
  });
  box.addEventListener("focusout", (event) => {
    if (!box.contains(event.relatedTarget)) close();
  });
  panel.addEventListener("click", (event) => {
    if (event.target.closest("a,button")) close();
  });
  document.addEventListener("pointerdown", (event) => {
    if (!box.contains(event.target)) close();
  });
  // A navigation menu is a set of real links, including when JavaScript is unavailable.
  panel.removeAttribute("role");
  button.removeAttribute("aria-haspopup");
  panel.querySelectorAll('[role="menuitem"]').forEach((item) => item.removeAttribute("role"));
});
