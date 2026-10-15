import { describe, expect, it } from 'vitest';
import { checkQuestion } from '@/lib/exercises/check';
import { analyzeTriad } from '@/lib/music/chords';
import { intervalBetween, intervalName } from '@/lib/music/intervals';
import type { Pitch } from '@/lib/music/pitch';
import { seededRng } from '@/lib/random';
import { noteAnswerVariants } from './common';
import { INTERVAL_EXERCISES, identifyIntervalQuestion, inversionQuestion, triadQualityQuestion } from './interval-questions';
import { SCALE_EXERCISES, spellingErrorQuestion } from './scale-questions';

describe('exercices de tonalités et d’intervalles', () => {
  it('chaque générateur produit des questions corrigeables, à tous les niveaux', () => {
    const rng = seededRng(42);
    for (const g of [...SCALE_EXERCISES, ...INTERVAL_EXERCISES]) {
      for (const d of [1, 2, 3]) {
        for (let i = 0; i < 40; i++) {
          const q = g.generate(d, rng);
          expect(q.prompt, g.id).toBeTruthy();
          if (q.type === 'mcq') {
            expect(q.choices.length, `${g.id} : ${q.prompt}`).toBeGreaterThanOrEqual(2);
            expect(new Set(q.choices.map((c) => c.label)).size).toBe(q.choices.length);
            expect(q.correct.length).toBeGreaterThan(0);
            expect(checkQuestion(q, { type: 'mcq', choiceId: q.correct[0]! }).correct).toBe(true);
          } else if (q.type === 'short') {
            for (const a of q.accepted) expect(checkQuestion(q, { type: 'short', text: a }).correct).toBe(true);
          } else {
            expect(checkQuestion(q, { type: 'match', mapping: q.pairs.map((p) => p.right) }).correct).toBe(true);
            expect(new Set(q.pairs.map((p) => p.right)).size).toBe(q.pairs.length);
          }
        }
      }
    }
  });

  it('la notation affichée correspond à la réponse attendue (intervalles et accords)', () => {
    const rng = seededRng(7);
    for (let i = 0; i < 150; i++) {
      const q = identifyIntervalQuestion((i % 3) + 1, rng);
      if (q.notation?.kind !== 'notes') throw new Error();
      const [a, b] = q.notation.notes as [Pitch, Pitch];
      const expected = q.choices.find((c) => q.correct.includes(c.id))?.label;
      expect(intervalName(intervalBetween(a, b))).toBe(expected);

      const t = triadQualityQuestion((i % 3) + 1, rng);
      if (t.notation?.kind !== 'notes') throw new Error();
      expect(analyzeTriad(t.notation.notes)?.quality).toBe(t.correct[0]);

      const v = inversionQuestion((i % 3) + 1, rng);
      if (v.notation?.kind !== 'notes') throw new Error();
      expect(`i${analyzeTriad(v.notation.notes)?.inversion}`).toBe(v.correct[0]);
    }
  });

  it('la note mal orthographiée a le même son mais un autre nom', () => {
    const rng = seededRng(9);
    for (let i = 0; i < 100; i++) {
      const q = spellingErrorQuestion(3, rng);
      if (q.notation?.kind !== 'notes') throw new Error();
      const letters = q.notation.notes.slice(0, 7).map((n) => n.letter);
      expect(new Set(letters).size).toBeLessThan(7); // une lettre répétée ou sautée
    }
  });

  it('accepte les différentes écritures d’un nom de note', () => {
    const q = { type: 'short' as const, id: 'x', skill: 's', prompt: 'p', explanation: 'e', answerKind: 'text' as const, accepted: noteAnswerVariants({ letter: 'F', accidental: 1 }) };
    for (const t of ['Fa♯', 'fa#', 'FA DIÈSE', 'fa dièse']) expect(checkQuestion(q, { type: 'short', text: t }).correct, t).toBe(true);
    expect(checkQuestion(q, { type: 'short', text: 'fa' }).correct).toBe(false);
    const b = { ...q, accepted: noteAnswerVariants({ letter: 'B', accidental: -1 }) };
    for (const t of ['Si♭', 'sib', 'si b', 'si bémol']) expect(checkQuestion(b, { type: 'short', text: t }).correct, t).toBe(true);
  });
});
