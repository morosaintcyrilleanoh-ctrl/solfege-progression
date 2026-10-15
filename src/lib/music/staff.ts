/**
 * Position d'une note sur la portée de cinq lignes.
 *
 * « step » = nombre de demi-interlignes au-dessus de la 1re ligne (la plus basse) :
 *   step 0 = 1re ligne, step 1 = 1er interligne, … step 8 = 5e ligne.
 *   Les valeurs négatives ou supérieures à 8 utilisent des lignes supplémentaires.
 *
 * Cette logique est la seule source de vérité : le rendu graphique est vérifié
 * contre elle (voir components/notation/Staff.tsx).
 */
import { type Accidental, type Pitch, diatonicIndex, pitchFromDiatonicIndex } from './pitch';

export type Clef = 'treble' | 'bass';

export interface ClefDefinition {
  id: Clef;
  label: string;
  shortLabel: string;
  /** Note écrite sur la 1re ligne (la plus basse). */
  bottomLine: Pitch;
  /** Ligne sur laquelle s'enroule la clé, utilisée pour les rappels pédagogiques. */
  referenceLine: { line: number; pitch: Pitch };
}

export const CLEFS: Record<Clef, ClefDefinition> = {
  treble: {
    id: 'treble',
    label: 'Clé de sol',
    shortLabel: 'Sol',
    bottomLine: { letter: 'E', accidental: 0, octave: 4 },
    referenceLine: { line: 2, pitch: { letter: 'G', accidental: 0, octave: 4 } },
  },
  bass: {
    id: 'bass',
    label: 'Clé de fa',
    shortLabel: 'Fa',
    bottomLine: { letter: 'G', accidental: 0, octave: 2 },
    referenceLine: { line: 4, pitch: { letter: 'F', accidental: 0, octave: 3 } },
  },
};

export const TOP_LINE_STEP = 8;

export function staffStep(pitch: Pick<Pitch, 'letter' | 'octave'>, clef: Clef): number {
  return diatonicIndex(pitch) - diatonicIndex(CLEFS[clef].bottomLine);
}

export function pitchAtStep(step: number, clef: Clef, accidental: Accidental = 0): Pitch {
  return pitchFromDiatonicIndex(diatonicIndex(CLEFS[clef].bottomLine) + step, accidental);
}

/** Lignes supplémentaires à dessiner pour une note (exprimées en « step »). */
export function ledgerLineSteps(step: number): number[] {
  const steps: number[] = [];
  for (let s = -2; s >= step; s -= 2) steps.push(s);
  for (let s = TOP_LINE_STEP + 2; s <= step; s += 2) steps.push(s);
  return steps;
}

/**
 * Numéro de ligne VexFlow correspondant : VexFlow numérote la 1re ligne « 1 »,
 * le 1er interligne « 1.5 », la 5e ligne « 5 ».
 */
export function vexflowLine(step: number): number {
  return step / 2 + 1;
}

export type StaffPlacement = 'below' | 'inside' | 'above';

export interface StaffPosition {
  step: number;
  onLine: boolean;
  placement: StaffPlacement;
  ledgerLines: number;
  /** Description pédagogique en français, ex. « 2e ligne », « 1re ligne supplémentaire en dessous ». */
  description: string;
}

function ordinal(n: number, feminine: boolean): string {
  if (n === 1) return feminine ? '1re' : '1er';
  return `${n}e`;
}

export function describeStep(step: number): string {
  if (step >= 0 && step <= TOP_LINE_STEP) {
    return step % 2 === 0 ? `${ordinal(step / 2 + 1, true)} ligne` : `${ordinal((step + 1) / 2, false)} interligne`;
  }
  if (step < 0) {
    if (step === -1) return 'sous la 1re ligne';
    const n = Math.floor(-step / 2);
    return step % 2 === 0
      ? `${ordinal(n, true)} ligne supplémentaire en dessous`
      : `sous la ${ordinal(n, true)} ligne supplémentaire en dessous`;
  }
  if (step === TOP_LINE_STEP + 1) return 'au-dessus de la 5e ligne';
  const n = Math.floor((step - TOP_LINE_STEP) / 2);
  return step % 2 === 0
    ? `${ordinal(n, true)} ligne supplémentaire au-dessus`
    : `au-dessus de la ${ordinal(n, true)} ligne supplémentaire`;
}

export function staffPosition(pitch: Pick<Pitch, 'letter' | 'octave'>, clef: Clef): StaffPosition {
  const step = staffStep(pitch, clef);
  return {
    step,
    onLine: step % 2 === 0,
    placement: step < 0 ? 'below' : step > TOP_LINE_STEP ? 'above' : 'inside',
    ledgerLines: ledgerLineSteps(step).length,
    description: describeStep(step),
  };
}
