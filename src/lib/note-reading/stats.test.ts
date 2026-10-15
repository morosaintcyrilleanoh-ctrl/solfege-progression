import { describe, expect, it } from 'vitest';
import { aggregateNoteStats, focusWeights, weakNotes } from './stats';

describe('statistiques et révisions', () => {
  const records = [
    { k: 'treble:G4', c: true },
    { k: 'treble:G4', c: true },
    { k: 'bass:F3', c: false },
    { k: 'bass:F3', c: false },
    { k: 'bass:F3', c: true },
    { k: 'treble:C4', c: false },
    { k: 'oops', c: false },
  ];

  it('agrège les réponses par note et ignore les données invalides', () => {
    const stats = aggregateNoteStats(records);
    expect(stats).toHaveLength(3);
    const f3 = stats.find((s) => s.key === 'bass:F3');
    expect(f3).toMatchObject({ attempts: 3, correct: 1 });
    expect(f3?.accuracy).toBeCloseTo(1 / 3);
  });

  it('ne recommande une note qu’après plusieurs essais', () => {
    const weak = weakNotes(aggregateNoteStats(records));
    expect(weak.map((s) => s.key)).toEqual(['bass:F3']);
  });

  it('donne plus de poids aux notes manquées', () => {
    const w = focusWeights(aggregateNoteStats(records));
    expect(w['treble:G4']).toBeUndefined();
    expect(w['bass:F3']).toBeGreaterThan(0);
    expect(w['bass:F3']!).toBeLessThanOrEqual(4);
  });
});
