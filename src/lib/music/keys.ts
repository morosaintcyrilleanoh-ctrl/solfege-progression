/**
 * Tonalités, armures et cycle des quintes.
 */
import { type Accidental, type Letter, type Pitch, ACCIDENTAL_SYMBOLS, FRENCH_NAMES, LETTERS, letterIndex } from './pitch';

/** Ordre des dièses et des bémols à l'armure. */
export const SHARP_ORDER: Letter[] = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
export const FLAT_ORDER: Letter[] = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

export type Mode = 'major' | 'minor';

export interface Key {
  tonic: { letter: Letter; accidental: Accidental };
  mode: Mode;
}

/** Nombre d'altérations : positif = dièses, négatif = bémols (de -7 à +7). */
export type Fifths = number;

/** Tonalités majeures dans l'ordre du cycle des quintes (de 7 bémols à 7 dièses). */
const MAJOR_BY_FIFTHS: Record<number, [Letter, Accidental]> = {
  [-7]: ['C', -1], [-6]: ['G', -1], [-5]: ['D', -1], [-4]: ['A', -1], [-3]: ['E', -1], [-2]: ['B', -1], [-1]: ['F', 0],
  0: ['C', 0], 1: ['G', 0], 2: ['D', 0], 3: ['A', 0], 4: ['E', 0], 5: ['B', 0], 6: ['F', 1], 7: ['C', 1],
};

const MINOR_BY_FIFTHS: Record<number, [Letter, Accidental]> = {
  [-7]: ['A', -1], [-6]: ['E', -1], [-5]: ['B', -1], [-4]: ['F', 0], [-3]: ['C', 0], [-2]: ['G', 0], [-1]: ['D', 0],
  0: ['A', 0], 1: ['E', 0], 2: ['B', 0], 3: ['F', 1], 4: ['C', 1], 5: ['G', 1], 6: ['D', 1], 7: ['A', 1],
};

export const ALL_FIFTHS: Fifths[] = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7];

export function keyFromFifths(fifths: Fifths, mode: Mode): Key {
  const [letter, accidental] = (mode === 'major' ? MAJOR_BY_FIFTHS : MINOR_BY_FIFTHS)[fifths] ?? (() => {
    throw new Error(`Armure impossible : ${fifths}`);
  })();
  return { tonic: { letter, accidental }, mode };
}

export function fifthsOf(key: Key): Fifths {
  const table = key.mode === 'major' ? MAJOR_BY_FIFTHS : MINOR_BY_FIFTHS;
  for (const f of ALL_FIFTHS) {
    const [l, a] = table[f] as [Letter, Accidental];
    if (l === key.tonic.letter && a === key.tonic.accidental) return f;
  }
  throw new Error('Tonalité hors du cycle des quintes (armure de plus de 7 altérations).');
}

export function isStandardKey(key: Key): boolean {
  try {
    fifthsOf(key);
    return true;
  } catch {
    return false;
  }
}

/** Altération de chaque lettre imposée par l'armure. */
export function keySignatureMap(fifths: Fifths): Record<Letter, Accidental> {
  const map = Object.fromEntries(LETTERS.map((l) => [l, 0])) as Record<Letter, Accidental>;
  if (fifths > 0) SHARP_ORDER.slice(0, fifths).forEach((l) => (map[l] = 1));
  if (fifths < 0) FLAT_ORDER.slice(0, -fifths).forEach((l) => (map[l] = -1));
  return map;
}

/** Liste ordonnée des altérations de l'armure, ex. Fa♯, Do♯. */
export function keySignatureAccidentals(fifths: Fifths): { letter: Letter; accidental: Accidental }[] {
  if (fifths > 0) return SHARP_ORDER.slice(0, fifths).map((letter) => ({ letter, accidental: 1 as Accidental }));
  if (fifths < 0) return FLAT_ORDER.slice(0, -fifths).map((letter) => ({ letter, accidental: -1 as Accidental }));
  return [];
}

export function relativeKey(key: Key): Key {
  return keyFromFifths(fifthsOf(key), key.mode === 'major' ? 'minor' : 'major');
}

export function keyName(key: Key, notation: 'fr' | 'intl' = 'fr'): string {
  const name = notation === 'fr' ? FRENCH_NAMES[key.tonic.letter] : key.tonic.letter;
  const acc = ACCIDENTAL_SYMBOLS[key.tonic.accidental];
  if (notation === 'intl') return `${name}${acc} ${key.mode === 'major' ? 'major' : 'minor'}`;
  return `${name}${acc} ${key.mode === 'major' ? 'majeur' : 'mineur'}`;
}

/** Nom VexFlow de l'armure (VexFlow attend la tonalité majeure ou « Am »…). */
export function vexflowKeySpec(fifths: Fifths): string {
  const [l, a] = MAJOR_BY_FIFTHS[fifths] as [Letter, Accidental];
  return `${l}${a === 1 ? '#' : a === -1 ? 'b' : ''}`;
}

/**
 * Altérations à dessiner devant chaque note, compte tenu de l'armure.
 * Renvoie null quand l'armure suffit, 0 pour un bécarre nécessaire.
 * Chaque note est considérée isolément (pas de report d'altération dans la mesure).
 */
export function accidentalToDraw(pitch: Pitch, fifths: Fifths | null): Accidental | null {
  const implied = fifths == null ? 0 : keySignatureMap(fifths)[pitch.letter];
  if (pitch.accidental === implied) return null;
  return pitch.accidental;
}

export function sameTonic(a: Key['tonic'], b: Key['tonic']): boolean {
  return a.letter === b.letter && a.accidental === b.accidental;
}

export { letterIndex };
