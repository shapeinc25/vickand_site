// Keep below-the-fold setup out of the initial navigation's rendering work.
export function loadNearViewport(element, load, rootMargin) {
  if (!element) return;
  const start = () => {
    requestAnimationFrame(() => requestAnimationFrame(() => void load().catch(console.error)));
  };
  if (!("IntersectionObserver" in window)) {
    start();
    return;
  }
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      start();
    },
    { rootMargin },
  );
  observer.observe(element);
}
