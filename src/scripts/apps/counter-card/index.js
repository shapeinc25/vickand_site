import { COLORS, fg } from "./colors.js";
import { createMemory } from "./memory.js";
import { createTicTacToe } from "./tictactoe.js";
import { createBalls } from "./balls.js";
import { reducedMotion } from "../../common/motion.js";

// Coming Soon counter card: 3D tilt + a new brand colour on every hover; click to flip it into a mini game
// (the three games take turns: memory, tic-tac-toe, falling balls).
(function () {
  var wrap = document.querySelector(".soon-counter");
  if (!wrap) return;
  var card = wrap.querySelector(".soon-card"),
    front = wrap.querySelector(".soon-front"),
    back = wrap.querySelector(".soon-back");
  var tints = front.querySelectorAll(".soon-tint");
  var over = back.querySelector(".soon-over");
  var reduce = reducedMotion;
  var touch = window.matchMedia && window.matchMedia("(hover: none)").matches;

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
    games.balls.firstRound();
    startCurrent();
  }
  function closeGame() {
    clearTimers();
    games.balls.stop();
    wrap.classList.remove("is-flipped");
    setTimeout(function () {
      games.memory.clear();
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

  // ----- the three mini games share the timers and the "game over" panel -----
  var timers = [];
  function later(fn, ms) {
    var t = setTimeout(fn, ms);
    timers.push(t);
    return t;
  }
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }
  function setOverBtn(txt) {
    over.querySelector('[data-act="again"]').textContent = txt;
  }
  var shared = {
    back: back,
    over: over,
    later: later,
    clearTimers: clearTimers,
    setOverBtn: setOverBtn,
    touch: function () {
      return touch;
    },
  };
  var games = { memory: createMemory(shared), ttt: createTicTacToe(shared), balls: createBalls(shared) };

  function startCurrent() {
    games.balls.stop();
    back.dataset.game = ["mem", "ttt", "balls"][gameIdx];
    setOverBtn("Play again");
    if (gameIdx === 0) games.memory.start();
    else if (gameIdx === 1) games.ttt.start();
    else games.balls.start();
  }
  over.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.act === "again") startCurrent();
    else closeGame();
  });
})();
