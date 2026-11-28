const modal = document.getElementById("sup-modal");
if (modal) {
  const card = modal.querySelector(".sup-card");
  const form = modal.querySelector("#sup-form");
  let opener, hideTimer, focusTimer, openingFrame;
  const background = new Map();
  const focusables = () =>
    [...modal.querySelectorAll('a,button,input,textarea,[tabindex]:not([tabindex="-1"])')].filter(
      (item) => item.offsetParent !== null && !item.disabled && item.type !== "hidden",
    );
  const close = () => {
    clearTimeout(focusTimer);
    cancelAnimationFrame(openingFrame);
    form?.dispatchEvent(new Event("vickand:close-support"));
    modal.classList.remove("is-open");
    document.documentElement.classList.remove("sup-lock");
    background.forEach((wasInert, item) => (item.inert = wasInert));
    background.clear();
    hideTimer = setTimeout(
      () => {
        modal.hidden = true;
        modal.classList.remove("is-sent");
        form?.reset();
      },
      window.__reduced ? 0 : 280,
    );
    opener?.focus({ preventScroll: true });
  };
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-support-dialog]");
    if (!trigger) return;
    event.preventDefault();
    clearTimeout(hideTimer);
    opener = trigger;
    form?.reset();
    modal.classList.remove("is-sent");
    modal.hidden = false;
    openingFrame = requestAnimationFrame(() => {
      if (!modal.hidden && document.documentElement.classList.contains("sup-lock")) modal.classList.add("is-open");
    });
    document.documentElement.classList.add("sup-lock");
    document.querySelectorAll("body > .view,body > main,body > .site-header,body > .site-footer").forEach((item) => {
      if (!background.has(item)) background.set(item, Boolean(item.inert));
      item.inert = true;
    });
    if (
      trigger.closest('[data-page="email-preferences"]') ||
      document.documentElement.dataset.page === "email-preferences"
    ) {
      const details = modal.querySelector('[name="details"]');
      if (details && !details.value) details.value = window.__t("Please stop release news for this email address.");
    }
    clearTimeout(focusTimer);
    focusTimer = setTimeout(() => {
      if (!modal.hidden && modal.classList.contains("is-open"))
        modal.querySelector("#sup-name")?.focus({ preventScroll: true });
    }, 60);
  });
  modal.querySelector(".sup-close")?.addEventListener("click", close);
  modal.querySelector(".sup-ok")?.addEventListener("click", close);
  modal.addEventListener("pointerdown", (event) => {
    modal.dataset.backdrop = String(event.target === modal);
  });
  modal.addEventListener("click", (event) => {
    if (event.target === modal && modal.dataset.backdrop === "true") close();
  });
  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
    if (event.key === "Tab") {
      const all = focusables(),
        first = all[0],
        last = all.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === card)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  });
}
