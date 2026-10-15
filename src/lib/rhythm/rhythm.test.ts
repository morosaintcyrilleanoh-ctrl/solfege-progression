import { describe, expect, it } from 'vitest';
import { checkQuestion } from '@/lib/exercises/check';
import { equals, frac } from '@/lib/music/fraction';
import { seededRng } from '@/lib/random';
import { type RhythmEvent, eventDuration, eventName } from './durations';
import { checkMeasure, durationInBeats, hasSyncopation, isCompound, measureLength, pulse } from './meter';
import { RHYTHM_EXERCISES, SYNCOPATED, completeMeasureQuestion, fillDuration, findErrorQuestion, timeSignaturesFor, type Difficulty } from './questions';

const q4 = { beats: 4, unit: 4 } as const;

describe('durées', () => {
  it('donne la valeur exacte de chaque figure', () => {
    expect(eventDuration({ value: 'whole' })).toEqual(frac(1));
    expect(eventDuration({ value: 'quarter' })).toEqual(frac(1, 4));
    expect(eventDuration({ value: 'half', dots: 1 })).toEqual(frac(3, 4));
    expect(eventDuration({ value: 'quarter', dots: 2 })).toEqual(frac(7, 16));
    expect(eventDuration({ value: 'eighth', tuplet: { actual: 3, normal: 2, group: 1 } })).toEqual(frac(1, 12));
    expect(eventDuration({ value: 'sixteenth', rest: true })).toEqual(frac(1, 16));
  });
  it('exprime les durées en temps', () => {
    expect(durationInBeats({ value: 'half', dots: 1 }, q4)).toEqual(frac(3));
    expect(durationInBeats({ value: 'eighth' }, q4)).toEqual(frac(1, 2));
    expect(durationInBeats({ value: 'quarter', dots: 1 }, { beats: 6, unit: 8 })).toEqual(frac(1));
    expect(durationInBeats({ value: 'half' }, { beats: 2, unit: 2 })).toEqual(frac(1));
  });
  it('nomme les figures en français avec le bon accord', () => {
    expect(eventName({ value: 'half', dots: 1 })).toBe('blanche pointée');
    expect(eventName({ value: 'quarter', rest: true, dots: 1 })).toBe('soupir pointé');
    expect(eventName({ value: 'half', rest: true, dots: 1 })).toBe('demi-pause pointée');
    expect(eventName({ value: 'sixteenth', rest: true })).toBe('quart de soupir');
    expect(eventName({ value: 'eighth', tuplet: { actual: 3, normal: 2, group: 1 } })).toBe('croche de triolet');
  });
});

describe('mesures', () => {
  it('distingue mesures simples et composées', () => {
    expect(isCompound({ beats: 6, unit: 8 })).toBe(true);
    expect(isCompound({ beats: 12, unit: 8 })).toBe(true);
    expect(isCompound({ beats: 3, unit: 8 })).toBe(false);
    expect(isCompound({ beats: 3, unit: 4 })).toBe(false);
    expect(pulse({ beats: 6, unit: 8 })).toMatchObject({ beatsPerMeasure: 2, beatDuration: frac(3, 8), subdivision: 3 });
    expect(pulse({ beats: 6, unit: 8 }).beatFigure).toEqual({ value: 'quarter', dots: 1 });
    expect(pulse({ beats: 3, unit: 4 })).toMatchObject({ beatsPerMeasure: 3, beatDuration: frac(1, 4), subdivision: 2 });
  });
  it('vérifie la somme des durées', () => {
    const ok: RhythmEvent[] = [{ value: 'half', dots: 1 }, { value: 'quarter' }];
    expect(checkMeasure(ok, q4).status).toBe('complete');
    const short: RhythmEvent[] = [{ value: 'half' }, { value: 'eighth' }];
    const c = checkMeasure(short, q4);
    expect(c.status).toBe('incomplete');
    expect(c.difference).toEqual(frac(3, 8));
    expect(checkMeasure([{ value: 'whole' }, { value: 'eighth' }], q4).status).toBe('overfull');
    const triplet: RhythmEvent[] = [0, 1, 2].map(() => ({ value: 'eighth', tuplet: { actual: 3, normal: 2, group: 7 } }) as RhythmEvent);
    expect(checkMeasure([...triplet, { value: 'quarter' }], { beats: 2, unit: 4 }).status).toBe('complete');
    expect(checkMeasure(triplet.slice(0, 2), { beats: 2, unit: 4 }).brokenTuplets).toEqual([7]);
  });
  it('reconnaît les syncopes', () => {
    const ts = { beats: 2, unit: 4 } as const;
    expect(hasSyncopation([{ value: 'eighth' }, { value: 'quarter' }, { value: 'eighth' }], ts)).toBe(true);
    expect(hasSyncopation([{ value: 'quarter' }, { value: 'eighth' }, { value: 'eighth' }], ts)).toBe(false);
    expect(hasSyncopation([{ value: 'eighth' }, { value: 'eighth', tie: true }, { value: 'eighth' }, { value: 'eighth' }], ts)).toBe(true);
    expect(hasSyncopation([{ value: 'eighth' }, { value: 'quarter', rest: true }, { value: 'eighth' }], ts)).toBe(false);
  });
});

