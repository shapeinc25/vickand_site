import { seeded } from "./random.js";
import { $ } from "./svg.js";
import { drawChaos } from "./chaos.js";
import { drawUntangle } from "./untangle.js";
import { reducedMotion } from "../../common/motion.js";

/* UX & Design hero, "Tangled Flows": app and game screens get tangled up (chaos.js), then UX untangles them into
   clean flows (untangle.js). This file builds both phases, fits the panel to the screen and runs the replay loop. */
(function () {
  const G = (id) => document.getElementById(id);
  const stage = G("ux-stage"),
    panel = G("ux-panel");
  if (!stage) return;
  const defs = $("defs", {}, stage);
  const { rnd, rr } = seeded(5);

  const { nodes, occ } = drawChaos({
    rnd,
    rr,
    defs,
    lines: G("ux-lines"),
    tags: G("ux-tags"),
    notes: G("ux-notes"),
    chips: G("ux-chips"),
    items: G("ux-items"),
  });
  const CL = drawUntangle({ nodes, defs, chips: G("ux-chips"), cl: G("ux-cl"), panelG: panel });

  // ---- panel sits 24px from the flows, whatever the screen width ----
  let minX = 1e9,
    maxX = -1e9;
  occ.forEach((o) => {
    minX = Math.min(minX, o.x - o.w / 2);
  });
  nodes.forEach((n) => {
    maxX = Math.max(maxX, n.x + n.w / 2);
  });
  CL.forEach((c) => {
    maxX = Math.max(maxX, c.x + c.w / 2);
    minX = Math.min(minX, c.x - c.w / 2);
  });
  function layout() {
    const W = stage.getBoundingClientRect().width;
    if (W < 100) return;
    const L = maxX - minX + 12,
      g = (24 * (L + 158)) / (W - 24);
    stage.setAttribute("viewBox", `${(minX - 6).toFixed(1)} -4 ${(L + g + 158).toFixed(1)} 576`);
    panel.style.setProperty("--px", (maxX + g - 832).toFixed(1) + "px");
  }
  window.addEventListener("resize", layout);
  layout();

  // ---- replay loop: only runs while the UX & Design page is showing ----
  const CYCLE = 18500;
  let timers = [];
  function stop() {
    timers.forEach(clearTimeout);
    timers = [];
    stage.classList.remove("run", "out", "p2");
  }
  function start() {
    timers.forEach(clearTimeout);
    timers = [];
    stage.classList.remove("run", "out", "p2");
    void stage.getBoundingClientRect();
    stage.classList.add("run");
    timers.push(setTimeout(() => stage.classList.add("p2"), 8800));
    timers.push(setTimeout(() => stage.classList.add("out"), CYCLE - 1000));
    timers.push(setTimeout(start, CYCLE));
  }
  const hero = document.querySelector(".ux-hero"),
    still = reducedMotion;
  let ht;
  function intro() {
    clearTimeout(ht);
    if (still) return;
    hero.classList.add("is-a");
    ht = setTimeout(() => hero.classList.remove("is-a"), 1500);
  }
  // the animation starts when at least 30% of it is inside the viewport, and resets when it leaves
  let inView = false,
    running = false;
  function update() {
    const on = inView;
    if (on && !running) {
      running = true;
      layout();
      start();
    } else if (!on && running) {
      running = false;
      stop();
    }
  }
  function sync() {
    layout();
    intro();
    update();
  }
  new IntersectionObserver(
    (es) => {
      const e = es[es.length - 1];
      inView =
        e.isIntersecting &&
        (e.intersectionRatio > 0.3 || (e.rootBounds && e.intersectionRect.height >= 0.3 * e.rootBounds.height));
      update();
    },
    { threshold: [0, 0.1, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] },
  ).observe(stage);
  sync();
})();
