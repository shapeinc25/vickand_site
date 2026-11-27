const area = document.querySelector('[data-rotate="daydraft"]');
if (area && !window.__reduced) {
  const backgrounds = [...area.querySelectorAll(".mock-bg")];
  let start = 0,
    timer,
    swap;
  const stop = () => {
    clearInterval(timer);
    clearTimeout(swap);
    backgrounds.forEach((background) => background.classList.remove("is-swap"));
    timer = undefined;
  };
  const begin = () => {
    if (timer || document.hidden) return;
    timer = setInterval(() => {
      backgrounds.forEach((background) => background.classList.add("is-swap"));
      swap = setTimeout(() => {
        start = (start + 3) % window.__DD.length;
        backgrounds.forEach((background, i) => {
          window.__setScreen(background, window.__DD[(start + i) % window.__DD.length]);
          background.classList.remove("is-swap");
        });
      }, 350);
    }, 5000);
  };
  let visible = false;
  if ("IntersectionObserver" in window)
    new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        visible ? begin() : stop();
      },
      { threshold: 0.2 },
    ).observe(area);
  else {
    visible = true;
    begin();
  }
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : visible && begin()));
}
