import { describe, expect, it } from 'vitest';
import { checkQuestion } from '@/lib/exercises/check';
import { seededRng } from '@/lib/random';
import { atLeast, levelFromScores } from './learner-level';
import { PLACEMENT_LENGTH, areaOf, buildPlacementTest } from './placement';

describe('niveau de l’élève', () => {
  it('estime le niveau avec des règles simples', () => {
    expect(levelFromScores({ lecture: { correct: 4, total: 4 }, intervalles: { correct: 3, total: 3 }, rythme: { correct: 3, total: 4 } })).toBe('avance');
    expect(levelFromScores({ lecture: { correct: 4, total: 4 }, intervalles: { correct: 0, total: 3 }, rythme: { correct: 4, total: 4 } })).toBe('intermediaire');
    expect(levelFromScores({ lecture: { correct: 1, total: 4 }, rythme: { correct: 1, total: 4 } })).toBe('debutant');
    expect(levelFromScores({})).toBe('debutant');
    expect(atLeast('avance', 'intermediaire')).toBe(true);
    expect(atLeast('debutant', 'intermediaire')).toBe(false);
  });

  it('compose un test couvrant les quatre domaines, sans saisie libre', () => {
    const t = buildPlacementTest(seededRng(1));
    expect(t).toHaveLength(PLACEMENT_LENGTH);
    expect(new Set(t.map((q) => areaOf(q.skill)))).toEqual(new Set(['lecture', 'rythme', 'tonalites', 'intervalles']));
    for (const q of t) {
      expect(q.type).not.toBe('short');
      if (q.type === 'mcq') expect(checkQuestion(q, { type: 'mcq', choiceId: q.correct[0]! }).correct).toBe(true);
    }
  });
});
