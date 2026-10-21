// The 9 brand colours: orange, yellow, green, blue, purple and the four gradient mixes (Figma Brand collection)
export var COLORS = ["#ff5c00", "#e9e037", "#2ecf49", "#2f9de1", "#7a47d3", "#f49e1c", "#8bd740", "#2fb695", "#5572da"];

function lum(hex) {
  var v = [1, 3, 5].map(function (i) {
    var c = parseInt(hex.substr(i, 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
// best contrast on a brand colour: white or #2c2929
export function fg(hex) {
  var l = lum(hex);
  return 1.05 / (l + 0.05) >= (l + 0.05) / 0.072 ? "#ffffff" : "#2c2929";
}

// random whole number from 0 to n - 1
export function rnd(n) {
  return Math.floor(Math.random() * n);
}
