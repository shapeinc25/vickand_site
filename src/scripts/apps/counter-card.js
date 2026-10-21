// Counter card: 3D tilt + a new brand colour on every hover, click to flip into a memory mini game
(function () {
  var wrap = document.querySelector(".soon-counter");
  if (!wrap) return;
  var card = wrap.querySelector(".soon-card"),
    front = wrap.querySelector(".soon-front"),
    back = wrap.querySelector(".soon-back");
  var tints = front.querySelectorAll(".soon-tint");
  var livesEl = back.querySelector(".soon-lives"),
    gridEl = back.querySelector(".soon-grid"),
    over = back.querySelector(".soon-over");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = window.matchMedia && window.matchMedia("(hover: none)").matches;

  // The 9 brand colours: orange, yellow, green, blue, purple and the four gradient mixes (Figma Brand collection)
  var COLORS = ["#ff5c00", "#e9e037", "#2ecf49", "#2f9de1", "#7a47d3", "#f49e1c", "#8bd740", "#2fb695", "#5572da"];
  function lum(hex) {
    var v = [1, 3, 5].map(function (i) {
      var c = parseInt(hex.substr(i, 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function fg(hex) {
    var l = lum(hex);
    return 1.05 / (l + 0.05) >= (l + 0.05) / 0.072 ? "#ffffff" : "#2c2929";
  } // best contrast: white or #2c2929

  // ----- hover: tilt + next colour -----
  var colorIdx = -1,
    layer = 0,
    gameIdx = -1;
  function pointerOK(e) {
    return e.pointerType !== "touch";
  }
  function nextColor() {
    colorIdx = (colorIdx + 1) % COLORS.length;
    var col = COLORS[colorIdx];
    layer = 1 - layer;
    tints[layer].style.background = col;
    tints[layer].classList.add("is-on");
    tints[1 - layer].classList.remove("is-on");
    front.style.color = fg(col);
    front.style.setProperty("--soon-fg", fg(col));
  }
  front.addEventListener("pointerenter", function (e) {
    if (touch || e.pointerType === "touch" || wrap.classList.contains("is-flipped") || auto.on) return;
    nextColor();
  });

  // Touch devices have no hover: the card tilts by itself every 150ms and changes colour every 1.43s
  var auto = { on: false, tilt: 0, color: 0, t: 0 };
  function autoStart() {
    if (auto.on || !touch || wrap.classList.contains("is-flipped")) return;
    auto.on = true;
    auto.t = 0;
    if (!reduce)
      auto.tilt = setInterval(function () {
        auto.t += 0.15;
        card.classList.add("is-tilting");
        card.style.setProperty("--ry", (Math.sin(auto.t * 2.1) * 9).toFixed(2) + "deg");
        card.style.setProperty("--rx", (Math.cos(auto.t * 2.9) * 7).toFixed(2) + "deg");
      }, 150);
    nextColor();
    auto.color = setInterval(nextColor, 1430);
  }
  function autoStop() {
    if (!auto.on) return;
    auto.on = false;
    clearInterval(auto.tilt);
    clearInterval(auto.color);
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--rx", "0deg");
    tints.forEach(function (t) {
      t.classList.remove("is-on");
    });
    front.style.color = "";
    front.style.removeProperty("--soon-fg");
  }
  // `touch` follows the (hover: none) media query live, so toggling device emulation (or a 2-in-1 switching mode) works without a reload
  var visible = true,
    hasIO = "IntersectionObserver" in window;
  function syncAuto() {
    if (touch && visible) autoStart();
    else autoStop();
  }
  if (hasIO) {
    visible = false;
    new IntersectionObserver(
      function (es) {
        visible = es[0].isIntersecting;
        syncAuto();
      },
      { threshold: 0.3 },
    ).observe(wrap);
  }
  var hoverMQ = window.matchMedia ? window.matchMedia("(hover: none)") : null;
  function onHoverChange() {
    touch = !!(hoverMQ && hoverMQ.matches);
    if (touch) {
      // drop any leftover desktop hover state, then let the automatic mode take over
      card.classList.remove("is-tilting");
      tints.forEach(function (t) {
        t.classList.remove("is-on");
      });
      front.style.color = "";
      front.style.removeProperty("--soon-fg");
    }
    syncAuto();
  }
  if (hoverMQ) {
    if (hoverMQ.addEventListener) hoverMQ.addEventListener("change", onHoverChange);
    else if (hoverMQ.addListener) hoverMQ.addListener(onHoverChange);
  }
  window.addEventListener("resize", onHoverChange);
  syncAuto();
  front.addEventListener("pointermove", function (e) {
    if (touch || !pointerOK(e) || reduce || wrap.classList.contains("is-flipped")) return;
    var r = wrap.getBoundingClientRect();
    var px = (e.clientX - r.left) / r.width - 0.5,
      py = (e.clientY - r.top) / r.height - 0.5;
    card.classList.add("is-tilting");
    card.style.setProperty("--ry", (px * 18).toFixed(2) + "deg");
    card.style.setProperty("--rx", (-py * 18).toFixed(2) + "deg");
  });
  front.addEventListener("pointerleave", function (e) {
    if (touch || e.pointerType === "touch") return; // touch has no hover: the automatic tilt and colour keep running
    card.classList.remove("is-tilting");
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--rx", "0deg");
    tints.forEach(function (t) {
      t.classList.remove("is-on");
    });
    front.style.color = "";
    front.style.removeProperty("--soon-fg");
  });

  // ----- flip -----
  function openGame() {
    if (wrap.classList.contains("is-flipped")) return;
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--rx", "0deg");
    card.classList.remove("is-tilting");
    autoStop();
    wrap.classList.add("is-flipped");
    gameIdx = (gameIdx + 1) % 3; // the games take turns: memory, tic-tac-toe, falling balls ...
    bs.round = 1;
    startCurrent();
  }
  function closeGame() {
    clearTimers();
    stopBalls();
    wrap.classList.remove("is-flipped");
    setTimeout(function () {
      gridEl.textContent = "";
      over.hidden = true;
      autoStart();
    }, 800);
  }
  front.addEventListener("click", openGame);
  back.querySelector(".soon-close").addEventListener("click", closeGame);
  front.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openGame();
    }
  });

  // ----- mini game -----
  var CELL = 36,
    GAP = 6,
    MAX_LIVES = 5;
  var cells = [],
    timers = [],
    st = {},
    games = 0,
    best = 0;
  function later(fn, ms) {
    var t = setTimeout(fn, ms);
    timers.push(t);
    return t;
  }
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }
  function rnd(n) {
    return Math.floor(Math.random() * n);
  }

  function renderLives() {
    livesEl.textContent = "";
    for (var i = 0; i < MAX_LIVES; i++) livesEl.appendChild(document.createElement("i"));
  }
  function loseLife() {
    var alive = livesEl.querySelectorAll("i:not(.is-lost)");
    if (alive.length) alive[alive.length - 1].classList.add("is-lost");
    st.lives--;
  }
  function buildGrid() {
    gridEl.textContent = "";
    cells = [];
    var w = gridEl.clientWidth,
      h = gridEl.clientHeight;
    var cols = Math.max(3, Math.floor((w + GAP) / (CELL + GAP))),
      rows = Math.max(2, Math.floor((h + GAP) / (CELL + GAP)));
    gridEl.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
    gridEl.style.gridTemplateRows = "repeat(" + rows + ", 1fr)";
    for (var i = 0; i < cols * rows; i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "soon-cell";
      b.tabIndex = -1;
      b.setAttribute("aria-label", "Square " + (i + 1));
      b.dataset.i = i;
      gridEl.appendChild(b);
      cells.push(b);
    }
  }
  function startGame() {
    clearTimers();
    st = { lives: MAX_LIVES, round: 0, seq: [], input: 0, locked: true, score: 0, over: false };
    over.hidden = true;
    renderLives();
    buildGrid();
    later(nextRound, 900);
  }
  function light(cell, color, ms) {
    cell.style.setProperty("--lit", color);
    cell.classList.add("is-lit");
    later(function () {
      cell.classList.remove("is-lit");
    }, ms);
  }
  function clearChips() {
    gridEl.querySelectorAll(".soon-chip").forEach(function (c) {
      c.remove();
    });
  }
  function nextRound() {
    st.round++;
    // Memory game: round N shows N squares (1, 2, 3, 4 ... without end); a square may come back later in the sequence
    var len = st.round;
    st.seq = [];
    while (st.seq.length < len) {
      var c = rnd(cells.length);
      if (c !== st.seq[st.seq.length - 1]) st.seq.push(c);
    }
    playSequence();
  }
  function playSequence() {
    st.locked = true;
    st.input = 0;
    clearChips();
    var STEP = Math.max(480, 900 - st.round * 20),
      LIT = Math.round(STEP * 0.72); // longer sequences play a little faster
    st.seq.forEach(function (c, k) {
      later(
        function () {
          light(cells[c], COLORS[rnd(COLORS.length)], LIT);
        },
        300 + k * STEP,
      );
    });
    later(
      function () {
        st.locked = false;
        if (st.round === 1) {
          var chip = document.createElement("span");
          chip.className = "soon-chip";
          chip.textContent = touch ? "Tap" : "Click";
          cells[st.seq[0]].appendChild(chip);
        }
      },
      300 + st.seq.length * STEP,
    );
  }
  function gameOver() {
    st.over = true;
    st.locked = true;
    clearChips();
    // Scores live in memory only: a refresh clears them
    var hadBefore = games > 0;
    games++;
    best = Math.max(best, st.score);
    over.querySelector(".soon-score-num").textContent = st.score;
    over.querySelector(".soon-best-num").textContent = best;
    over.querySelector(".soon-over-best").hidden = !hadBefore;
    over.querySelector(".soon-over-title").textContent = "Game over";
    over.querySelector(".soon-over-score").hidden = false;
    over.querySelector(".soon-over-tally").hidden = true;
    over.hidden = false;
  }
  gridEl.addEventListener("click", function (e) {
    var cell = e.target.closest(".soon-cell");
    if (!cell || st.locked || st.over) return;
    var i = +cell.dataset.i;
    if (i === st.seq[st.input]) {
      clearChips();
      cell.style.setProperty("--lit", COLORS[rnd(COLORS.length)]);
      cell.classList.add("is-ok");
      later(function () {
        cell.classList.remove("is-ok");
      }, 350);
      st.input++;
      if (st.input === st.seq.length) {
        st.score++;
        st.locked = true;
        later(nextRound, 900);
      }
    } else {
      loseLife();
      cell.classList.remove("is-bad");
      void cell.offsetWidth;
      cell.classList.add("is-bad");
      later(function () {
        cell.classList.remove("is-bad");
      }, 400);
      if (st.lives <= 0) {
        later(gameOver, 450);
        st.locked = true;
      } else {
        st.locked = true;
        later(playSequence, 900);
      }
    }
  });

  // ----- tic-tac-toe (you are X, the computer is O) -----
  var boardEl = back.querySelector(".soon-board"),
    statusEl = back.querySelector(".soon-status");
  var LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  var tt = { board: [], over: true, tally: { w: 0, d: 0, l: 0 } },
    tcells = [];
  var MARK = {
    x: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M10 10 L30 30 M30 10 L10 30" pathLength="1"/></svg>',
    o: '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="11" pathLength="1"/></svg>',
  };
  function startTTT() {
    clearTimers();
    tt.board = ["", "", "", "", "", "", "", "", ""];
    tt.over = false;
    over.hidden = true;
    boardEl.textContent = "";
    tcells = [];
    for (var i = 0; i < 9; i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "soon-tcell";
      b.dataset.i = i;
      b.setAttribute("aria-label", "Cell " + (i + 1));
      boardEl.appendChild(b);
      tcells.push(b);
    }
    boardEl.style.width = boardEl.clientHeight + "px";
    statusEl.textContent = "Your turn";
  }
  function tPlace(mark, i) {
    tt.board[i] = mark;
    tcells[i].innerHTML = MARK[mark];
    tcells[i].classList.add("is-" + mark);
  }
  function tResult() {
    for (var k = 0; k < LINES.length; k++) {
      var L = LINES[k],
        a = tt.board[L[0]];
      if (a && a === tt.board[L[1]] && a === tt.board[L[2]]) return { who: a, line: L };
    }
    return tt.board.indexOf("") < 0 ? { who: "draw" } : null;
  }
  function tFinish(res) {
    tt.over = true;
    if (res.line)
      res.line.forEach(function (i) {
        tcells[i].classList.add("is-win");
      });
    statusEl.textContent = res.who === "x" ? "You win!" : res.who === "o" ? "Computer wins" : "Draw";
    if (res.who === "x") tt.tally.w++;
    else if (res.who === "o") tt.tally.l++;
    else tt.tally.d++;
    later(function () {
      over.querySelector(".soon-over-title").textContent =
        res.who === "x" ? "You win!" : res.who === "o" ? "You lose" : "It's a draw";
      over.querySelector(".soon-over-score").hidden = true;
      over.querySelector(".soon-over-best").hidden = true;
      var t = over.querySelector(".soon-over-tally");
      t.textContent = "Wins " + tt.tally.w + " · Draws " + tt.tally.d + " · Losses " + tt.tally.l;
      t.hidden = false;
      over.hidden = false;
    }, 1100);
  }
  function tAI() {
    function find(mark) {
      for (var k = 0; k < LINES.length; k++) {
        var L = LINES[k],
          v = L.map(function (i) {
            return tt.board[i];
          });
        if (
          v.filter(function (x) {
            return x === mark;
          }).length === 2 &&
          v.indexOf("") >= 0
        )
          return L[v.indexOf("")];
      }
      return -1;
    }
    var m = find("o");
    if (m < 0) m = find("x");
    if (m < 0 && !tt.board[4] && Math.random() < 0.8) m = 4;
    if (m < 0) {
      var free = [];
      tt.board.forEach(function (v, i) {
        if (!v) free.push(i);
      });
      m = free[rnd(free.length)];
    }
    return m;
  }
  boardEl.addEventListener("click", function (e) {
    var c = e.target.closest(".soon-tcell");
    if (!c || tt.over || st.tturn) return;
    var i = +c.dataset.i;
    if (tt.board[i]) return;
    tPlace("x", i);
    var r = tResult();
    if (r) return tFinish(r);
    st.tturn = true;
    statusEl.textContent = "Computer's turn";
    later(
      function () {
        tPlace("o", tAI());
        st.tturn = false;
        var r2 = tResult();
        if (r2) return tFinish(r2);
        statusEl.textContent = "Your turn";
      },
      550 + rnd(350),
    );
  });

  // ----- game 3: falling balls and a see-saw -----
  var ballsEl = back.querySelector(".soon-balls"),
    cv = ballsEl.querySelector("canvas"),
    ctx = cv.getContext("2d");
  var hudRound = ballsEl.querySelector(".soon-b-round"),
    hudTime = ballsEl.querySelector(".soon-b-time");
  var bs = { round: 1, raf: 0, run: false };
  var TARGET = 10,
    ROUND_TIME = 60,
    HOLE = 12,
    MAXTH = 0.36,
    INERTIA = 40000,
    GRAV = 1100;
  function setOverBtn(txt) {
    over.querySelector('[data-act="again"]').textContent = txt;
  }
  function stopBalls() {
    bs.run = false;
    if (bs.raf) cancelAnimationFrame(bs.raf);
    bs.raf = 0;
  }

  function startBalls() {
    stopBalls();
    clearTimers();
    over.hidden = true;
    var W = ballsEl.clientWidth,
      H = ballsEl.clientHeight,
      dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = bs.round;
    bs.W = W;
    bs.H = H;
    bs.cx = W / 2;
    bs.cy = Math.round(H * 0.5);
    bs.Lh = Math.min(W * 0.42, 170);
    bs.bowlW = 72;
    bs.bowlH = 30;
    bs.bowlTop = H - 16 - 30;
    bs.th = 0;
    bs.om = 0;
    bs.ptr = false;
    bs.target = 0;
    bs.balls = [];
    bs.caught = 0;
    bs.time = ROUND_TIME;
    bs.spawn = 0.6;
    bs.flash = 0;
    bs.done = false;
    bs.interval = Math.max(0.45, 1.25 - 0.15 * (n - 1)); // balls drop faster every round
    bs.bigP = n === 1 ? 0 : Math.min(0.55, 0.18 + 0.1 * (n - 2)); // from round 2: balls that do not fit the hole
    bs.smallP = n < 3 ? 0 : 0.15;
    hudRound.textContent = "Round " + n;
    hudTime.textContent = ROUND_TIME;
    bs.run = true;
    bs.last = 0;
    bs.raf = requestAnimationFrame(frame);
  }
  function spawnBall() {
    var r = 10,
      u = Math.random();
    if (u < bs.bigP) r = [13, 15, 17][rnd(3)];
    else if (u < bs.bigP + bs.smallP) r = 7;
    bs.balls.push({
      x: bs.cx + (Math.random() * 2 - 1) * (bs.Lh - 24),
      y: -r - 2,
      vx: 0,
      vy: 0,
      r: r,
      m: (r / 10) * (r / 10),
      col: COLORS[rnd(COLORS.length)],
      passed: false,
    });
  }
  function simStep(dt) {
    var tgt = bs.ptr ? bs.target : 0,
      kp = bs.ptr ? 9 : 2.2,
      kd = bs.ptr ? 3.6 : 1.6;
    bs.om += (kp * (tgt - bs.th) - kd * bs.om) * dt;
    bs.th += bs.om * dt;
    if (Math.abs(bs.th) > MAXTH) {
      bs.th = MAXTH * (bs.th < 0 ? -1 : 1);
      if (bs.om * bs.th > 0) bs.om = 0;
    }
    var c = Math.cos(bs.th),
      s = Math.sin(bs.th),
      B = bs.balls,
      i,
      j;
    for (i = 0; i < B.length; i++) {
      B[i].vy += GRAV * dt;
      B[i].x += B[i].vx * dt;
      B[i].y += B[i].vy * dt;
    }
    for (i = 0; i < B.length; i++) {
      var b = B[i];
      if (b.passed) continue;
      var rx = b.x - bs.cx,
        ry = b.y - bs.cy,
        sl = rx * c + ry * s,
        d = -rx * s + ry * c;
      if (d > 1) {
        b.passed = true;
        continue;
      }
      var sc = Math.abs(sl) < HOLE ? (sl < 0 ? -HOLE : HOLE) : Math.max(-bs.Lh, Math.min(bs.Lh, sl));
      var px = bs.cx + sc * c,
        py = bs.cy + sc * s,
        dx = b.x - px,
        dy = b.y - py,
        dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= b.r + 1) continue;
      var nx,
        ny,
        big = b.r > HOLE;
      if (dist < 1e-6) {
        nx = s;
        ny = -c;
      } else {
        nx = dx / dist;
        ny = dy / dist;
      }
      var pen = b.r + 1 - dist;
      b.x += nx * pen;
      b.y += ny * pen;
      var rrx = sc * c,
        rry = sc * s,
        vpx = -bs.om * rry,
        vpy = bs.om * rrx;
      var vrx = b.vx - vpx,
        vry = b.vy - vpy,
        vn = vrx * nx + vry * ny;
      if (vn < 0) {
        var cross = -rry * nx + rrx * ny,
          den = 1 / b.m + (cross * cross) / INERTIA,
          jn = (-(big ? 1.7 : 1.22) * vn) / den;
        b.vx += (jn * nx) / b.m;
        b.vy += (jn * ny) / b.m;
        bs.om -= (jn * cross) / INERTIA;
        var tx = -ny,
          ty = nx,
          vt = vrx * tx + vry * ty,
          ct = -rry * tx + rrx * ty,
          dt2 = 1 / b.m + (ct * ct) / INERTIA;
        var jt = Math.max(-0.28 * jn, Math.min(0.28 * jn, -vt / dt2));
        b.vx += (jt * tx) / b.m;
        b.vy += (jt * ty) / b.m;
        bs.om -= (jt * ct) / INERTIA;
      }
      if (big) {
        // oversized balls bounce off the hole edge instead of wedging in it: guarantee a minimum rebound speed away from the plank, plus a nudge away from the hole
        var vo = (b.vx - -bs.om * rry) * nx + (b.vy - bs.om * rrx) * ny,
          minV = 230;
        if (vo < minV) {
          b.vx += (minV - vo) * nx;
          b.vy += (minV - vo) * ny;
        }
        if (Math.abs(sl) < HOLE + b.r) {
          var dir = sl < 0 ? -1 : 1;
          b.vx += dir * c * 40;
          b.vy += dir * s * 40;
        }
      }
    }
    for (i = 0; i < B.length; i++)
      for (j = i + 1; j < B.length; j++) {
        var a = B[i],
          q = B[j],
          ddx = q.x - a.x,
          ddy = q.y - a.y,
          rs = a.r + q.r,
          dd = ddx * ddx + ddy * ddy;
        if (dd >= rs * rs || dd === 0) continue;
        var dl = Math.sqrt(dd),
          ex = ddx / dl,
          ey = ddy / dl,
          ov = rs - dl,
          wa = q.m / (a.m + q.m),
          wq = a.m / (a.m + q.m);
        a.x -= ex * ov * wa;
        a.y -= ey * ov * wa;
        q.x += ex * ov * wq;
        q.y += ey * ov * wq;
        var rv = (q.vx - a.vx) * ex + (q.vy - a.vy) * ey;
        if (rv < 0) {
          var ji = (-1.2 * rv) / (1 / a.m + 1 / q.m);
          a.vx -= (ji * ex) / a.m;
          a.vy -= (ji * ey) / a.m;
          q.vx += (ji * ex) / q.m;
          q.vy += (ji * ey) / q.m;
        }
      }
    for (i = B.length - 1; i >= 0; i--) {
      var bb = B[i];
      if (bb.y > bs.bowlTop + 2 && Math.abs(bb.x - bs.cx) < bs.bowlW / 2 - 4) {
        B.splice(i, 1);
        bs.caught++;
        bs.flash = 1;
        continue;
      }
      if (bb.y > bs.H + 40 || bb.x < -40 || bb.x > bs.W + 40) B.splice(i, 1);
    }
  }
  function drawBalls() {
    var W = bs.W,
      H = bs.H,
      c = Math.cos(bs.th),
      s = Math.sin(bs.th),
      cx = bs.cx,
      cy = bs.cy;
    ctx.clearRect(0, 0, W, H);
    // bowl
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#fff";
    ctx.fillStyle = "rgba(255,255,255," + (0.06 + bs.flash * 0.22) + ")";
    var bl = cx - bs.bowlW / 2,
      br = cx + bs.bowlW / 2,
      bt = bs.bowlTop,
      bb = bt + bs.bowlH;
    ctx.beginPath();
    ctx.moveTo(bl, bt);
    ctx.lineTo(bl + 6, bb - 8);
    ctx.quadraticCurveTo(bl + 8, bb, bl + 18, bb);
    ctx.lineTo(br - 18, bb);
    ctx.quadraticCurveTo(br - 8, bb, br - 6, bb - 8);
    ctx.lineTo(br, bt);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "500 15px " + getComputedStyle(back).fontFamily;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(bs.caught + "/" + TARGET, cx, bt + 14);
    // see-saw: 2px white line with a 24px hole in the middle
    ctx.beginPath();
    ctx.moveTo(cx - bs.Lh * c, cy - bs.Lh * s);
    ctx.lineTo(cx - HOLE * c, cy - HOLE * s);
    ctx.moveTo(cx + HOLE * c, cy + HOLE * s);
    ctx.lineTo(cx + bs.Lh * c, cy + bs.Lh * s);
    ctx.stroke();
    bs.balls.forEach(function (b) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 6.2832);
      ctx.fillStyle = b.col;
      ctx.fill();
      if (b.r > 11) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(255,255,255,.85)";
        ctx.stroke();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
      }
    });
  }
  function frame(ts) {
    if (!bs.run) return;
    var dt = bs.last ? Math.min(0.033, (ts - bs.last) / 1000) : 0;
    bs.last = ts;
    if (!bs.done) {
      bs.time -= dt;
      bs.spawn -= dt;
      if (bs.spawn <= 0) {
        spawnBall();
        bs.spawn = bs.interval * (0.7 + Math.random() * 0.6);
      }
      for (var k = 0; k < 4; k++) simStep(dt / 4);
      bs.flash = Math.max(0, bs.flash - dt * 3);
      hudTime.textContent = Math.max(0, Math.ceil(bs.time));
      if (bs.caught >= TARGET) endBalls(true);
      else if (bs.time <= 0) endBalls(false);
    }
    drawBalls();
    bs.raf = requestAnimationFrame(frame);
  }
  function endBalls(win) {
    bs.done = true;
    var left = Math.max(0, Math.ceil(bs.time)),
      n = bs.round,
      caught = bs.caught;
    later(function () {
      stopBalls();
      over.querySelector(".soon-over-title").textContent = win ? "Round " + n + " complete" : "Time's up";
      over.querySelector(".soon-over-score").hidden = true;
      over.querySelector(".soon-over-best").hidden = true;
      var t = over.querySelector(".soon-over-tally");
      t.textContent = win
        ? TARGET + " balls caught, " + left + "s to spare"
        : "Caught " + caught + " of " + TARGET + " balls";
      t.hidden = false;
      setOverBtn(win ? "Round " + (n + 1) : "Play again");
      if (win) bs.round = n + 1;
      over.hidden = false;
    }, 700);
  }
  function ptrAim(e) {
    var r = cv.getBoundingClientRect(),
      x = (e.clientX - r.left) * (bs.W / r.width);
    bs.target = Math.max(-1, Math.min(1, (x - bs.cx) / bs.Lh)) * MAXTH;
    bs.ptr = true;
  }
  cv.style.touchAction = "none";
  cv.addEventListener("pointermove", function (e) {
    if (e.pointerType === "mouse" || e.buttons) ptrAim(e);
  });
  cv.addEventListener("pointerdown", function (e) {
    try {
      cv.setPointerCapture(e.pointerId);
    } catch (x) {}
    ptrAim(e);
  });
  cv.addEventListener("pointerup", function (e) {
    if (e.pointerType !== "mouse") bs.ptr = false;
  });
  cv.addEventListener("pointercancel", function () {
    bs.ptr = false;
  });
  cv.addEventListener("pointerleave", function (e) {
    if (e.pointerType === "mouse") bs.ptr = false;
  });

  function startCurrent() {
    st = {};
    stopBalls();
    back.dataset.game = ["mem", "ttt", "balls"][gameIdx];
    setOverBtn("Play again");
    if (gameIdx === 0) startGame();
    else if (gameIdx === 1) startTTT();
    else startBalls();
  }
  over.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.act === "again") startCurrent();
    else closeGame();
  });
})();
