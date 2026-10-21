import { rnd } from "./colors.js";

/* Mini game 2, tic-tac-toe: you are X, the computer is O. */
export function createTicTacToe(shared) {
  var back = shared.back,
    over = shared.over,
    later = shared.later,
    clearTimers = shared.clearTimers;

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
  var tt = { board: [], over: true, turn: false, tally: { w: 0, d: 0, l: 0 } },
    tcells = [];
  var MARK = {
    x: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M10 10 L30 30 M30 10 L10 30" pathLength="1"/></svg>',
    o: '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="11" pathLength="1"/></svg>',
  };
  function startTTT() {
    clearTimers();
    tt.board = ["", "", "", "", "", "", "", "", ""];
    tt.over = false;
    tt.turn = false;
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
    if (!c || tt.over || tt.turn) return;
    var i = +c.dataset.i;
    if (tt.board[i]) return;
    tPlace("x", i);
    var r = tResult();
    if (r) return tFinish(r);
    tt.turn = true;
    statusEl.textContent = "Computer's turn";
    later(
      function () {
        tPlace("o", tAI());
        tt.turn = false;
        var r2 = tResult();
        if (r2) return tFinish(r2);
        statusEl.textContent = "Your turn";
      },
      550 + rnd(350),
    );
  });

  return { start: startTTT };
}
