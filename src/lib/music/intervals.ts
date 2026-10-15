/**
 * Intervalles : nombre (seconde, tierce…) donné par les lettres, qualité
 * (majeure, mineure, juste…) donnée par le nombre de demi-tons.
 */
import { type Accidental, type Pitch, LETTERS, diatonicIndex, midiNumber, pitchFromDiatonicIndex } from './pitch';

export type Quality = 'dd' | 'd' | 'm' | 'M' | 'P' | 'A' | 'AA';

export interface Interval {
  /** 1 = unisson, 2 = seconde… 8 = octave, 9 = neuvième… */
  number: number;
  quality: Quality;
  semitones: number;
}

const PERFECT_NUMBERS = new Set([1, 4, 5]);
/** Demi-tons des intervalles majeurs ou justes, dans l'octave (index = nombre simple - 1). */
const REFERENCE = [0, 2, 4, 5, 7, 9, 11];

export const NUMBER_NAMES_FR = ['unisson', 'seconde', 'tierce', 'quarte', 'quinte', 'sixte', 'septième', 'octave'];

const QUALITY_NAMES_FR: Record<Quality, string> = {
  dd: 'sous-diminuée',
  d: 'diminuée',
  m: 'mineure',
  M: 'majeure',
  P: 'juste',
  A: 'augmentée',
  AA: 'sur-augmentée',
};

function simpleNumber(n: number): number {
  return ((n - 1) % 7) + 1;
}

export function isPerfectType(number: number): boolean {
  return PERFECT_NUMBERS.has(simpleNumber(number));
}

function referenceSemitones(number: number): number {
  const octaves = Math.floor((number - 1) / 7);
  return (REFERENCE[simpleNumber(number) - 1] as number) + 12 * octaves;
}

/** Intervalle ascendant de `low` à `high` (si `high` est plus bas, on les inverse). */
export function intervalBetween(a: Pitch, b: Pitch): Interval {
  let low = a;
  let high = b;
  if (diatonicIndex(b) < diatonicIndex(a) || (diatonicIndex(b) === diatonicIndex(a) && midiNumber(b) < midiNumber(a))) {
    low = b;
    high = a;
  }
  const number = diatonicIndex(high) - diatonicIndex(low) + 1;
  const semitones = midiNumber(high) - midiNumber(low);
  const diff = semitones - referenceSemitones(number);
  let quality: Quality;
  if (isPerfectType(number)) {
    quality = ({ [-2]: 'dd', [-1]: 'd', 0: 'P', 1: 'A', 2: 'AA' } as Record<number, Quality>)[diff] ?? (diff < 0 ? 'dd' : 'AA');
  } else {
    quality = ({ [-3]: 'dd', [-2]: 'd', [-1]: 'm', 0: 'M', 1: 'A', 2: 'AA' } as Record<number, Quality>)[diff] ?? (diff < 0 ? 'dd' : 'AA');
  }
  return { number, quality, semitones };
}

/** Nom français, ex. « tierce majeure », « quinte juste », « octave juste ». */
export function intervalName(i: Pick<Interval, 'number' | 'quality'>): string {
  const base = i.number <= 8 ? NUMBER_NAMES_FR[i.number - 1] : `${i.number}e`;
  if (i.number === 1) return `unisson ${i.quality === 'P' ? 'juste' : QUALITY_NAMES_FR[i.quality].replace(/e$/, '')}`;
  return `${base} ${QUALITY_NAMES_FR[i.quality]}`;
}

function semitonesFor(number: number, quality: Quality): number {
  const ref = referenceSemitones(number);
  if (isPerfectType(number)) {
    const offsets: Partial<Record<Quality, number>> = { dd: -2, d: -1, P: 0, A: 1, AA: 2 };
    const o = offsets[quality];
    if (o == null) throw new Error(`Qualité ${quality} impossible pour ce nombre`);
    return ref + o;
  }
  const offsets: Partial<Record<Quality, number>> = { dd: -3, d: -2, m: -1, M: 0, A: 1, AA: 2 };
  const o = offsets[quality];
  if (o == null) throw new Error(`Qualité ${quality} impossible pour ce nombre`);
  return ref + o;
}

/** Construit la note située à l'intervalle donné au-dessus (ou au-dessous) de `from`. */
export function buildInterval(from: Pitch, number: number, quality: Quality, direction: 'up' | 'down' = 'up'): Pitch {
  const steps = (number - 1) * (direction === 'up' ? 1 : -1);
  const target = pitchFromDiatonicIndex(diatonicIndex(from) + steps);
  const wanted = midiNumber(from) + semitonesFor(number, quality) * (direction === 'up' ? 1 : -1);
  const acc = wanted - midiNumber({ ...target, accidental: 0 });
  if (acc < -2 || acc > 2) throw new Error('Intervalle impossible à écrire sans triple altération');
  return { ...target, accidental: acc as Accidental };
}

/** Nombre de tons d'un intervalle (« 2 tons », « 3 tons ½ »). */
export function tonesLabel(semitones: number): string {
  const tones = Math.floor(semitones / 2);
  const half = semitones % 2 === 1;
  if (tones === 0) return half ? '½ ton' : '0 ton';
  return `${tones} ton${tones > 1 ? 's' : ''}${half ? ' ½' : ''}`;
}

export type StepKind = 'ton' | 'demi-ton diatonique' | 'demi-ton chromatique' | 'autre';

/**
 * Nature d'un pas entre deux notes voisines :
 * demi-ton diatonique = deux noms différents (Mi–Fa), chromatique = même nom (Do–Do♯).
 */
export function stepKind(a: Pitch, b: Pitch): StepKind {
  const semis = Math.abs(midiNumber(b) - midiNumber(a));
  const sameLetter = a.letter === b.letter;
  const neighbourLetters = Math.abs(diatonicIndex(b) - diatonicIndex(a)) === 1;
  if (semis === 1 && sameLetter) return 'demi-ton chromatique';
  if (semis === 1 && neighbourLetters) return 'demi-ton diatonique';
  if (semis === 2 && neighbourLetters) return 'ton';
  return 'autre';
}

export { LETTERS };
