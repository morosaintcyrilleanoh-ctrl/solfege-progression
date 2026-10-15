/**
 * Fractions exactes pour les durées : 1/3 + 1/3 + 1/3 vaut exactement 1,
 * sans erreur d'arrondi comme avec les nombres à virgule.
 */
export interface Fraction {
  readonly n: number;
  readonly d: number;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function frac(n: number, d = 1): Fraction {
  if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new Error(`Fraction invalide : ${n}/${d}`);
  const sign = d < 0 ? -1 : 1;
  const g = gcd(n, d);
  return { n: (sign * n) / g, d: (sign * d) / g };
}

export const ZERO = frac(0);

export function add(a: Fraction, b: Fraction): Fraction {
  return frac(a.n * b.d + b.n * a.d, a.d * b.d);
}

export function sub(a: Fraction, b: Fraction): Fraction {
  return frac(a.n * b.d - b.n * a.d, a.d * b.d);
}

export function mul(a: Fraction, b: Fraction): Fraction {
  return frac(a.n * b.n, a.d * b.d);
}

export function div(a: Fraction, b: Fraction): Fraction {
  if (b.n === 0) throw new Error('Division par zéro');
  return frac(a.n * b.d, a.d * b.n);
}

export function sum(list: Iterable<Fraction>): Fraction {
  let total = ZERO;
  for (const f of list) total = add(total, f);
  return total;
}

export function compare(a: Fraction, b: Fraction): number {
  return a.n * b.d - b.n * a.d;
}

export function equals(a: Fraction, b: Fraction): boolean {
  return compare(a, b) === 0;
}

export function toNumber(f: Fraction): number {
  return f.n / f.d;
}

/** « 3/2 », « 1 », « 1/3 » */
export function formatFraction(f: Fraction): string {
  return f.d === 1 ? String(f.n) : `${f.n}/${f.d}`;
}
