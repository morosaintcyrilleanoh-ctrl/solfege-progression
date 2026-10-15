/**
 * Mesures (chiffrages), pulsation et vérification de la somme des durées.
 */
import { type Fraction, ZERO, add, compare, div, frac, sub, sum } from '@/lib/music/fraction';
import { type BaseValue, type RhythmEvent, eventDuration } from './durations';

export interface TimeSignature {
  /** Chiffre du haut. */
  beats: number;
  /** Chiffre du bas (2, 4, 8, 16). */
  unit: 2 | 4 | 8 | 16;
}

export const COMMON_TIME_SIGNATURES: TimeSignature[] = [
  { beats: 2, unit: 4 },
  { beats: 3, unit: 4 },
  { beats: 4, unit: 4 },
  { beats: 2, unit: 2 },
  { beats: 3, unit: 8 },
  { beats: 6, unit: 8 },
  { beats: 9, unit: 8 },
  { beats: 12, unit: 8 },
];

export function formatTimeSignature(ts: TimeSignature): string {
  return `${ts.beats}/${ts.unit}`;
}

/** Durée totale d'une mesure, en fraction de ronde. */
export function measureLength(ts: TimeSignature): Fraction {
  return frac(ts.beats, ts.unit);
}

/**
 * Mesure composée : chiffre du haut multiple de 3 et supérieur à 3 (6/8, 9/8, 12/8…),
 * le temps se divise en trois. Les autres sont des mesures simples.
 */
export function isCompound(ts: TimeSignature): boolean {
  return ts.beats > 3 && ts.beats % 3 === 0;
}

const UNIT_TO_VALUE: Record<TimeSignature['unit'], BaseValue> = { 2: 'half', 4: 'quarter', 8: 'eighth', 16: 'sixteenth' };

export interface Pulse {
  /** Nombre de temps dans la mesure. */
  beatsPerMeasure: number;
  /** Durée d'un temps, en fraction de ronde. */
  beatDuration: Fraction;
  /** Figure qui vaut un temps (pointée en mesure composée). */
  beatFigure: RhythmEvent;
  /** Division naturelle du temps : 2 (simple) ou 3 (composée). */
  subdivision: 2 | 3;
}

export function pulse(ts: TimeSignature): Pulse {
  const unitValue = UNIT_TO_VALUE[ts.unit];
  if (isCompound(ts)) {
    return {
      beatsPerMeasure: ts.beats / 3,
      beatDuration: frac(3, ts.unit),
      beatFigure: { value: UNIT_TO_VALUE[(ts.unit / 2) as TimeSignature['unit']] ?? unitValue, dots: 1 },
      subdivision: 3,
    };
  }
  return { beatsPerMeasure: ts.beats, beatDuration: frac(1, ts.unit), beatFigure: { value: unitValue }, subdivision: 2 };
}

/** Valeur d'une figure exprimée en temps de la mesure. */
export function durationInBeats(e: RhythmEvent, ts: TimeSignature): Fraction {
  return div(eventDuration(e), pulse(ts).beatDuration);
}

export type MeasureStatus = 'complete' | 'incomplete' | 'overfull';

export interface MeasureCheck {
  status: MeasureStatus;
  total: Fraction;
  expected: Fraction;
  /** Durée manquante (positive) ou en trop (négative). */
  difference: Fraction;
  /** n-olets incomplets (ex. triolet de deux croches seulement). */
  brokenTuplets: number[];
}

export function checkMeasure(events: RhythmEvent[], ts: TimeSignature): MeasureCheck {
  const total = sum(events.map(eventDuration));
  const expected = measureLength(ts);
  const difference = sub(expected, total);
  const c = compare(total, expected);

  const groups = new Map<number, { count: number; actual: number }>();
  for (const e of events) {
    if (!e.tuplet) continue;
    const g = groups.get(e.tuplet.group) ?? { count: 0, actual: e.tuplet.actual };
    g.count += 1;
    groups.set(e.tuplet.group, g);
  }
  const brokenTuplets = [...groups].filter(([, g]) => g.count !== g.actual).map(([id]) => id);

  return { status: c === 0 ? 'complete' : c < 0 ? 'incomplete' : 'overfull', total, expected, difference, brokenTuplets };
}

/** Position de début de chaque figure dans la mesure (utile pour la lecture sonore et les syncopes). */
export function onsets(events: RhythmEvent[]): Fraction[] {
  const result: Fraction[] = [];
  let t = ZERO;
  for (const e of events) {
    result.push(t);
    t = add(t, eventDuration(e));
  }
  return result;
}

/**
 * Syncope : une note qui commence sur une partie faible du temps (contretemps)
 * et se prolonge au-delà du temps fort suivant (en durée ou par une liaison).
 */
export function hasSyncopation(events: RhythmEvent[], ts: TimeSignature): boolean {
  const beat = pulse(ts).beatDuration;
  const starts = onsets(events);
  return events.some((e, i) => {
    if (e.rest) return false;
    const start = starts[i] as Fraction;
    const posInBeats = div(start, beat);
    if (posInBeats.d === 1) return false; // commence sur un temps
    let end = add(start, eventDuration(e));
    let j = i;
    while (events[j]?.tie && events[j + 1]) {
      j += 1;
      end = add(end, eventDuration(events[j] as RhythmEvent));
    }
    const nextBeat = frac(Math.floor(posInBeats.n / posInBeats.d) + 1);
    return compare(div(end, beat), nextBeat) > 0;
  });
}
