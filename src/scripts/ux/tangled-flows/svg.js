// SVG helpers of the UX & Design hero animation.
const NS = "http://www.w3.org/2000/svg";

// $("rect", {x: 1}, parent): create an SVG element with attributes and append it to parent
export const $ = (t, a = {}, p) => {
  const e = document.createElementNS(NS, t);
  for (const k in a) e.setAttribute(k, a[k]);
  if (p) p.appendChild(e);
  return e;
};

// coordinates with one decimal, times with two
export const fx = (n) => n.toFixed(1),
  ft = (n) => n.toFixed(2);
