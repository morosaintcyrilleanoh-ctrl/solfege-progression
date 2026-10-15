import { describe, expect, it } from 'vitest';
import { analyzeTaps } from './pulse-analysis';

describe('analyse de la pulsation', () => {
  const beats = [0, 500, 1000, 1500];
  it('mesure les écarts et la tendance', () => {
    const a = analyzeTaps(beats, [10, 530, 990, 1600]);
    expect(a.offsets).toEqual([10, 30, -10, 100]);
    expect(a.meanAbsMs).toBe(38);
    expect(a.meanSignedMs).toBe(33);
    expect(a.onTime).toBe(3);
    expect(a.missed).toBe(0);
    expect(a.extra).toBe(0);
  });
  it('compte les temps manqués et les frappes en trop', () => {
    const a = analyzeTaps(beats, [5, 20, 1495]);
    expect(a.offsets).toEqual([5, null, null, -5]);
    expect(a.missed).toBe(2);
    expect(a.extra).toBe(1);
  });
  it('ne compte aucune frappe pour aucun temps', () => {
    expect(analyzeTaps(beats, []).meanAbsMs).toBeNull();
  });
});
