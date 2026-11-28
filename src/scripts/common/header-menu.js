document.querySelectorAll(".hdr-menu").forEach((box) => {
  const button = box.querySelector(".hdr-menu-btn");
  const panel = box.querySelector(".hdr-menu-panel");
  if (!button || !panel) return;

  const items = [...panel.querySelectorAll("a")];
  panel.inert = true;
  panel.hidden = false;

  const isOpen = () => button.getAttribute("aria-expanded") === "true";
  const setOpen = (open, refocus = false) => {
    if (isOpen() === open) return;
    button.setAttribute("aria-expanded", String(open));
    if (refocus) button.focus({ preventScroll: true });
    panel.classList.toggle("is-open", open);
    panel.inert = !open;
  };

  button.addEventListener("click", () => setOpen(!isOpen()));
  button.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown") return;
    event.preventDefault();
    setOpen(true);
    items[0]?.focus();
  });
  box.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) {
      event.preventDefault();
      setOpen(false, true);
    }
  });
  panel.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = items.indexOf(document.activeElement);
    const index =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : Math.max(0, Math.min(items.length - 1, current + (event.key === "ArrowDown" ? 1 : -1)));
    items[index]?.focus();
  });
  box.addEventListener("focusout", (event) => {
    if (!box.contains(event.relatedTarget)) setOpen(false);
  });
  panel.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false, true);
  });
  document.addEventListener("pointerdown", (event) => {
    if (!box.contains(event.target)) setOpen(false);
  });
});
document.documentElement.classList.add("nav-ready");
