// Pick different products for the three phones and use the existing localized, lazy images.
const screens = document.querySelectorAll(".ux-about-cards .ux-ph .mock-bg");
const language = window.__lang;
const { kinetwo, flying } = window.__SHOTS;
const products = [kinetwo[language] || kinetwo.en, flying[language] || flying.en, window.__DD, window.__SM];

for (const screen of screens) {
  const productIndex = Math.floor(Math.random() * products.length);
  const [shots] = products.splice(productIndex, 1);
  window.__setScreen(screen, shots[Math.floor(Math.random() * shots.length)]);
}
