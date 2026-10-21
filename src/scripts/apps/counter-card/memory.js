import { COLORS, rnd } from "./colors.js";

/* Mini game 1, memory: the squares light up in a sequence, click them back in the same order.
   Round N shows N squares; five lives. */
export function createMemory(shared) {
  var back = shared.back,
    over = shared.over,
    later = shared.later,
    clearTimers = shared.clearTimers;
  var livesEl = back.querySelector(".soon-lives"),
    gridEl = back.querySelector(".soon-grid");
  var CELL = 36,
    GAP = 6,
    MAX_LIVES = 5;
  var cells = [],
    st = {},
    games = 0,
    best = 0; // scores live in memory only: a refresh clears them

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
          chip.textContent = shared.touch() ? "Tap" : "Click";
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

  return {
    start: startGame,
    clear: function () {
      gridEl.textContent = "";
    },
  };
}
