/** Identification de notes sur la portée, au format générique (test de positionnement, exercices de formateur). */
import type { McqQuestion } from '@/lib/exercises/types';
import { questionId } from '@/lib/exercises/util';
import { FRENCH_NAMES, LETTERS } from '@/lib/music/pitch';
import { CLEFS } from '@/lib/music/staff';
import { explainQuestion, generateQuestion } from '@/lib/note-reading/questions';
import { type Rng, defaultRng } from '@/lib/random';
import type { LevelId } from '@/lib/note-reading/levels';

export function noteIdentificationQuestion(d: number, rng: Rng = defaultRng): McqQuestion {
  const level = Math.max(1, Math.min(3, d)) as LevelId;
  const q = generateQuestion({ clefChoice: d >= 2 ? 'both' : 'treble', level, rng });
  return {
    type: 'mcq',
    id: questionId('ni', rng),
    skill: 'lecture.notes',
    prompt: `Quelle est cette note en ${CLEFS[q.clef].label.toLowerCase()} ?`,
    notation: { kind: 'notes', clef: q.clef, notes: [q.pitch], layout: 'melodic' },
    choices: LETTERS.map((l) => ({ id: l, label: FRENCH_NAMES[l] })),
    correct: [q.pitch.letter],
    explanation: explainQuestion(q, { notation: 'fr', octaveConvention: 'fr' }),
  };
}
