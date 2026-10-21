import { $, fx, ft } from "./svg.js";
import { ICONS, ICON_OF, TOPROW, COLS, UXT } from "./data.js";

const CX_ = [70, 195, 320, 445, 570, 695],
  TOP = 150,
  SP = 54,
  TY = 105;

/* Phase 2: every tangled chip flies to its place in clean columns joined by straight, labelled connectors,
   and the UX box replaces the AI checklist. Returns the clean chips (for the layout). */
export function drawUntangle({ nodes, defs, chips, cl, panelG }) {
  const CL = [];
  TOPROW.forEach((t, i) => CL.push({ k: "t" + i, label: t[0], old: t[1], x: CX_[i], y: 45, start: i === 0 }));
  COLS.forEach((col, ci) =>
    col.items.forEach((it, ri) =>
      CL.push({ k: "c" + ci + "_" + ri, label: it[0], old: it[1], x: CX_[ci], y: TOP + ri * SP }),
    ),
  );
  const CK = {};
  CL.forEach((c, i) => {
    c.w = Math.max(54, c.label.length * 4.5 + 26);
    c.h = 16;
    c.i = i;
    c.arr = 0.05 + i * 0.06 + 0.8;
    CK[c.k] = c;
  });
  // every old chip lives on: it hides instantly and its clean twin (same look) leaves from the same spot
  const oldByLabel = {};
  nodes.forEach((n) => (oldByLabel[n.label] = n));
  nodes.forEach((n, i) => {
    const g = chips.children[i] && chips.children[i].firstChild;
    if (g) g.classList.add("map");
  });
  CL.forEach((c) => {
    const o = oldByLabel[c.old];
    const og = $("g", { transform: `translate(${fx(c.x)},${fx(c.y)})` }, cl);
    const g = $(
      "g",
      {
        class: "cl-chip" + (c.start ? " start" : ""),
        style: `--fx:${fx(o.x - c.x)}px;--fy:${fx(o.y - c.y)}px;--d:${ft(c.arr - 0.8)}s`,
      },
      og,
    );
    const inner = $("g", {}, g);
    $("rect", { x: -c.w / 2, y: -c.h / 2, width: c.w, height: c.h, rx: c.h / 2 }, inner);
    if (c.start) $("text", { x: 0, y: 2.9, style: "text-anchor:middle" }, inner).textContent = c.label;
    else {
      const ic = $("g", { class: "ic", transform: `translate(${fx(-c.w / 2 + 7)},-4.2) scale(.35)` }, inner);
      ic.innerHTML = ICONS[ICON_OF[c.old]] || "";
      $("text", { x: fx(-c.w / 2 + 18), y: 2.9 }, inner).textContent = c.label;
    }
  });
  // connectors: dashed, 1px, drawn on through a mask the moment the chip they lead to has arrived
  let cn = 0,
    archEnd = 0;
  function connect(pts, start, dur, label, arrow) {
    archEnd = Math.max(archEnd, start + dur + (label ? 0.35 : 0));
    const d = "M" + pts.map((p) => fx(p[0]) + "," + fx(p[1])).join(" L");
    const xs = pts.map((p) => p[0]),
      ys = pts.map((p) => p[1]);
    const mk = $(
      "mask",
      {
        id: "clm" + cn,
        maskUnits: "userSpaceOnUse",
        x: fx(Math.min(...xs) - 8),
        y: fx(Math.min(...ys) - 8),
        width: fx(Math.max(...xs) - Math.min(...xs) + 16),
        height: fx(Math.max(...ys) - Math.min(...ys) + 16),
      },
      defs,
    );
    const st = `--d:${ft(start)}s;--dur:${dur}s`;
    $("path", { class: "cl-mk", d, pathLength: 1, style: st }, mk);
    $("path", { class: "cl-ld", d, mask: `url(#clm${cn})` }, cl);
    cn++;
    const a = pts[pts.length - 2],
      b = pts[pts.length - 1],
      ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    if (arrow) {
      const ag = $("g", { transform: `translate(${fx(b[0])},${fx(b[1])}) rotate(${fx((ang * 180) / Math.PI)})` }, cl);
      $("path", { class: "cl-arr", d: "M-5,-3 L0,0 L-5,3 Z", style: `--d:${ft(start + dur)}s` }, ag);
    }
    if (label) {
      const w = label.length * 3.9 + 10,
        off = arrow ? -2 : 0,
        mx = (a[0] + b[0]) / 2 + Math.cos(ang) * off,
        my = (a[1] + b[1]) / 2 + Math.sin(ang) * off;
      const tg = $("g", { transform: `translate(${fx(mx)},${fx(my)})` }, cl);
      const t = $("g", { class: "cl-tag", style: `--d:${ft(start + dur * 0.6)}s` }, tg);
      $("rect", { x: -w / 2, y: -5.5, width: w, height: 11, rx: 5.5 }, t);
      $("text", { x: 0, y: 2.3 }, t).textContent = label;
    }
  }
  const RE = (c) => c.x + c.w / 2 + 2,
    LE = (c) => c.x - c.w / 2 - 2,
    TE = (c) => c.y - c.h / 2 - 3,
    BE = (c) => c.y + c.h / 2 + 2;
  for (let i = 0; i < TOPROW.length - 1; i++) {
    const A = CK["t" + i],
      Bc = CK["t" + (i + 1)];
    connect(
      [
        [RE(A), A.y],
        [LE(Bc) - 1, Bc.y],
      ],
      Math.max(A.arr, Bc.arr),
      0.3,
      TOPROW[i][2],
      true,
    );
  }
  const H = CK["t5"],
    tS = H.arr,
    tD = 0.9,
    tLen = TY - H.y - 10 + (CX_[5] - CX_[0]);
  connect(
    [
      [H.x, H.y + 10],
      [H.x, TY],
      [CX_[0], TY],
    ],
    tS,
    tD,
    null,
    false,
  );
  COLS.forEach((col, ci) => {
    const first = CK["c" + ci + "_0"],
      reach = tS + (tD * (TY - H.y - 10 + (CX_[5] - CX_[ci]))) / tLen;
    connect(
      [
        [first.x, TY],
        [first.x, TE(first)],
      ],
      Math.max(first.arr, reach),
      0.3,
      col.e,
      true,
    );
    col.tags.forEach((tg, k) => {
      const A = CK["c" + ci + "_" + k],
        Bc = CK["c" + ci + "_" + (k + 1)];
      connect(
        [
          [A.x, BE(A)],
          [Bc.x, TE(Bc)],
        ],
        Math.max(A.arr, Bc.arr),
        0.3,
        tg,
        true,
      );
    });
  });

  const ux = $("g", { id: "ux-uxwrap" }, panelG),
    uxb = $("g", { id: "ux-uxbox" }, ux);
  $("rect", { class: "panel light", x: 832, y: 392, width: 158, height: 64 + UXT.length * 21 - 5, rx: 10 }, uxb);
  $("text", { class: "ai-title", x: 844, y: 418 }, uxb).textContent = "UX";
  $("text", { class: "ai-sub", x: 844, y: 430 }, uxb).textContent = "untangling the flows";
  $("line", { x1: 844, y1: 438, x2: 978, y2: 438, stroke: "#d3cfcf" }, uxb);
  const U0 = 0.5,
    UW = 1.2,
    UD = (archEnd + 0.1 - UW - U0) / (UXT.length - 1);
  UXT.forEach((txt, i) => {
    const t = (U0 + i * UD).toFixed(2),
      c = (U0 + i * UD + UW).toFixed(2),
      y = 456 + i * 21;
    const g = $("g", { class: "it2", style: `--t:${t}s;--w:${UW}s;--c:${c}s` }, uxb);
    $("circle", { cx: 846, cy: y, r: 4.5, fill: "none", stroke: "#bab5b5", "stroke-width": 1 }, g);
    $("circle", { class: "spin2", cx: 846, cy: y, r: 4.5 }, g);
    $("path", { class: "tick2", d: `M843.2,${y} l2,2.2 l3.4,-4.2` }, g);
    $("text", { x: 856, y: y + 3 }, g).textContent = txt;
  });

  return CL;
}
