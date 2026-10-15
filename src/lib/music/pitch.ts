/**
 * Modèle de hauteur musicale, indépendant de toute interface.
 *
 * Une hauteur est décrite par son orthographe (lettre + altération) et son
 * octave, et non par un simple numéro de touche : Fa♯ et Sol♭ sonnent pareil
 * mais ne s'écrivent pas au même endroit sur la portée.
 *
 * Convention interne : octaves « scientifiques » (C4 = do central, A4 = 440 Hz).
 * L'affichage peut utiliser la convention française (Do3 = do central).
 */

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export type Letter = (typeof LETTERS)[number];

/** -2 = double bémol, -1 = bémol, 0 = naturel, 1 = dièse, 2 = double dièse */
export type Accidental = -2 | -1 | 0 | 1 | 2;

export interface Pitch {
  letter: Letter;
  accidental: Accidental;
  /** Octave scientifique : C4 = do central. */
  octave: number;
}

const LETTER_SEMITONES: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export const FRENCH_NAMES: Record<Letter, string> = {
  C: 'Do',
  D: 'Ré',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Si',
};

export const ACCIDENTAL_SYMBOLS: Record<Accidental, string> = {
  [-2]: '𝄫',
  [-1]: '♭',
  0: '',
  1: '♯',
  2: '𝄪',
};

export const ACCIDENTAL_NAMES_FR: Record<Accidental, string> = {
  [-2]: 'double bémol',
  [-1]: 'bémol',
  0: 'naturel',
  1: 'dièse',
  2: 'double dièse',
};

export function letterIndex(letter: Letter): number {
  return LETTERS.indexOf(letter);
}

/**
 * Index diatonique absolu : chaque pas = une ligne ou un interligne sur la portée.
 * C0 = 0, D0 = 1, … C4 = 28.
 */
export function diatonicIndex(p: Pick<Pitch, 'letter' | 'octave'>): number {
  return p.octave * 7 + letterIndex(p.letter);
}

export function pitchFromDiatonicIndex(index: number, accidental: Accidental = 0): Pitch {
  const octave = Math.floor(index / 7);
  const letter = LETTERS[index - octave * 7] as Letter;
  return { letter, accidental, octave };
}

/** Numéro MIDI (60 = C4). B♯3 et C4 donnent tous deux 60. */
export function midiNumber(p: Pitch): number {
  return 12 * (p.octave + 1) + LETTER_SEMITONES[p.letter] + p.accidental;
}

export function frequency(p: Pitch, a4 = 440): number {
  return a4 * Math.pow(2, (midiNumber(p) - 69) / 12);
}

export function samePitchSpelling(a: Pitch, b: Pitch): boolean {
  return a.letter === b.letter && a.accidental === b.accidental && a.octave === b.octave;
}

export function enharmonicallyEqual(a: Pitch, b: Pitch): boolean {
  return midiNumber(a) === midiNumber(b);
}

const ACCIDENTAL_ASCII: Record<Accidental, string> = { [-2]: 'bb', [-1]: 'b', 0: '', 1: '#', 2: '##' };

/** Clé texte stable, ex. « F#4 », « Bb2 ». Utilisée pour l'historique et les statistiques. */
export function pitchKey(p: Pitch): string {
  return `${p.letter}${ACCIDENTAL_ASCII[p.accidental]}${p.octave}`;
}

export function parsePitchKey(key: string): Pitch {
  const m = /^([A-G])(##|#|bb|b)?(-?\d+)$/.exec(key);
  if (!m) throw new Error(`Hauteur invalide : « ${key} »`);
  const acc = m[2] ?? '';
  const accidental = ({ '': 0, '#': 1, '##': 2, b: -1, bb: -2 } as const)[acc as '' | '#' | '##' | 'b' | 'bb'];
  return { letter: m[1] as Letter, accidental, octave: Number(m[3]) };
}

/** Notation française des octaves : Do3 = do central (C4). */
export type OctaveConvention = 'fr' | 'intl';
export type NameNotation = 'fr' | 'intl';

export function displayOctave(p: Pick<Pitch, 'octave'>, convention: OctaveConvention): number {
  return convention === 'fr' ? p.octave - 1 : p.octave;
}

export interface FormatOptions {
  notation?: NameNotation;
  octave?: OctaveConvention | false;
}

/** « Fa♯ 3 » (français) ou « F♯4 » (international). */
export function formatPitch(p: Pitch, { notation = 'fr', octave = 'fr' }: FormatOptions = {}): string {
  const name = notation === 'fr' ? FRENCH_NAMES[p.letter] : p.letter;
  const acc = ACCIDENTAL_SYMBOLS[p.accidental];
  if (octave === false) return `${name}${acc}`;
  const oct = displayOctave(p, octave);
  return notation === 'fr' ? `${name}${acc} ${oct}` : `${name}${acc}${oct}`;
}

const SHARP_SPELLINGS: [Letter, Accidental][] = [
  ['C', 0], ['C', 1], ['D', 0], ['D', 1], ['E', 0], ['F', 0],
  ['F', 1], ['G', 0], ['G', 1], ['A', 0], ['A', 1], ['B', 0],
];

/** Hauteur correspondant à un numéro MIDI, orthographiée avec des dièses (touche de clavier). */
export function pitchFromMidi(midi: number): Pitch {
  const pc = ((midi % 12) + 12) % 12;
  const [letter, accidental] = SHARP_SPELLINGS[pc] as [Letter, Accidental];
  return { letter, accidental, octave: Math.floor(midi / 12) - 1 };
}
