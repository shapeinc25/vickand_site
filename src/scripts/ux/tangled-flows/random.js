// Seeded random numbers (Park-Miller): the tangle looks the same on every visit.
export function seeded(seed) {
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const rr = (a, b) => a + rnd() * (b - a);
  return { rnd, rr };
}
