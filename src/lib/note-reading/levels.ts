import type { Clef } from '@/lib/music/staff';

export type LevelId = 1 | 2 | 3 | 4;

export interface NoteReadingLevel {
  id: LevelId;
  label: string;
  description: string;
  /** Étendue en « steps » (voir lib/music/staff.ts), bornes incluses, identique pour les deux clés. */
  minStep: number;
  maxStep: number;
  accidentals: boolean;
}

/**
 * Progression : on commence dans la portée, puis on ajoute les lignes
 * supplémentaires, puis les altérations.
 */
export const LEVELS: Record<LevelId, NoteReadingLevel> = {
  1: {
    id: 1,
    label: 'Niveau 1 · Dans la portée',
    description: 'Les notes sur les 5 lignes et les 4 interlignes.',
    minStep: 0,
    maxStep: 8,
    accidentals: false,
  },
  2: {
    id: 2,
    label: 'Niveau 2 · Autour de la portée',
    description: "Ajoute une ligne supplémentaire au-dessus et en dessous, et les notes qui l'entourent.",
    minStep: -3,
    maxStep: 11,
    accidentals: false,
  },
  3: {
    id: 3,
    label: 'Niveau 3 · Lignes supplémentaires',
    description: "Jusqu'à 3 lignes supplémentaires au-dessus et en dessous, sur plusieurs octaves.",
    minStep: -6,
    maxStep: 14,
    accidentals: false,
  },
  4: {
    id: 4,
    label: 'Niveau 4 · Avec altérations',
    description: 'Dièses et bémols sur les notes du niveau 2 : lis le nom complet de la note.',
    minStep: -3,
    maxStep: 11,
    accidentals: true,
  },
};

export const LEVEL_IDS: LevelId[] = [1, 2, 3, 4];

export type ClefChoice = Clef | 'both';

export const CLEF_CHOICES: { id: ClefChoice; label: string }[] = [
  { id: 'treble', label: 'Clé de sol' },
  { id: 'bass', label: 'Clé de fa' },
  { id: 'both', label: 'Les deux' },
];

export function clefsFor(choice: ClefChoice): Clef[] {
  return choice === 'both' ? ['treble', 'bass'] : [choice];
}

export function isLevelId(value: unknown): value is LevelId {
  return value === 1 || value === 2 || value === 3 || value === 4;
}
