// The UX story's dot field follows one slowly moving centre, with softer motion farther away.
const canvas = document.getElementById("ux-dots");
const stage = canvas?.parentElement;
const ctx = canvas?.getContext("2d");
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
let width = 0;
let height = 0;
let dpr = 1;
let frameId = 0;
let previousTime;
let elapsed = 0;

const clamp = (value) => Math.max(0, Math.min(1, value));
const ease = (t) => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;

function draw() {
  const cx = centre.x * width;
  const cy = centre.y * height;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,.07)";
  ctx.beginPath();
  for (const dot of dots) {
    const x = dot.x + 6 * Math.sin(elapsed / 2600 + dot.phase);
    const y = dot.y + 5 * Math.cos(elapsed / 3100 + dot.phase);
    const dx = cx - x;
    const dy = cy - y;
    const distance = Math.hypot(dx, dy);
    dot.energy = ease(clamp(1 - distance / reach));
    const offset = (pull * dot.energy) / Math.max(pull, distance);
    dot.px = x + dx * offset;
    dot.py = y + dy * offset;
    if (dot.energy > 0.01) {
      ctx.moveTo(x, y);
      ctx.lineTo(dot.px, dot.py);
    }
  }
  ctx.stroke();

  for (const dot of dots) {
    const strength = dot.energy;
    if (strength) {
      const phase = elapsed / 4200 + dot.phase * 0.7 + strength;
      const band = (0.5 - 0.5 * Math.cos(phase)) * (palette.length - 1);
      const index = Math.min(palette.length - 2, Math.floor(band));
      const tone = ease(strength);
      const [r, g, b] = palette[index].map((channel, i) =>
        Math.round(mix(211, mix(channel, palette[index + 1][i], band - index), tone)),
      );
      ctx.fillStyle = `rgba(${r},${g},${b},${0.21 + 0.58 * strength})`;
    } else ctx.fillStyle = "rgba(211,211,211,.21)";
    ctx.beginPath();
    ctx.arc(dot.px, dot.py, 1.35 + 8.5 * strength * strength, 0, Math.PI * 2);
    ctx.fill();
  }
}

function resize() {
  const bounds = stage.getBoundingClientRect();
  const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
  if (bounds.width === width && bounds.height === height && nextDpr === dpr) return;
  width = bounds.width;
  height = bounds.height;
  dpr = nextDpr;
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));

  const cols = Math.max(2, Math.round(width / spacing));
  const rows = Math.max(2, Math.round(height / spacing));
  dots.length = 0;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      dots.push({ x: (width * (i + 0.5)) / cols, y: (height * (j + 0.5)) / rows, phase: i * 0.71 + j * 0.52 });
    }
  }
  draw();
}

function point(event) {
  if (!event.isPrimary || !width || !height) return;
  const bounds = stage.getBoundingClientRect();
  pointer = {
    x: clamp((event.clientX - bounds.left) / width),
    y: clamp((event.clientY - bounds.top) / height),
    at: performance.now(),
  };
}

function frame(now) {
  // Cap the delta when a tab resumes so the visible cloud never jumps ahead.
  const dt = previousTime === undefined ? 16 : Math.min(32, now - previousTime);
  previousTime = now;
  elapsed += dt;
  const x = 0.5 + 0.34 * Math.sin(elapsed / 4900);
  const y = 0.51 + 0.28 * Math.sin(elapsed / 5900 + 0.55);
  const follow = pointer ? 1 - ease(clamp((now - pointer.at - 1250) / 1400)) : 0;
  const decay = 1 - Math.exp(-dt / 310);
  centre.x = mix(centre.x, mix(x, pointer?.x ?? x, follow), decay);
  centre.y = mix(centre.y, mix(y, pointer?.y ?? y, follow), decay);
  draw();
  frameId = window.vkRaf(frame);
}

if (ctx && stage) {
  resize();
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(stage);
  else window.addEventListener("resize", resize);
  if (!window.__reduced) {
    stage.addEventListener("pointerdown", point, { passive: true });
    stage.addEventListener("pointermove", point, { passive: true });
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
