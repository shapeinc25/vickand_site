import { $, fx, ft } from "./svg.js";
import { labels, tagsTxt, notesTxt, ICONS, ICON_OF, checks } from "./data.js";

/* Phase 1: chips spread over an oval and get tangled up with curved links, tags and handwritten notes,
   while the AI checklist on the right ticks itself off.
   Returns the chips and every box they and the scribbles occupy (the layout keeps the panel clear of them). */
export function drawChaos({ rnd, rr, defs, lines, tags, notes, chips, items }) {
  // ---- shuffle labels; spread chips over a round blob, Game/App in the centre ----
  const L = labels.slice();
  for (let i = L.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [L[i], L[j]] = [L[j], L[i]];
  }
  const CX = 395,
    CY = 275,
    CENTER = 0,
    RX = 335,
    RY = 250;
  const nodes = [{ i: 0, label: "Game/App", x: CX, y: CY, w: 54, h: 16 }];
  L.forEach((label, k) => {
    const r = Math.sqrt((k + 1.5) / (L.length + 1.5)),
      th = k * 2.399963 + rr(-0.25, 0.25);
    nodes.push({
      i: k + 1,
      label,
      x: CX + RX * r * Math.cos(th) + rr(-12, 12),
      y: CY + RY * r * Math.sin(th) + rr(-12, 12),
      w: Math.max(54, label.length * 4.5 + 26),
      h: 16,
    });
  });
  // relax: push overlapping chips apart, keep everything inside the oval
  for (let it = 0; it < 400; it++) {
    for (let a = 0; a < nodes.length; a++)
      for (let b = a + 1; b < nodes.length; b++) {
        const A = nodes[a],
          B = nodes[b],
          dx = B.x - A.x,
          dy = B.y - A.y;
        const ox = (A.w + B.w) / 2 + 10 - Math.abs(dx),
          oy = (A.h + B.h) / 2 + 13 - Math.abs(dy);
        if (ox > 0 && oy > 0) {
          const ma = a === 0 ? 0 : 0.5,
            mb = a === 0 ? 1 : 0.5; // centre chip stays put
          if (ox < oy) {
            const s = (dx >= 0 ? 1 : -1) * ox;
            A.x -= s * ma;
            B.x += s * mb;
          } else {
            const s = (dy >= 0 ? 1 : -1) * oy;
            A.y -= s * ma;
            B.y += s * mb;
          }
        }
      }
    nodes.forEach((n) => {
      if (n.i === 0) return;
      const ux = (n.x - CX) / RX,
        uy = (n.y - CY) / RY,
        d = Math.hypot(ux, uy);
      if (d > 1) {
        n.x = CX + (n.x - CX) / d;
        n.y = CY + (n.y - CY) / d;
      }
    });
  }
  const N = nodes.length;

  // occupied boxes: chip text areas + every scribble placed later, so nothing overlaps
  const occ = nodes.map((n) => ({ x: n.x, y: n.y, w: n.w + 8, h: n.h + 8 }));
  const free = (r) =>
    r.x - r.w / 2 > 4 &&
    r.x + r.w / 2 < 796 &&
    r.y - r.h / 2 > -10 &&
    r.y + r.h / 2 < 570 &&
    occ.every((o) => Math.abs(o.x - r.x) * 2 >= o.w + r.w || Math.abs(o.y - r.y) * 2 >= o.h + r.h);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ---- edges: nearest neighbours + a few long links ----
  const ekeys = new Set(),
    edges = [];
  function addEdge(a, b) {
    if (a === b) return false;
    const k = a < b ? a + "-" + b : b + "-" + a;
    if (ekeys.has(k)) return false;
    ekeys.add(k);
    edges.push({ a, b });
    return true;
  }
  nodes.forEach((n) => {
    const near = nodes.filter((m) => m !== n).sort((p, q) => dist(n, p) - dist(n, q));
    const k = 3 + (rnd() < 0.6 ? 1 : 0);
    for (let q = 0; q < k; q++) addEdge(n.i, near[q].i);
  });
  for (let q = 0, added = 0; q < 500 && added < 50; q++) {
    const a = Math.floor(rnd() * N),
      b = Math.floor(rnd() * N),
      d = dist(nodes[a], nodes[b]);
    if (d > 130 && d < 460 && addEdge(a, b)) added++;
  }

  const adj = nodes.map(() => []);
  edges.forEach((e) => {
    adj[e.a].push(e.b);
    adj[e.b].push(e.a);
  });

  // ---- BFS from the centre: the tree decides when each chip appears ----
  const tn = new Array(N).fill(null),
    plan = [];
  const used = new Set();
  const key = (a, b) => (a < b ? a + "-" + b : b + "-" + a);
  const durFor = (a, b) => +(0.45 + dist(nodes[a], nodes[b]) / 420 + rnd() * 0.25).toFixed(2);
  const arr = [];
  arr[CENTER] = { start: 0.1, dur: 0.95 };
  tn[CENTER] = 1.1;
  const queue = [CENTER];
  let visited = 1;
  while (visited < N) {
    if (!queue.length) {
      // safety: connect any stranded node to its nearest visited one
      let best = null;
      for (let v = 0; v < N; v++)
        if (tn[v] === null)
          for (let u = 0; u < N; u++)
            if (tn[u] !== null) {
              const d = dist(nodes[u], nodes[v]);
              if (!best || d < best.d) best = { u, v, d };
            }
      addEdge(best.u, best.v);
      adj[best.u].push(best.v);
      adj[best.v].push(best.u);
      queue.push(best.u);
    }
    const u = queue.shift();
    const nb = adj[u].filter((v) => tn[v] === null).sort((p, q) => dist(nodes[u], nodes[p]) - dist(nodes[u], nodes[q]));
    nb.forEach((v) => {
      const start = tn[u] + rr(0.05, 0.35),
        dur = durFor(u, v);
      tn[v] = start + dur;
      arr[v] = { start, dur };
      visited++;
      queue.push(v);
      used.add(key(u, v));
      plan.push({ a: u, b: v, start, dur, tree: true });
    });
  }
  // remaining links bloom later -> chaos
  edges.forEach((e) => {
    if (used.has(key(e.a, e.b))) return;
    let a = e.a,
      b = e.b;
    if (tn[a] > tn[b]) {
      [a, b] = [b, a];
    }
    const start = Math.min(9.4, Math.max(tn[a], tn[b]) + rr(0.1, 1.5));
    plan.push({ a, b, start, dur: durFor(a, b), tree: false });
  });

  // ---- geometry helpers ----
  function clip(n, dx, dy) {
    const hw = n.w / 2 + 3,
      hh = n.h / 2 + 4;
    const kx = dx === 0 ? Infinity : hw / Math.abs(dx),
      ky = dy === 0 ? Infinity : hh / Math.abs(dy);
    const k = Math.min(kx, ky);
    return { x: n.x + dx * k, y: n.y + dy * k };
  }
  const bz = (P, t) => {
    const u = 1 - t;
    return {
      x: u * u * u * P.x0 + 3 * u * u * t * P.c1x + 3 * u * t * t * P.c2x + t * t * t * P.x1,
      y: u * u * u * P.y0 + 3 * u * u * t * P.c1y + 3 * u * t * t * P.c2y + t * t * t * P.y1,
    };
  };

  // ---- draw edges ----
  const mids = [];
  plan.forEach((e, idx) => {
    const A = nodes[e.a],
      B = nodes[e.b];
    const dx = B.x - A.x,
      dy = B.y - A.y;
    const p0 = clip(A, dx, dy),
      p1 = clip(B, -dx, -dy);
    const vx = p1.x - p0.x,
      vy = p1.y - p0.y,
      vl = Math.hypot(vx, vy) || 1,
      nx = -vy / vl,
      ny = vx / vl;
    const sgn = rnd() < 0.5 ? -1 : 1,
      o1 = sgn * vl * rr(0.1, 0.34),
      o2 = (rnd() < 0.3 ? -1 : 1) * sgn * vl * rr(0.05, 0.3);
    const P = {
      x0: p0.x,
      y0: p0.y,
      x1: p1.x,
      y1: p1.y,
      c1x: p0.x + vx / 3 + nx * o1,
      c1y: p0.y + vy / 3 + ny * o1,
      c2x: p0.x + (vx * 2) / 3 + nx * o2,
      c2y: p0.y + (vy * 2) / 3 + ny * o2,
    };
    const d = `M${fx(P.x0)},${fx(P.y0)} C${fx(P.c1x)},${fx(P.c1y)} ${fx(P.c2x)},${fx(P.c2y)} ${fx(P.x1)},${fx(P.y1)}`;
    const dashed = !e.tree && rnd() < 0.5;
    rnd(); // (keeps the layout identical to before)
    const st = `--d:${ft(e.start)}s;--dur:${e.dur}s;--d2:${ft(e.start + e.dur)}s`;
    const mk = $(
      "mask",
      {
        id: "tfm" + idx,
        maskUnits: "userSpaceOnUse",
        x: fx(Math.min(P.x0, P.c1x, P.c2x, P.x1) - 8),
        y: fx(Math.min(P.y0, P.c1y, P.c2y, P.y1) - 8),
        width: fx(Math.max(P.x0, P.c1x, P.c2x, P.x1) - Math.min(P.x0, P.c1x, P.c2x, P.x1) + 16),
        height: fx(Math.max(P.y0, P.c1y, P.c2y, P.y1) - Math.min(P.y0, P.c1y, P.c2y, P.y1) + 16),
      },
      defs,
    );
    $("path", { class: "ln mk", d, pathLength: 1, style: st }, mk);
    $("path", { class: "ld", d, mask: "url(#tfm" + idx + ")" }, lines);
    if (!dashed) $("path", { class: "fl", d, style: st }, lines);

    mids.push({ P, nx, ny, delay: e.start + e.dur * 0.55 });
    if (rnd() < (e.tree ? 0.9 : 0.6)) {
      const txt = tagsTxt[(idx * 7 + 3) % tagsTxt.length],
        w = txt.length * 3.7 + 9;
      for (const tm of [0.5, 0.42, 0.58, 0.35, 0.65, 0.3, 0.7]) {
        const mp = bz(P, tm),
          rect = { x: mp.x, y: mp.y, w: w + 3, h: 12 };
        if (!free(rect)) continue;
        occ.push(rect);
        const o = $("g", { transform: `translate(${fx(mp.x)},${fx(mp.y)})` }, tags);
        const g = $("g", { class: "tag", style: `--d:${ft(e.start + e.dur * tm + 0.1)}s` }, o);
        const i2 = $("g", {}, g);
        $("rect", { x: -w / 2, y: -4.5, width: w, height: 9, rx: 4.5 }, i2);
        $("text", { x: 0, y: 2.1 }, i2).textContent = txt;
        break;
      }
    }
  });

  // ---- handwritten notes and warning marks scattered over the mess ----
  // find a free spot beside some line: never on a chip's text or on another scribble
  function spot(w, h, offs) {
    const ms = [...mids].sort(() => rnd() - 0.5);
    for (const m of ms)
      for (const t of [0.5, 0.4, 0.6, 0.32, 0.68])
        for (const off of offs)
          for (const sd of [1, -1]) {
            const p = bz(m.P, t),
              x = p.x + m.nx * off * sd,
              y = p.y + m.ny * off * sd,
              r = { x, y, w: w + 3, h: h + 3 };
            if (free(r)) {
              occ.push(r);
              return { x, y, m };
            }
          }
    return null;
  }
  notesTxt.forEach((t) => {
    const nw = t.length * 4.7 + 10;
    const s = spot(nw, 14, [12, 18]);
    if (!s) return;
    const o = $("g", { transform: `translate(${fx(s.x)},${fx(s.y)}) rotate(${fx(rr(-8, 8))})` }, notes);
    const g = $("g", { class: "note", style: `--d:${ft(Math.max(s.m.delay, 3) + rr(0.5, 2.5))}s` }, o);
    $("rect", { x: -nw / 2, y: -7, width: nw, height: 14, rx: 4 }, g);
    $("text", { x: 0, y: 3 }, g).textContent = t;
  });

  // ---- chips on top ----
  nodes.forEach((n) => {
    const isC = n.i === CENTER;
    const o = $("g", { transform: `translate(${fx(n.x)},${fx(n.y)})` }, chips);
    const a = arr[n.i] || { start: 0.1, dur: 1 };
    const g = $("g", { class: "chip" + (isC ? " start" : ""), style: `--d:${ft(a.start + a.dur)}s` }, o);
    const inner = $("g", {}, g);
    $("rect", { x: -n.w / 2, y: -n.h / 2, width: n.w, height: n.h, rx: n.h / 2 }, inner);
    if (isC) {
      $("text", { x: 0, y: 2.9, style: "text-anchor:middle" }, inner).textContent = n.label;
    } else {
      const ic = $("g", { class: "ic", transform: `translate(${fx(-n.w / 2 + 7)},-4.2) scale(.35)` }, inner);
      ic.innerHTML = ICONS[ICON_OF[n.label]] || "";
      $("text", { x: fx(-n.w / 2 + 18), y: 2.9 }, inner).textContent = n.label;
    }
  });
  $("circle", { class: "ring", cx: CX, cy: CY, r: 10, style: "--d:1.0s" }, chips);

  // ---- AI list: app & game development steps ----
  const y0 = 214,
    gap = 21;
  // every row is drawn in the top slot and slid down by its own keyframes (built below)
  const slots = [];
  const mkWrap = (start) => {
    const el = $("g", { class: "slot" }, items);
    slots.push({ el, start });
    return el;
  };
  checks.forEach((txt, i) => {
    const t = (1.6 + i * 0.8).toFixed(2),
      w = 1.2,
      c = (1.6 + i * 0.8 + w).toFixed(2),
      y = y0;
    const g = $("g", { class: "it", style: `--t:${t}s;--w:${w}s;--c:${c}s` }, mkWrap(1.6 + i * 0.8));
    $("circle", { cx: 846, cy: y, r: 4.5, fill: "none", stroke: "#5a5454", "stroke-width": 1 }, g);
    $("circle", { class: "spin", cx: 846, cy: y, r: 4.5 }, g);
    $("path", { class: "tick", d: `M843.2,${y} l2,2.2 l3.4,-4.2` }, g);
    $("text", { x: 856, y: y + 3 }, g).textContent = txt;
  });
  // ---- each new step lands on top and pushes everything below it down one slot ----
  (function () {
    const P = checks.map((_, j) => 1.6 + j * 0.8),
      D = P[P.length - 1] + 0.6;
    let css = "";
    slots.forEach((s, idx) => {
      let kf = "0%{transform:translateY(0)}",
        k = 0;
      P.filter((p) => p > s.start + 0.01).forEach((p) => {
        kf += `${((p / D) * 100).toFixed(2)}%{transform:translateY(${k * gap}px)}${(((p + 0.35) / D) * 100).toFixed(2)}%{transform:translateY(${(k + 1) * gap}px)}`;
        k++;
      });
      kf += `100%{transform:translateY(${k * gap}px)}`;
      css += `@keyframes tfmv${idx}{${kf}}.ux-hero .run .slot.s${idx}{animation:tfmv${idx} ${D.toFixed(2)}s cubic-bezier(.4,0,.2,1) forwards}`;
      s.el.setAttribute("class", "slot s" + idx);
    });
    const st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);
  })();

  return { nodes, occ };
}
