import { describe, expect, it } from 'vitest';
import { add, compare, div, equals, frac, formatFraction, mul, sub, sum } from './fraction';

describe('fractions exactes', () => {
  it('réduit et normalise le signe', () => {
    expect(frac(6, 8)).toEqual({ n: 3, d: 4 });
    expect(frac(1, -2)).toEqual({ n: -1, d: 2 });
    expect(() => frac(1, 0)).toThrow();
  });
  it('calcule sans erreur d’arrondi', () => {
    expect(sum([frac(1, 3), frac(1, 3), frac(1, 3)])).toEqual(frac(1));
    expect(add(frac(1, 8), frac(1, 16))).toEqual(frac(3, 16));
    expect(sub(frac(1), frac(3, 8))).toEqual(frac(5, 8));
    expect(mul(frac(1, 2), frac(3, 2))).toEqual(frac(3, 4));
    expect(div(frac(3, 4), frac(1, 8))).toEqual(frac(6));
    expect(compare(frac(1, 3), frac(1, 4))).toBeGreaterThan(0);
    expect(equals(frac(2, 4), frac(1, 2))).toBe(true);
    expect(formatFraction(frac(3, 2))).toBe('3/2');
  });
});
