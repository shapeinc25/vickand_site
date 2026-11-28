/* The original dot field was adapted from "Heavy Dots" by Nick Sheffield, MIT.
   Compact touch screens use a drifting field with a damped response to taps. */
const canvas = document.getElementById("ux-dots");
const stage = canvas?.parentElement;
const ctx = canvas?.getContext("2d");
const touchStory = window.matchMedia("(max-width: 760px) and (pointer: coarse)");
const palette = [
  [46, 207, 73],
  [233, 224, 55],
  [255, 92, 0],
  [122, 71, 211],
];
const spacing = 52;
const reach = 230;
const pull = 20;
const dots = [];
const centre = { x: 0.5, y: 0.63 };
let pointer;
let useTouch = touchStory.matches;
let width = 0;
let height = 0;
let dpr = 1;
let frameId = 0;
let previousTime;
let elapsed = 0;

const clamp = (value) => Math.max(0, Math.min(1, value));
const ease = (t) => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;

function shade(band, tone, alpha) {
  const index = Math.min(palette.length - 2, Math.floor(band));
  const [r, g, b] = palette[index].map((channel, i) =>
    Math.round(mix(211, mix(channel, palette[index + 1][i], band - index), tone)),
  );
  return `rgba(${r},${g},${b},${alpha})`;
}

function colour(dot, radius, now) {
  const strength = dot.energy;
  if (useTouch) {
    if (!strength) return "rgba(211,211,211,.21)";
    const phase = elapsed / 4200 + dot.phase * 0.7 + strength;
    const band = (0.5 - 0.5 * Math.cos(phase)) * (palette.length - 1);
    return shade(band, ease(strength), 0.21 + 0.58 * strength);
  }
  if (radius <= 3.2) return `rgba(211,207,207,${(0.22 + strength * 0.5).toFixed(2)})`;
  const phase = (1 - strength) * 1.1 + (dot.x / width) * 0.2 + now / 9000;
  return shade((phase % 1) * (palette.length - 1), 1, 1);
}

function draw(now) {
  const recent = pointer && now - pointer.at <= 2500;
  const cx = useTouch ? centre.x * width : (recent ? pointer.x : 0.5 + 0.42 * Math.sin(now / 2600)) * width;
  const cy = useTouch ? centre.y * height : (recent ? pointer.y : 0.5 + 0.4 * Math.sin(now / 1900 + 1)) * height;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 1;
  ctx.strokeStyle = useTouch ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.09)";
  ctx.beginPath();
  for (const dot of dots) {
    const x = dot.x + (useTouch ? 6 * Math.sin(elapsed / 2600 + dot.phase) : 0);
    const y = dot.y + (useTouch ? 5 * Math.cos(elapsed / 3100 + dot.phase) : 0);
    const dx = cx - x;
    const dy = cy - y;
    const distance = Math.hypot(dx, dy);
    const near = clamp(1 - distance / reach);
    dot.energy = useTouch ? ease(near) : near;
    const offset = useTouch
      ? (pull * dot.energy) / Math.max(pull, distance)
      : Math.min(pull, distance) / (distance || 1);
    dot.px = x + dx * offset;
    dot.py = y + dy * offset;
    if (useTouch ? dot.energy > 0.01 : distance < reach) {
      ctx.moveTo(x, y);
      ctx.lineTo(dot.px, dot.py);
    }
  }
  ctx.stroke();

  for (const dot of dots) {
    const radius = useTouch ? 1.35 + 8.5 * dot.energy ** 2 : 1.4 + 11 * dot.energy ** 2;
    ctx.fillStyle = colour(dot, radius, now);
    ctx.beginPath();
    ctx.arc(dot.px, dot.py, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function resize() {
  const bounds = stage.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
  const modeChanged = useTouch !== touchStory.matches;
  if (!modeChanged && bounds.width === width && bounds.height === height && nextDpr === dpr) return;
  if (modeChanged) pointer = undefined;
  useTouch = touchStory.matches;
  width = bounds.width;
  height = bounds.height;
  dpr = nextDpr;
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));

  const cols = Math.max(2, Math.round(width / spacing) + (useTouch ? 0 : 1));
  const rows = Math.max(2, Math.round(height / spacing) + (useTouch ? 0 : 1));
  dots.length = 0;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      dots.push({
        x: width * (useTouch ? (i + 0.5) / cols : i / (cols - 1)),
        y: height * (useTouch ? (j + 0.5) / rows : j / (rows - 1)),
        phase: i * 0.71 + j * 0.52,
      });
    }
  }
  draw(window.__reduced ? 6000 : performance.now());
}

function point(event) {
  if (!event.isPrimary || !width || !height) return;
  const bounds = stage.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / width;
  const y = (event.clientY - bounds.top) / height;
  pointer = { x: useTouch ? clamp(x) : x, y: useTouch ? clamp(y) : y, at: performance.now() };
}

function frame(now) {
  if (useTouch) {
    // Cap the delta when a tab resumes so the visible cloud never jumps ahead.
    const dt = previousTime === undefined ? 16 : Math.min(32, now - previousTime);
    elapsed += dt;
    const x = 0.5 + 0.34 * Math.sin(elapsed / 4900);
    const y = 0.51 + 0.28 * Math.sin(elapsed / 5900 + 0.55);
    const follow = pointer ? 1 - ease(clamp((now - pointer.at - 1250) / 1400)) : 0;
    const decay = 1 - Math.exp(-dt / 310);
    centre.x = mix(centre.x, mix(x, pointer?.x ?? x, follow), decay);
    centre.y = mix(centre.y, mix(y, pointer?.y ?? y, follow), decay);
  }
  previousTime = now;
  draw(now);
  frameId = window.vkRaf(frame);
}

if (ctx && stage) {
  resize();
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(stage);
  else window.addEventListener("resize", resize);
  touchStory.addEventListener("change", resize);
  if (!window.__reduced) {
    stage.addEventListener(
      "pointerdown",
      (event) => {
        if (useTouch && event.pointerType === "touch") point(event);
      },
      { passive: true },
    );
    window.addEventListener(
      "pointermove",
      (event) => {
        if (!useTouch || (event.pointerType === "touch" && stage.contains(event.target))) point(event);
      },
      { passive: true },
    );
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          if (!frameId) frameId = window.vkRaf(frame);
        } else {
          window.vkCancelRaf(frameId);
          frameId = 0;
          previousTime = undefined;
        }
      }).observe(stage);
    } else frameId = window.vkRaf(frame);
  }
}
