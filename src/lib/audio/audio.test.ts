import { describe, expect, it } from 'vitest';
import { beatSeconds, clampTempo, tempoFromTaps } from './metronome';
import { planRhythm } from './rhythm-player';

describe('métronome', () => {
  it('borne le tempo et calcule la durée du temps', () => {
    expect(clampTempo(10)).toBe(30);
    expect(clampTempo(500)).toBe(240);
    expect(clampTempo(Number.NaN)).toBe(60);
    expect(beatSeconds(120)).toBe(0.5);
  });
  it('déduit le tempo des frappes', () => {
    expect(tempoFromTaps([0, 500, 1000, 1500])).toBe(120);
    expect(tempoFromTaps([0, 1000, 1010, 2000])).toBe(60); // frappe parasite ignorée
    expect(tempoFromTaps([0])).toBeNull();
  });
});

describe('lecture d’un rythme', () => {
  it('place chaque note au bon instant, avec une mesure de décompte', () => {
    const plan = planRhythm([[{ value: 'quarter' }, { value: 'eighth' }, { value: 'eighth' }, { value: 'half', rest: true }]], { beats: 4, unit: 4 }, 60);
    expect(plan.countIn).toEqual([0, 1, 2, 3]);
    expect(plan.notes.map((n) => n.time)).toEqual([4, 5, 5.5]);
    expect(plan.notes.map((n) => n.duration)).toEqual([1, 0.5, 0.5]);
    expect(plan.totalSeconds).toBe(8);
  });
  it('compte en noires pointées en 6/8 et prolonge les notes liées', () => {
    const plan = planRhythm([[{ value: 'quarter', dots: 1, tie: true }, { value: 'eighth' }, { value: 'quarter' }]], { beats: 6, unit: 8 }, 60);
    expect(plan.countIn).toEqual([0, 1]);
    expect(plan.notes).toHaveLength(2);
    expect(plan.notes[0]).toEqual({ time: 2, duration: 4 / 3 });
    expect(plan.notes[1]!.time).toBeCloseTo(2 + 4 / 3);
  });
});
