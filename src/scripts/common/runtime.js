import translations from "../../data/translations.json";
import additions from "../../data/interface-copy.json";
import sentences from "../../data/sentences.json";
import screenshots from "../../data/screenshots.json";

const language = document.documentElement.lang || "en";
const dictionary = { ...(translations[language] || {}), ...(additions[language] || {}) };
const normalize = (value) => String(value).replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();
window.__t = (value) => dictionary[value] ?? dictionary[normalize(value)] ?? value;
window.__lang = language === "uk" ? "ua" : language;
window.__SENT = { ru: sentences.ru, ua: sentences.uk };
window.__SHOTS = screenshots;
const imported = import.meta.glob(
  ["../../assets/img/shots/**/*.{webp,avif,png,jpg,jpeg}", "../../assets/img/raster-*.webp"],
  { eager: true, query: "?url", import: "default" },
);
const urls = Object.fromEntries(
  Object.entries(imported).map(([key, value]) => [key.replace("../../assets/", ""), value]),
);
const sourceKeys = new Map(Object.entries(urls).map(([key, url]) => [url, key]));
window.__asset = (value) => urls[String(value).replace(/^assets\//, "")] || value;
window.__setScreen = (element, value) => {
  let image = element.querySelector(".screen-image");
  if (!image) {
    image = document.createElement("img");
    image.className = "screen-image";
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.width = 624;
    image.height = 1362;
    element.appendChild(image);
  }
  const next = window.__asset(value);
  if (image.getAttribute("src") !== next) image.src = next;
  const key = sourceKeys.get(value) || String(value).replace(/^assets\//, "");
  const small = urls[key.replace("shots/", "shots/responsive/")];
  if (small) {
    image.srcset = `${small} 360w, ${next} 624w`;
    image.sizes = "(max-width:760px) 240px, 280px";
  } else image.removeAttribute("srcset");
  element.style.removeProperty("--banner");
};
window.__DD = Array.from({ length: 3 }, (_, i) => window.__asset(`img/shots/daydraft-${i + 1}.webp`));
window.__SM = Array.from({ length: 3 }, (_, i) => window.__asset(`img/shots/shapemania-${i + 1}.webp`));

window.__reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
document.documentElement.dataset.motion = window.__reduced ? "paused" : "running";
document.documentElement.classList.add("js");

// Pause authored frame loops in a hidden tab, without replacing the browser's own APIs.
let nextFrameId = 1;
const nativeFrames = new Map(),
  deferred = new Map();
const scheduleFrame = (callback, essential = false) => {
  const id = nextFrameId++;
  const run = (time) => {
    nativeFrames.delete(id);
    if (document.hidden || (window.__reduced && !essential)) deferred.set(id, { callback, essential });
    else callback(time);
  };
  nativeFrames.set(id, requestAnimationFrame(run));
  return id;
};
window.vkRaf = (callback) => scheduleFrame(callback);
window.vkGameRaf = (callback) => scheduleFrame(callback, true);
window.vkCancelRaf = (id) => {
  if (nativeFrames.has(id)) cancelAnimationFrame(nativeFrames.get(id));
  nativeFrames.delete(id);
  deferred.delete(id);
};
document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  for (const [id, { callback, essential }] of deferred) {
    if (window.__reduced && !essential) continue;
    deferred.delete(id);
    nativeFrames.set(
      id,
      requestAnimationFrame((time) => {
        nativeFrames.delete(id);
        callback(time);
      }),
    );
  }
});
document.querySelectorAll("a[data-language]").forEach((link) =>
  link.addEventListener("click", () => {
    try {
      localStorage.setItem("vickand-lang", link.dataset.language);
    } catch {
      /* Locale links work without storage. */
    }
  }),
);

// Old single-document links remain useful, while each real page has its own address.
if (["#ux", "#terms", "#privacy", "#apps"].includes(location.hash)) {
  const prefix = language === "en" ? "" : `/${language}`;
  const route = { "#ux": "/ux/", "#terms": "/terms/", "#privacy": "/privacy/", "#apps": "/" }[location.hash];
  if (location.pathname !== prefix + route) location.replace(prefix + route);
}
