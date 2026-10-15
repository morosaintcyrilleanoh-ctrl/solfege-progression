/** Générateur aléatoire injectable : Math.random en production, une graine fixe dans les tests. */
export type Rng = () => number;

export const defaultRng: Rng = Math.random;

/** Générateur déterministe (mulberry32) pour les tests et les séquences reproductibles. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(min: number, max: number, rng: Rng = defaultRng): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pickWeighted<T>(items: readonly T[], weights: readonly number[], rng: Rng = defaultRng): T {
  if (items.length === 0) throw new Error('Liste vide');
  const total = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
  if (total <= 0) return items[Math.floor(rng() * items.length)] as T;
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= Math.max(0, weights[i] ?? 0);
    if (r < 0) return items[i] as T;
  }
  return items[items.length - 1] as T;
}
