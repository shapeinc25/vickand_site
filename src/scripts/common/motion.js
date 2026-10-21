// Motion settings shared by every script.
// reducedMotion: the visitor asked their system for less motion.
// lowPower: a weak device (2 GB of memory or less, 2 cores or less) or a slow / data-saving connection.
// The heaviest effects (the particle morph on Apps & Games, the dot field on UX & Design) are skipped there too.
var conn = navigator.connection || {};

export var reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

export var lowPower = !!(
  conn.saveData ||
  /(^|-)2g$/.test(conn.effectiveType || "") ||
  (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
  (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)
);
