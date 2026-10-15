/** Composition du test de positionnement : quelques questions de chaque domaine, du plus simple au plus avancé. */
import type { Question } from '@/lib/exercises/types';
import { RHYTHM_EXERCISES } from '@/lib/rhythm/questions';
import { INTERVAL_EXERCISES } from '@/lib/theory/interval-questions';
import { noteIdentificationQuestion } from '@/lib/theory/note-questions';
import { SCALE_EXERCISES } from '@/lib/theory/scale-questions';
import type { Rng } from '@/lib/random';

export type Area = 'lecture' | 'rythme' | 'tonalites' | 'intervalles';

export const AREA_LABELS: Record<Area, string> = {
  lecture: 'Lecture des notes',
  rythme: 'Rythme',
  tonalites: 'Tonalités et gammes',
  intervalles: 'Intervalles et accords',
};

export const AREA_LINKS: Record<Area, string> = {
  lecture: '/laboratoires/lecture-des-notes',
  rythme: '/laboratoires/rythme',
  tonalites: '/laboratoires/tonalites',
  intervalles: '/laboratoires/intervalles',
};

export function areaOf(skill: string): Area {
  if (skill.startsWith('rythme')) return 'rythme';
  if (skill.startsWith('tonalites')) return 'tonalites';
  if (skill.startsWith('intervalles') || skill.startsWith('accords')) return 'intervalles';
  return 'lecture';
}

const plan: [string, number][] = [
  ['notes', 1], ['notes', 1], ['notes', 2], ['notes', 3],
  ['figure-value', 1], ['complete-measure', 1], ['find-error', 2], ['meter-type', 2],
  ['tone-semitone', 1], ['signature-count', 1], ['identify-key', 2], ['degree', 2],
  ['identify-interval', 1], ['triad-quality', 1], ['inversion', 2],
];

export function buildPlacementTest(rng?: Rng): Question[] {
  const all = [...RHYTHM_EXERCISES, ...SCALE_EXERCISES, ...INTERVAL_EXERCISES];
  return plan.map(([id, d]) => {
    if (id === 'notes') return noteIdentificationQuestion(d, rng);
    const gen = all.find((g) => g.id === id);
    if (!gen) throw new Error(`Générateur inconnu : ${id}`);
    // Le test se fait sans saisie libre : on garde des questions à choix.
    let q = gen.generate(d, rng);
    for (let i = 0; i < 20 && q.type === 'short'; i++) q = gen.generate(d, rng);
    return q;
  });
}

export const PLACEMENT_LENGTH = plan.length;
