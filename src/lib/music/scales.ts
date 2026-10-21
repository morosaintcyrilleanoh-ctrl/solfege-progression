/**
 * Gammes écrites selon l'orthographe musicale : chaque degré utilise la lettre
 * suivante (une seule fois chacune), l'altération étant déduite du nombre de
 * demi-tons. Ainsi Fa majeur contient Si♭ et non La♯.
 */
import { type Accidental, type Letter, type Pitch, diatonicIndex, midiNumber, pitchFromDiatonicIndex } from './pitch';

export type ScaleType = 'major' | 'natural-minor' | 'harmonic-minor' | 'melodic-minor';

/** Intervalles successifs en demi-tons (gamme ascendante). */
export const SCALE_STEPS: Record<ScaleType, number[]> = {
  major: [2, 2, 1, 2, 2, 2, 1],
  'natural-minor': [2, 1, 2, 2, 1, 2, 2],
  'harmonic-minor': [2, 1, 2, 2, 1, 3, 1],
  'melodic-minor': [2, 1, 2, 2, 2, 2, 1],
};

export const SCALE_NAMES_FR: Record<ScaleType, string> = {
  major: 'majeure',
  'natural-minor': 'mineure naturelle',
  'harmonic-minor': 'mineure harmonique',
  'melodic-minor': 'mineure mélodique',
};

export class ScaleSpellingError extends Error {}

/**
 * Construit la gamme (8 notes, tonique répétée à l'octave).
 * La mineure mélodique descendante reprend la mineure naturelle.
 */
export function buildScale(
  tonic: { letter: Letter; accidental: Accidental },
  type: ScaleType,
  octave = 4,
  direction: 'up' | 'down' = 'up',
): Pitch[] {
  const effective: ScaleType = type === 'melodic-minor' && direction === 'down' ? 'natural-minor' : type;
  const start: Pitch = { ...tonic, octave };
  const notes: Pitch[] = [start];
  let semis = midiNumber(start);
  SCALE_STEPS[effective].forEach((step, i) => {
    semis += step;
    const natural = pitchFromDiatonicIndex(diatonicIndex(start) + i + 1);
    const acc = semis - midiNumber(natural);
    if (acc < -2 || acc > 2) throw new ScaleSpellingError('Gamme impossible à écrire sans triple altération.');
    notes.push({ ...natural, accidental: acc as Accidental });
  });
  return direction === 'down' ? notes.reverse() : notes;
}

export const DEGREE_NAMES_FR = ['tonique', 'sus-tonique', 'médiante', 'sous-dominante', 'dominante', 'sus-dominante', 'sensible'];
export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

/** Nom du degré ; le 7e degré est la « sensible » s'il est à un demi-ton de la tonique, sinon « sous-tonique ». */
export function degreeName(scale: Pitch[], degree: number): string {
  if (degree === 7) {
    const seventh = scale[6] as Pitch;
    const octave = scale[7] as Pitch;
    return midiNumber(octave) - midiNumber(seventh) === 1 ? 'sensible' : 'sous-tonique';
  }
  return DEGREE_NAMES_FR[degree - 1] as string;
}

/** « T T ½ T T T ½ » */
export function stepPattern(type: ScaleType): string[] {
  return SCALE_STEPS[type].map((s) => (s === 2 ? 'T' : s === 1 ? '½' : `${s / 2} T`));
}

/** Nombre d'altérations doubles (signale une tonalité théorique, ex. Sol♯ majeur). */
export function doubleAccidentals(scale: Pitch[]): number {
  return scale.slice(0, 7).filter((p) => Math.abs(p.accidental) === 2).length;
}

/**
 * Arpège de la tonique (accord parfait) tiré d'une gamme ascendante de 8 notes :
 * degrés 1, 3, 5 et 8. Ex. : Do majeur → Do, Mi, Sol, Do.
 */
export function arpeggio(scale: Pitch[]): Pitch[] {
  if (scale.length < 8) throw new Error('Gamme de 8 notes attendue.');
  return [0, 2, 4, 7].map((i) => scale[i] as Pitch);
}
