/**
 * Accords de trois sons (triades), renversements, degrés et fonctions.
 */
import { buildInterval, intervalBetween } from './intervals';
import { type Pitch, diatonicIndex, letterIndex, midiNumber } from './pitch';
import { ROMAN, type ScaleType, buildScale } from './scales';
import type { Key } from './keys';

export type TriadQuality = 'major' | 'minor' | 'diminished' | 'augmented';

export const TRIAD_NAMES_FR: Record<TriadQuality, string> = {
  major: 'majeur',
  minor: 'mineur',
  diminished: 'diminué',
  augmented: 'augmenté',
};

export type Inversion = 0 | 1 | 2;

export const INVERSION_NAMES_FR: Record<Inversion, string> = {
  0: 'état fondamental',
  1: '1er renversement',
  2: '2e renversement',
};

/** Chiffrage d'accompagnement : 5 (fondamental), 6 (1er renv.), 6/4 (2e renv.). */
export const INVERSION_FIGURES: Record<Inversion, string> = { 0: '5', 1: '6', 2: '6/4' };

export function buildTriad(root: Pitch, quality: TriadQuality, inversion: Inversion = 0): Pitch[] {
  const third = buildInterval(root, 3, quality === 'major' || quality === 'augmented' ? 'M' : 'm');
  const fifth = buildInterval(root, 5, quality === 'diminished' ? 'd' : quality === 'augmented' ? 'A' : 'P');
  const notes = [root, third, fifth];
  for (let i = 0; i < inversion; i++) {
    const n = notes.shift() as Pitch;
    notes.push({ ...n, octave: n.octave + 1 });
  }
  return notes;
}

export interface TriadAnalysis {
  root: Pitch;
  quality: TriadQuality;
  inversion: Inversion;
}

/**
 * Reconnaît une triade (notes dans n'importe quel ordre, en position serrée ou non).
 * La note la plus grave détermine le renversement.
 */
export function analyzeTriad(notes: Pitch[]): TriadAnalysis | null {
  if (notes.length !== 3) return null;
  const sorted = [...notes].sort((a, b) => diatonicIndex(a) - diatonicIndex(b) || midiNumber(a) - midiNumber(b));
  const bass = sorted[0] as Pitch;
  for (const candidate of sorted) {
    const others = sorted.filter((n) => n !== candidate);
    // Ramène chaque note au-dessus de la fondamentale candidate, dans l'octave.
    const above = others.map((n) => {
      let p = n;
      while (diatonicIndex(p) <= diatonicIndex(candidate)) p = { ...p, octave: p.octave + 1 };
      while (diatonicIndex(p) - diatonicIndex(candidate) >= 7) p = { ...p, octave: p.octave - 1 };
      return intervalBetween(candidate, p);
    });
    const third = above.find((i) => i.number === 3);
    const fifth = above.find((i) => i.number === 5);
    if (!third || !fifth) continue;
    let quality: TriadQuality | null = null;
    if (third.quality === 'M' && fifth.quality === 'P') quality = 'major';
    else if (third.quality === 'm' && fifth.quality === 'P') quality = 'minor';
    else if (third.quality === 'm' && fifth.quality === 'd') quality = 'diminished';
    else if (third.quality === 'M' && fifth.quality === 'A') quality = 'augmented';
    if (!quality) continue;
    // Renversement d'après le nom de la basse : fondamentale, tierce (2 lettres plus haut) ou quinte.
    const letterGap = (letterIndex(bass.letter) - letterIndex(candidate.letter) + 7) % 7;
    const inversion: Inversion = letterGap === 0 ? 0 : letterGap === 2 ? 1 : 2;
    return { root: candidate, quality, inversion };
  }
  return null;
}

export type HarmonicFunction = 'tonique' | 'sous-dominante' | 'dominante';

/** Fonction tonale principale de chaque degré. */
export const DEGREE_FUNCTION: Record<number, HarmonicFunction> = {
  1: 'tonique',
  2: 'sous-dominante',
  3: 'tonique',
  4: 'sous-dominante',
  5: 'dominante',
  6: 'tonique',
  7: 'dominante',
};

/** Accord construit sur un degré (1–7) ; en mineur, la gamme harmonique (sensible) est utilisée. */
export function triadOnDegree(key: Key, degree: number, octave = 4): { notes: Pitch[]; quality: TriadQuality; roman: string } {
  const type: ScaleType = key.mode === 'major' ? 'major' : 'harmonic-minor';
  const scale = buildScale(key.tonic, type, octave);
  const two = [...scale.slice(0, 7), ...buildScale(key.tonic, type, octave + 1).slice(0, 7)];
  const notes = [two[degree - 1], two[degree + 1], two[degree + 3]] as Pitch[];
  const analysis = analyzeTriad(notes);
  if (!analysis) throw new Error('Triade introuvable');
  const base = ROMAN[degree - 1] as string;
  const roman =
    analysis.quality === 'major' ? base : analysis.quality === 'minor' ? base.toLowerCase() : analysis.quality === 'diminished' ? `${base.toLowerCase()}°` : `${base}+`;
  return { notes, quality: analysis.quality, roman };
}

export type Cadence = 'parfaite' | 'plagale' | 'demi-cadence' | 'rompue';

export const CADENCES: { from: number; to: number; name: Cadence; description: string }[] = [
  { from: 5, to: 1, name: 'parfaite', description: 'V → I : conclusion forte' },
  { from: 4, to: 1, name: 'plagale', description: 'IV → I : conclusion douce' },
  { from: 1, to: 5, name: 'demi-cadence', description: '… → V : suspension, la phrase reste ouverte' },
  { from: 5, to: 6, name: 'rompue', description: 'V → VI : surprise, on attendait le I' },
];
