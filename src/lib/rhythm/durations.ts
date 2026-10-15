/**
 * Figures de notes et de silences, valeurs exactes et vocabulaire français.
 * La ronde vaut 1 ; une noire vaut 1/4 de ronde.
 */
import { type Fraction, div, frac, mul } from '@/lib/music/fraction';

export const BASE_VALUES = ['whole', 'half', 'quarter', 'eighth', 'sixteenth'] as const;
export type BaseValue = (typeof BASE_VALUES)[number];

export const BASE_FRACTION: Record<BaseValue, Fraction> = {
  whole: frac(1),
  half: frac(1, 2),
  quarter: frac(1, 4),
  eighth: frac(1, 8),
  sixteenth: frac(1, 16),
};

export const NOTE_NAMES_FR: Record<BaseValue, string> = {
  whole: 'ronde',
  half: 'blanche',
  quarter: 'noire',
  eighth: 'croche',
  sixteenth: 'double croche',
};

export const REST_NAMES_FR: Record<BaseValue, string> = {
  whole: 'pause',
  half: 'demi-pause',
  quarter: 'soupir',
  eighth: 'demi-soupir',
  sixteenth: 'quart de soupir',
};

/** Code de durée VexFlow. */
export const VEXFLOW_DURATION: Record<BaseValue, string> = {
  whole: 'w',
  half: 'h',
  quarter: 'q',
  eighth: '8',
  sixteenth: '16',
};

export interface RhythmEvent {
  value: BaseValue;
  rest?: boolean;
  /** 0, 1 (pointée) ou 2 (double pointée). */
  dots?: 0 | 1 | 2;
  /**
   * Appartenance à un n-olet : `{ actual: 3, normal: 2, group }` = triolet
   * (3 figures à la place de 2). `group` identifie les figures du même n-olet.
   */
  tuplet?: { actual: number; normal: number; group: number };
  /** Liaison vers la figure suivante (syncope liée). */
  tie?: boolean;
}

/** Durée exacte d'une figure, en fraction de ronde. */
export function eventDuration(e: RhythmEvent): Fraction {
  let d = BASE_FRACTION[e.value];
  if (e.dots === 1) d = mul(d, frac(3, 2));
  if (e.dots === 2) d = mul(d, frac(7, 4));
  if (e.tuplet) d = mul(d, frac(e.tuplet.normal, e.tuplet.actual));
  return d;
}

export function eventName(e: RhythmEvent): string {
  let name = e.rest ? REST_NAMES_FR[e.value] : NOTE_NAMES_FR[e.value];
  if (e.dots === 1) name += e.rest ? ' pointé' : ' pointée';
  if (e.dots === 2) name += e.rest ? ' doublement pointé' : ' doublement pointée';
  // Accord : soupir, demi-soupir et quart de soupir sont masculins ; pause, demi-pause féminins.
  if (e.rest && (e.value === 'whole' || e.value === 'half')) name = name.replace(' pointé', ' pointée');
  if (e.tuplet) name += ` de ${e.tuplet.actual === 3 ? 'triolet' : `${e.tuplet.actual}-olet`}`;
  return name;
}

/** Valeur exprimée dans une unité (ex. combien de croches dans une blanche pointée). */
export function countIn(duration: Fraction, unit: BaseValue): Fraction {
  return div(duration, BASE_FRACTION[unit]);
}

export const ARTICLE_FR: Record<BaseValue, { note: string; rest: string }> = {
  whole: { note: 'une', rest: 'une' },
  half: { note: 'une', rest: 'une' },
  quarter: { note: 'une', rest: 'un' },
  eighth: { note: 'une', rest: 'un' },
  sixteenth: { note: 'une', rest: 'un' },
};

export function withArticle(e: RhythmEvent): string {
  const art = e.rest ? ARTICLE_FR[e.value].rest : ARTICLE_FR[e.value].note;
  return `${art} ${eventName(e)}`;
}
