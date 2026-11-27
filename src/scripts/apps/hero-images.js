(function () {
  var cards = [].slice.call(document.querySelectorAll(".hero-track[data-carousel] > a.mock"));
  if (cards.length < 12) return;
  var L = window.__lang || "en",
    S = window.__SHOTS || {},
    DD = window.__DD || [];
  function pick(set) {
    return set ? set[L] || set.en : [];
  }
  var apps = [
    { id: "kinetwo", name: "Kinetwo", imgs: pick(S.kinetwo) },
    { id: "flying-ladders", name: "Flying Ladders", imgs: pick(S.flying) },
    { id: "daydraft", name: "DayDraft", imgs: DD },
    { id: "shapemania", name: "Shape Mania", imgs: window.__SM || [] },
  ].filter(function (a) {
    return a.imgs.length;
  });
  if (!apps.length) return;
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)),
        t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }
  // all four apps are always in the hero: one screen each, plus a second (different) screen for two random apps.
  // Layout X Y P X Y Q (rotated randomly): any three neighbouring cards, also across the loop seam, are three different apps
  var sh = shuffle(apps.slice()),
    X = sh[0],
    Y = sh[1],
    P = sh[2],
    Q = sh[3] || sh[2];
  var sx = shuffle(X.imgs.slice()),
    sy = shuffle(Y.imgs.slice()),
    sp = shuffle(P.imgs.slice()),
    sq = shuffle(Q.imgs.slice());
  var seq = [
    { a: X, im: sx[0] },
    { a: Y, im: sy[0] },
    { a: P, im: sp[0] },
    { a: X, im: sx[1 % sx.length] },
    { a: Y, im: sy[1 % sy.length] },
    { a: Q, im: sq[Q === P ? 1 % sq.length : 0] },
  ];
  var rot = Math.floor(Math.random() * 6),
    order = seq.slice(rot).concat(seq.slice(0, rot));
  cards.forEach(function (c, i) {
    var it = order[i % 6];
    c.setAttribute("href", "#" + it.a.id);
    c.setAttribute("aria-label", it.a.name);
    window.__setScreen(c.querySelector(".mock-bg"), it.im);
  });
})();