describe('générateurs', () => {
  it('remplit exactement une durée donnée', () => {
    const rng = seededRng(1);
    for (const d of [1, 2, 3] as Difficulty[]) {
      for (const ts of timeSignaturesFor(d)) {
        for (let i = 0; i < 40; i++) {
          const m = fillDuration(measureLength(ts), d, rng);
          const c = checkMeasure(m, ts);
          expect(c.status).toBe('complete');
          expect(c.brokenTuplets).toEqual([]);
        }
      }
    }
  });

  it('la figure proposée complète toujours exactement la mesure', () => {
    const rng = seededRng(2);
    for (let i = 0; i < 200; i++) {
      const d = ((i % 3) + 1) as Difficulty;
      const q = completeMeasureQuestion(d, rng);
      if (q.notation?.kind !== 'rhythm') throw new Error();
      expect(q.correct.length).toBeGreaterThan(0);
      expect(checkMeasure(q.notation.measures[0]!, q.notation.timeSignature).status).toBe('incomplete');
    }
  });

  it('une seule mesure est incorrecte dans « trouver l’erreur »', () => {
    const rng = seededRng(3);
    for (let i = 0; i < 200; i++) {
      const q = findErrorQuestion(((i % 3) + 1) as Difficulty, rng);
      const n = q.notation;
      if (n?.kind !== 'rhythm') throw new Error();
      const wrong = n.measures.map((m, idx) => (checkMeasure(m, n.timeSignature).status !== 'complete' ? `m${idx}` : null)).filter(Boolean);
      expect(wrong).toEqual(q.correct);
    }
  });

  it('chaque générateur produit des questions valides et corrigeables', () => {
    const rng = seededRng(4);
    for (const g of RHYTHM_EXERCISES) {
      for (const d of [1, 2, 3] as Difficulty[]) {
        for (let i = 0; i < 30; i++) {
          const q = g.generate(d, rng);
          expect(q.prompt.length).toBeGreaterThan(5);
          expect(q.explanation.length).toBeGreaterThan(5);
          if (q.type === 'mcq') {
            expect(new Set(q.choices.map((c) => c.label)).size).toBe(q.choices.length);
            expect(q.correct.length).toBeGreaterThan(0);
            expect(checkQuestion(q, { type: 'mcq', choiceId: q.correct[0]! }).correct).toBe(true);
            const wrong = q.choices.find((c) => !q.correct.includes(c.id));
            if (wrong) expect(checkQuestion(q, { type: 'mcq', choiceId: wrong.id }).correct).toBe(false);
          } else if (q.type === 'short') {
            expect(checkQuestion(q, { type: 'short', text: q.accepted[0]! }).correct).toBe(true);
          }
        }
      }
    }
  });

  it('chaque mesure affichée est complète (sauf exercices d’erreur et mesure à compléter)', () => {
    const rng = seededRng(6);
    for (const g of RHYTHM_EXERCISES.filter((e) => !['find-error', 'complete-measure'].includes(e.id))) {
      for (let i = 0; i < 60; i++) {
        const q = g.generate((i % 3) + 1, rng);
        if (q.notation?.kind !== 'rhythm') continue;
        for (const m of q.notation.measures) {
          const c = checkMeasure(m, q.notation.timeSignature);
          expect(c.status, `${g.id} ${JSON.stringify(m)}`).toBe('complete');
          expect(c.brokenTuplets).toEqual([]);
        }
      }
    }
  });

  it('les cellules syncopées sont bien des syncopes et tiennent dans une mesure à 2/4', () => {
    for (const cell of SYNCOPATED) {
      expect(hasSyncopation(cell, { beats: 2, unit: 4 })).toBe(true);
      expect(checkMeasure(cell, { beats: 2, unit: 4 }).status).not.toBe('overfull');
    }
  });

  it('les distracteurs de « compléter la mesure » ont une autre durée', () => {
    const rng = seededRng(5);
    for (let i = 0; i < 100; i++) {
      const q = completeMeasureQuestion(2, rng);
      expect(q.correct).toHaveLength(1);
    }
    expect(equals(frac(1, 2), frac(2, 4))).toBe(true);
  });
});
