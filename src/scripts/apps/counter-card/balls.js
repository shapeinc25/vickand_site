import { COLORS, rnd } from "./colors.js";

/* Mini game 3, falling balls: tilt the see-saw so that 10 balls drop through its hole into the bowl within 60 seconds.
   Every round the balls fall faster; from round 2 some are too big for the hole. */
export function createBalls(shared) {
  var back = shared.back,
    over = shared.over,
    later = shared.later,
    clearTimers = shared.clearTimers,
    setOverBtn = shared.setOverBtn;

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
    } catch {}
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

  return {
    start: startBalls,
    stop: stopBalls,
    firstRound: function () {
      bs.round = 1;
    },
  };
}
