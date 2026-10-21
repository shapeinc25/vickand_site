(function () {
  const NS = "http://www.w3.org/2000/svg";
  const $ = (t, a = {}, p) => {
    const e = document.createElementNS(NS, t);
    for (const k in a) e.setAttribute(k, a[k]);
    if (p) p.appendChild(e);
    return e;
  };
  const G = (id) => document.getElementById(id);
  const panel = G("ux-panel"),
    lines = G("ux-lines"),
    arrows = G("ux-arrows"),
    tags = G("ux-tags"),
    notes = G("ux-notes"),
    chips = G("ux-chips"),
    items = G("ux-items"),
    stage = G("ux-stage");

  const defs = $("defs", {}, stage);
  let seed = 5;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const rr = (a, b) => a + rnd() * (b - a);
  const fx = (n) => n.toFixed(1),
    ft = (n) => n.toFixed(2);

  const labels = [
    "Splash",
    "Onboarding",
    "Sign In",
    "Sign Up",
    "Reset Pass",
    "Permissions",
    "Notifications",
    "Home",
    "Settings",
    "Profile",
    "Search",
    "Filters",
    "Shop",
    "Item Details",
    "Payment",
    "Cancellation",
    "Subscription",
    "Manage Plan",
    "Offer",
    "Map",
    "Level Select",
    "Level",
    "Pause",
    "Daily Reward",
    "Achievements",
    "Leaderboard",
    "Friends",
    "Social",
    "Events",
    "Roadmap",
    "News",
    "Tooltip",
    "Support",
    "FAQ",
    "Contact",
    "Transaction",
    "Paywall",
    "Checkout",
    "Inventory",
    "Matchmaking",
    "Lobby",
    "Avatar",
    "Chat",
    "Referral",
    "Wallet",
    "Receipts",
    "Season Pass",
    "Promo Codes",
  ];
  const tagsTxt = [
    "auth",
    "token",
    "retry",
    "cache",
    "webhook",
    "consent",
    "A/B test",
    "push",
    "deeplink",
    "sync",
    "validate",
    "redirect",
    "OTP",
    "session",
    "rate limit",
    "fallback",
    "analytics",
    "queue",
    "refresh",
    "2FA",
    "promo",
    "invoice",
    "receipt",
    "ads",
    "cooldown",
    "save",
    "merge",
    "verify",
    "email",
    "timeout",
    "offline",
    "rollback",
    "cohort",
    "flag",
    "restore",
    "claim",
    "unlock",
  ];
  const notesTxt = [
    "Needed?",
    "Back?",
    "Too many options?",
    "Extra step…",
    "No results?",
    "Didn't receive?",
    "Confusing…",
    "Need to unlock first?",
    "Payment failed?",
    "Still trying to cancel?",
    "Not loading?",
    "Where was this again?",
  ];

  // ---- tiny line icons (24x24 grid), one per chip ----
  const ICONS = {
    game: '<path d="M6 8h12a4 4 0 0 1 4 4v2a3 3 0 0 1-5 2l-1-2H8l-1 2a3 3 0 0 1-5-2v-2a4 4 0 0 1 4-4z"/><path d="M8 10.5v3M6.5 12h3M16 11.5v.5M18 13v.5"/>',
    star: '<path d="M12 3l2.5 6 6.5.5-5 4.5 1.5 6.5-5.5-3.5-5.5 3.5L8 14 3 9.5 9.5 9z"/>',
    next: '<path d="M4 12h14M13 6l6 6-6 6"/>',
    login: '<path d="M10 17l5-5-5-5M15 12H3M14 4h6v16h-6"/>',
    userplus: '<circle cx="10" cy="7" r="4"/><path d="M3 20c0-4 3-6 7-6s7 2 7 6M19 8v6M16 11h6"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-3-6.2M20 4v5h-5"/>',
    shield: '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    bell: '<path d="M6 17v-6a6 6 0 0 1 12 0v6l2 2H4z"/><path d="M10 21h4"/>',
    home: '<path d="M3 11l9-8 9 8M5 10v11h14V10M10 21v-6h4v6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="M15 15l6 6"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4-2v-4z"/>',
    bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    cancel: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
    crown: '<path d="M3 8l4 4 5-7 5 7 4-4v11H3z"/>',
    sliders:
      '<circle cx="16" cy="7" r="2.5"/><circle cx="8" cy="17" r="2.5"/><path d="M3 7h10.5M18.5 7H21M3 17h2.5M10.5 17H21"/>',
    percent: '<circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/><path d="M19 5L5 19"/>',
    map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    play: '<path d="M7 4v16l13-8z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    gift: '<rect x="3" y="10" width="18" height="11"/><path d="M3 7h18v3H3zM12 7v14M12 7c-3-4-6-1-4 0M12 7c3-4 6-1 4 0"/>',
    trophy:
      '<path d="M8 4h8v6a4 4 0 0 1-8 0z"/><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 14v4M8 21h8"/>',
    podium: '<path d="M3 21v-7h6v7M9 21V8h6v13M15 21v-9h6v9"/>',
    users:
      '<circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="3"/><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5M17 14.5c3 0 5 1.5 5 4.5"/>',
    heart: '<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    flag: '<path d="M5 21V4M5 5h12l-3 4 3 4H5"/>',
    mega: '<path d="M3 10v4h4l8 4V6L7 10z"/><path d="M18 9a4 4 0 0 1 0 6"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z"/>',
    headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H4zM17 14h3v5h-3z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 5 0c0 2-2.5 2-2.5 4M12 17v.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    swap: '<path d="M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    vs: '<circle cx="6" cy="12" r="3"/><circle cx="18" cy="12" r="3"/><path d="M9 12h6"/>',
    door: '<path d="M5 21V3h10v18M3 21h18M12 12v.5"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M9 10v.5M15 10v.5M8 14a5 5 0 0 0 8 0"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1-1"/>',
    wallet: '<path d="M3 7h16a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2z"/><path d="M3 7l12-3v3M16 14h2"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    ticket: '<path d="M3 8h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z"/><path d="M13 8v10"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><path d="M7 8v.5"/>',
  };
  const ICON_OF = {
    "Game/App": "game",
    Splash: "star",
    Onboarding: "next",
    "Sign In": "login",
    "Sign Up": "userplus",
    "Reset Pass": "refresh",
    Permissions: "shield",
    Notifications: "bell",
    Home: "home",
    Settings: "gear",
    Profile: "user",
    Search: "search",
    Filters: "filter",
    Shop: "bag",
    "Item Details": "info",
    Payment: "card",
    Cancellation: "cancel",
    Subscription: "crown",
    "Manage Plan": "sliders",
    Offer: "percent",
    Map: "map",
    "Level Select": "layers",
    Level: "play",
    Pause: "pause",
    "Daily Reward": "gift",
    Achievements: "trophy",
    Leaderboard: "podium",
    Friends: "users",
    Social: "heart",
    Events: "calendar",
    Roadmap: "flag",
    News: "mega",
    Tooltip: "bulb",
    Support: "headset",
    FAQ: "help",
    Contact: "mail",
    Transaction: "swap",
    Paywall: "lock",
    Checkout: "check",
    Inventory: "box",
    Matchmaking: "vs",
    Lobby: "door",
    Avatar: "smile",
    Chat: "chat",
    Referral: "link",
    Wallet: "wallet",
    Receipts: "receipt",
    "Season Pass": "ticket",
    "Promo Codes": "tag",
  };

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
    done = [],
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
      dy = B.y - A.y,
      len = Math.hypot(dx, dy);
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
  const checks = [
    "Concept & game design doc",
    "Wireframes & screen map",
    "UI / art design",
    "Prototype",
    "Core loop & gameplay",
    "Backend & APIs",
    "Monetization & IAP",
    "QA & playtesting",
  ];
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

  // ================= phase 2: clean flows + UX box =================
  const cl = G("ux-cl"),
    panelG = G("ux-panel");
  ICON_OF["Welcome"] = "star";
  ICON_OF["Sign in"] = "login";
  ICON_OF["Rewards"] = "gift";
  ICON_OF["Level select"] = "layers";
  ICON_OF["Item details"] = "info";
  const CX_ = [70, 195, 320, 445, 570, 695],
    TOP = 150,
    SP = 54,
    TY = 105;
  const TOPROW = [
    ["Game/App", "Game/App", "Open"],
    ["Splash", "Splash", "Continue"],
    ["Onboarding", "Onboarding", "Get started"],
    ["Sign up", "Sign Up", "Log in"],
    ["Sign in", "Sign In", "Continue"],
    ["Home", "Home", null],
  ];
  const COLS = [
    {
      e: "Play",
      items: [
        ["Map", "Map"],
        ["Level select", "Level Select"],
        ["Tooltip", "Tooltip"],
        ["Level", "Level"],
        ["Pause", "Pause"],
        ["Inventory", "Inventory"],
      ],
      tags: ["Choose", "See tips", "Start", "Pause", "Open bag"],
    },
    {
      e: "Rewards",
      items: [
        ["Daily reward", "Daily Reward"],
        ["Achievements", "Achievements"],
        ["Season pass", "Season Pass"],
        ["Promo codes", "Promo Codes"],
        ["Events", "Events"],
        ["News", "News"],
        ["Roadmap", "Roadmap"],
      ],
      tags: ["Earn", "Unlock", "Redeem", "Join", "Read", "Preview"],
    },
    {
      e: "Shop",
      items: [
        ["Shop", "Shop"],
        ["Search", "Search"],
        ["Filters", "Filters"],
        ["Item details", "Item Details"],
        ["Checkout", "Checkout"],
        ["Payment", "Payment"],
        ["Transaction", "Transaction"],
        ["Receipts", "Receipts"],
      ],
      tags: ["Search", "Filter", "Select", "Add to cart", "Pay now", "Confirm", "Get receipt"],
    },
    {
      e: "Friends",
      items: [
        ["Friends", "Friends"],
        ["Social", "Social"],
        ["Chat", "Chat"],
        ["Matchmaking", "Matchmaking"],
        ["Lobby", "Lobby"],
        ["Leaderboard", "Leaderboard"],
        ["Referral", "Referral"],
      ],
      tags: ["Connect", "Message", "Play together", "Join", "Rank", "Invite"],
    },
    {
      e: "Account",
      items: [
        ["Profile", "Profile"],
        ["Avatar", "Avatar"],
        ["Settings", "Settings"],
        ["Notifications", "Notifications"],
        ["Permissions", "Permissions"],
        ["Reset password", "Reset Pass"],
        ["Wallet", "Wallet"],
      ],
      tags: ["Customize", "Open", "Alerts", "Allow", "Secure", "Add funds"],
    },
    {
      e: "Plans",
      items: [
        ["Offer", "Offer"],
        ["Paywall", "Paywall"],
        ["Subscription", "Subscription"],
        ["Manage plan", "Manage Plan"],
        ["Cancellation", "Cancellation"],
        ["Support", "Support"],
        ["FAQ", "FAQ"],
        ["Contact", "Contact"],
      ],
      tags: ["Upgrade", "Subscribe", "Manage", "Cancel", "Need help?", "Browse", "Contact us"],
    },
  ];
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

  // UX box (light, like the site's light background): tasks are checked off as the structure comes together
  const UXT = [
    "UX audit",
    "Usability review",
    "Flows & onboarding review",
    "Identify problems",
    "Map user journeys",
    "Remove duplicate steps",
    "Simplify navigation",
    "Clarify button wording",
    "Test with real users",
  ];
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
  window.__archEnd = archEnd;

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
    still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
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
