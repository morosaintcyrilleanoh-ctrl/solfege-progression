/**
 * Générateurs de questions théoriques sur le rythme.
 * Toutes les réponses sont calculées avec des fractions exactes.
 */
import { type Fraction, add, compare, div, equals, frac, formatFraction, mul, sub, toNumber } from '@/lib/music/fraction';
import type { DifficultyOption, ExerciseGenerator } from '@/lib/exercises/generators';
import type { McqQuestion, Question, ShortQuestion } from '@/lib/exercises/types';
import { mcqChoices, pick, questionId, shuffle } from '@/lib/exercises/util';
import { type Rng, defaultRng } from '@/lib/random';
import { type BaseValue, type RhythmEvent, NOTE_NAMES_FR, eventDuration, eventName, withArticle } from './durations';
import { figureGlyph } from './glyphs';
import {
  type TimeSignature,
  checkMeasure,
  durationInBeats,
  formatTimeSignature,
  hasSyncopation,
  isCompound,
  measureLength,
  pulse,
} from './meter';

export type Difficulty = 1 | 2 | 3;

/** Figures autorisées selon la difficulté. */
export function figuresFor(difficulty: Difficulty, { rests = true } = {}): RhythmEvent[] {
  const values: BaseValue[] = difficulty === 1 ? ['whole', 'half', 'quarter', 'eighth'] : ['whole', 'half', 'quarter', 'eighth', 'sixteenth'];
  const list: RhythmEvent[] = values.map((value) => ({ value }));
  if (rests) list.push(...values.map((value) => ({ value, rest: true })));
  if (difficulty >= 2) list.push({ value: 'half', dots: 1 }, { value: 'quarter', dots: 1 }, { value: 'eighth', dots: 1 });
  if (difficulty >= 3) list.push({ value: 'quarter', dots: 1, rest: true }, { value: 'half', dots: 2 }, { value: 'quarter', dots: 2 });
  return list;
}

export function timeSignaturesFor(difficulty: Difficulty): TimeSignature[] {
  const simple: TimeSignature[] = [
    { beats: 2, unit: 4 },
    { beats: 3, unit: 4 },
    { beats: 4, unit: 4 },
  ];
  if (difficulty === 1) return simple;
  const more: TimeSignature[] = [...simple, { beats: 2, unit: 2 }, { beats: 6, unit: 8 }, { beats: 3, unit: 8 }];
  if (difficulty === 2) return more;
  return [...more, { beats: 9, unit: 8 }, { beats: 12, unit: 8 }, { beats: 5, unit: 4 }];
}

function beatsLabel(f: Fraction): string {
  if (f.d === 1) return `${f.n} temps`;
  const whole = Math.floor(f.n / f.d);
  const rest = frac(f.n - whole * f.d, f.d);
  const part = rest.n === 1 && rest.d === 2 ? 'et demi' : `et ${formatFraction(rest)}`;
  if (whole === 0) return rest.n === 1 && rest.d === 2 ? '½ temps' : `${formatFraction(rest)} de temps`;
  return `${whole} temps ${part}`;
}

// ---------------------------------------------------------------------------
// 1. Durée d'une figure en temps (mesures simples à la noire)
// ---------------------------------------------------------------------------
export function figureValueQuestion(difficulty: Difficulty, rng: Rng = defaultRng): McqQuestion {
  const ts: TimeSignature = { beats: 4, unit: 4 };
  const pool = figuresFor(difficulty);
  if (difficulty >= 3) pool.push({ value: 'eighth', tuplet: { actual: 3, normal: 2, group: 0 } });
  const fig = pick(pool, rng);
  const value = durationInBeats(fig, ts);
  const candidates = [frac(4), frac(3), frac(2), frac(1), frac(1, 2), frac(1, 4), frac(3, 2), frac(3, 4), frac(1, 3), frac(7, 2), frac(6)];
  const distractors = shuffle(candidates.filter((c) => !equals(c, value)), rng).slice(0, 3).map(beatsLabel);
  const { choices, correct } = mcqChoices(beatsLabel(value), distractors, rng);
  const dotNote =
    fig.dots === 1 ? ' Le point ajoute la moitié de la valeur.' : fig.dots === 2 ? ' Le double point ajoute la moitié puis le quart de la valeur.' : '';
  const tupletNote = fig.tuplet ? ' Dans un triolet, trois croches prennent la place de deux : chacune vaut 1/3 de temps.' : '';
  return {
    type: 'mcq',
    id: questionId('rv', rng),
    skill: fig.rest ? 'rythme.silences' : fig.dots || fig.tuplet ? 'rythme.figures-pointees' : 'rythme.durees',
    prompt: `En 4/4 (la noire vaut un temps), combien de temps dure ${withArticle(fig)} ?`,
    notation: { kind: 'glyphs', glyphs: [figureGlyph(fig)] },
    choices,
    correct,
    explanation: `${capitalize(withArticle(fig))} dure ${beatsLabel(value)}.${dotNote}${tupletNote}`,
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// 2. Équivalences (réponse courte numérique)
// ---------------------------------------------------------------------------
export function equivalenceQuestion(difficulty: Difficulty, rng: Rng = defaultRng): ShortQuestion {
  const units: BaseValue[] = difficulty === 1 ? ['quarter', 'eighth'] : ['quarter', 'eighth', 'sixteenth'];
  let big: RhythmEvent;
  let unit: BaseValue;
  let count: Fraction;
  do {
    big = pick(figuresFor(difficulty, { rests: false }), rng);
    unit = pick(units, rng);
    count = div(eventDuration(big), frac(1, { quarter: 4, eighth: 8, sixteenth: 16 }[unit as 'quarter' | 'eighth' | 'sixteenth']));
  } while (count.d !== 1 || count.n < 2);
  return {
    type: 'short',
    id: questionId('eq', rng),
    skill: 'rythme.equivalences',
    prompt: `Combien de ${NOTE_NAMES_FR[unit]}s faut-il pour remplir ${withArticle(big)} ?`,
    notation: { kind: 'glyphs', glyphs: [figureGlyph(big), '=', `? × ${figureGlyph({ value: unit })}`] },
    accepted: [String(count.n)],
    answerKind: 'number',
    placeholder: 'Un nombre',
    explanation: `${capitalize(withArticle(big))} vaut ${count.n} ${NOTE_NAMES_FR[unit]}s.`,
  };
}

// ---------------------------------------------------------------------------
// 3. Remplissage aléatoire exact d'une durée
// ---------------------------------------------------------------------------
let tupletGroup = 1;

/** Remplit exactement `length` avec des figures autorisées. */
export function fillDuration(length: Fraction, difficulty: Difficulty, rng: Rng = defaultRng): RhythmEvent[] {
  const pool = figuresFor(difficulty).filter((f) => f.value !== 'whole' || compare(length, frac(1)) >= 0);
  const events: RhythmEvent[] = [];
  let remaining = length;
  let guard = 0;
  while (compare(remaining, frac(0)) > 0 && guard++ < 200) {
    // Triolet de croches (vaut une noire) en difficulté 3.
    if (difficulty >= 3 && compare(remaining, frac(1, 4)) >= 0 && rng() < 0.15) {
      const g = tupletGroup++;
      for (let i = 0; i < 3; i++) events.push({ value: 'eighth', tuplet: { actual: 3, normal: 2, group: g } });
      remaining = sub(remaining, frac(1, 4));
      continue;
    }
    const fitting = pool.filter((f) => compare(eventDuration(f), remaining) <= 0);
    // Préférer les figures moyennes pour des rythmes lisibles.
    const weighted = fitting.flatMap((f) => (f.value === 'sixteenth' ? [f] : f.value === 'whole' ? [f] : [f, f, f]));
    const choice = weighted.length ? pick(weighted, rng) : ({ value: 'sixteenth' } as RhythmEvent);
    events.push({ ...choice });
    remaining = sub(remaining, eventDuration(choice));
  }
  if (compare(remaining, frac(0)) !== 0) throw new Error('Remplissage impossible');
  return events;
}

export function randomMeasure(ts: TimeSignature, difficulty: Difficulty, rng: Rng = defaultRng): RhythmEvent[] {
  return fillDuration(measureLength(ts), difficulty, rng);
}

// ---------------------------------------------------------------------------
// 4. Compléter la mesure
// ---------------------------------------------------------------------------
export function completeMeasureQuestion(difficulty: Difficulty, rng: Rng = defaultRng): McqQuestion {
  const ts = pick(timeSignaturesFor(difficulty), rng);
  const length = measureLength(ts);
  const candidates = figuresFor(difficulty).filter((f) => compare(eventDuration(f), length) < 0);
  const missing = pick(candidates, rng);
  const before = fillDuration(sub(length, eventDuration(missing)), difficulty, rng);
  const check = checkMeasure(before, ts);

  const label = (f: RhythmEvent) => capitalize(eventName(f));
  const distractorPool = figuresFor(difficulty).filter((f) => !equals(eventDuration(f), eventDuration(missing)));
  const distractors = shuffle(distractorPool, rng).slice(0, 3);
  const options = shuffle([missing, ...distractors], rng);
  const choices = options.map((f, i) => ({ id: `c${i}`, label: label(f), glyph: figureGlyph(f) }));
  const correct = options.flatMap((f, i) => (equals(eventDuration(f), eventDuration(missing)) ? [`c${i}`] : []));

  return {
    type: 'mcq',
    id: questionId('cm', rng),
    skill: 'rythme.mesures',
    prompt: `Quelle figure complète cette mesure à ${formatTimeSignature(ts)} ?`,
    notation: { kind: 'rhythm', timeSignature: ts, measures: [before], missingEnd: true },
    choices,
    correct,
    explanation: `La mesure à ${formatTimeSignature(ts)} contient ${beatsLabel(div(length, pulse(ts).beatDuration))}${
      isCompound(ts) ? ` (temps = ${eventName(pulse(ts).beatFigure)})` : ''
    }. Il en manque ${beatsLabel(div(check.difference, pulse(ts).beatDuration))} : ${withArticle(missing)}.`,
  };
}

// ---------------------------------------------------------------------------
// 5. Trouver la mesure incorrecte
// ---------------------------------------------------------------------------
export function findErrorQuestion(difficulty: Difficulty, rng: Rng = defaultRng): McqQuestion {
  const ts = pick(timeSignaturesFor(difficulty), rng);
  const count = 3;
  const measures = Array.from({ length: count }, () => randomMeasure(ts, difficulty, rng));
  const wrongIndex = Math.floor(rng() * count);
  const target = measures[wrongIndex] as RhythmEvent[];
  // Ajoute ou retire une figure (hors n-olet) pour rendre la mesure fausse.
  const removable = target.map((e, i) => (e.tuplet ? -1 : i)).filter((i) => i >= 0);
  if (rng() < 0.5 && removable.length > 1) {
    target.splice(pick(removable, rng), 1);
  } else {
    const extra = pick(figuresFor(Math.min(difficulty, 2) as Difficulty, { rests: false }).filter((f) => f.value !== 'whole'), rng);
    target.splice(Math.floor(rng() * (target.length + 1)), 0, extra);
  }
  const check = checkMeasure(target, ts);
  const labels = measures.map((_, i) => String(i + 1));
  const choices = labels.map((l, i) => ({ id: `m${i}`, label: `Mesure ${l}` }));
  const beat = pulse(ts).beatDuration;
  const totalBeats = div(check.total, beat);
  const expectedBeats = div(check.expected, beat);
  return {
    type: 'mcq',
    id: questionId('fe', rng),
    skill: 'rythme.mesures',
    prompt: `Une de ces mesures à ${formatTimeSignature(ts)} est incorrecte. Laquelle ?`,
    notation: { kind: 'rhythm', timeSignature: ts, measures, labels },
    choices,
    correct: [`m${wrongIndex}`],
    explanation: `La mesure ${wrongIndex + 1} contient ${beatsLabel(totalBeats)} au lieu de ${beatsLabel(expectedBeats)} : elle est ${
      check.status === 'overfull' ? 'trop longue' : 'trop courte'
    }.`,
  };
}

// ---------------------------------------------------------------------------
// 6. Mesure simple ou composée, pulsation
// ---------------------------------------------------------------------------
export function meterTypeQuestion(difficulty: Difficulty, rng: Rng = defaultRng): McqQuestion {
  const ts = pick(timeSignaturesFor(Math.max(2, difficulty) as Difficulty), rng);
  const p = pulse(ts);
  const describe = (compound: boolean, beats: number, figure: RhythmEvent) =>
    `Mesure ${compound ? 'composée' : 'simple'} à ${beats} temps, ${eventName(figure)} = 1 temps`;
  const right = describe(isCompound(ts), p.beatsPerMeasure, p.beatFigure);
  const wrong = [
    describe(!isCompound(ts), isCompound(ts) ? ts.beats : p.beatsPerMeasure, isCompound(ts) ? { value: 'eighth' } : { ...p.beatFigure, dots: 1 }),
    describe(isCompound(ts), isCompound(ts) ? ts.beats : p.beatsPerMeasure + 1, p.beatFigure),
    describe(!isCompound(ts), p.beatsPerMeasure, isCompound(ts) ? { value: 'quarter' } : { value: 'half' }),
  ];
  const { choices, correct } = mcqChoices(right, wrong, rng);
  return {
    type: 'mcq',
    id: questionId('mt', rng),
    skill: 'rythme.pulsation',
    prompt: `Comment se compte la mesure à ${formatTimeSignature(ts)} ?`,
    notation: { kind: 'rhythm', timeSignature: ts, measures: [randomMeasure(ts, 1, rng)] },
    choices,
    correct,
    explanation: isCompound(ts)
      ? `En ${formatTimeSignature(ts)}, le chiffre du haut est un multiple de 3 : chaque temps se divise en trois ${NOTE_NAMES_FR[
          ({ 4: 'quarter', 8: 'eighth', 16: 'sixteenth', 2: 'half' } as const)[ts.unit]
        ]}s. Il y a ${p.beatsPerMeasure} temps, chacun vaut ${withArticle(p.beatFigure)}.`
      : `En ${formatTimeSignature(ts)}, il y a ${ts.beats} temps ; le chiffre du bas indique que ${withArticle(p.beatFigure)} vaut un temps, divisé en deux.`,
  };
}

// ---------------------------------------------------------------------------
// 7. Syncope
// ---------------------------------------------------------------------------
/** Cellules syncopées en 2/4 (chacune dure au plus une mesure). */
export const SYNCOPATED: RhythmEvent[][] = [
  [{ value: 'eighth' }, { value: 'quarter' }, { value: 'eighth' }],
  [{ value: 'eighth', rest: true }, { value: 'quarter' }, { value: 'eighth' }],
  [{ value: 'eighth' }, { value: 'eighth', tie: true }, { value: 'eighth' }, { value: 'eighth' }],
  [{ value: 'sixteenth' }, { value: 'eighth' }, { value: 'sixteenth', tie: true }, { value: 'eighth' }, { value: 'eighth' }],
];

export function syncopationQuestion(difficulty: Difficulty, rng: Rng = defaultRng): McqQuestion {
  const ts: TimeSignature = { beats: 2, unit: 4 };
  let measure: RhythmEvent[];
  if (rng() < 0.5) {
    measure = pick(difficulty >= 2 ? SYNCOPATED : SYNCOPATED.slice(0, 3), rng).map((e) => ({ ...e }));
    const used = measure.reduce((t, e) => add(t, eventDuration(e)), frac(0));
    if (compare(used, measureLength(ts)) < 0) measure.push(...fillDuration(sub(measureLength(ts), used), 1, rng));
  } else {
    measure = randomMeasure(ts, Math.min(difficulty, 2) as Difficulty, rng);
  }
  const yes = hasSyncopation(measure, ts);
  return {
    type: 'mcq',
    id: questionId('sy', rng),
    skill: 'rythme.syncopes',
    prompt: 'Ce rythme contient-il une syncope ?',
    notation: { kind: 'rhythm', timeSignature: ts, measures: [measure] },
    choices: [
      { id: 'yes', label: 'Oui, il y a une syncope' },
      { id: 'no', label: 'Non, pas de syncope' },
    ],
    correct: [yes ? 'yes' : 'no'],
    explanation: yes
      ? 'Une note commence sur la partie faible d’un temps (contretemps) et se prolonge sur le temps suivant : c’est une syncope.'
      : 'Aucune note ne commence sur un contretemps pour se prolonger au-delà du temps suivant : pas de syncope.',
  };
}

// ---------------------------------------------------------------------------
// 8. Tempo
// ---------------------------------------------------------------------------
export function tempoQuestion(difficulty: Difficulty, rng: Rng = defaultRng): McqQuestion {
  const bpm = pick(difficulty === 1 ? [60, 120] : [60, 90, 120], rng);
  const fig = pick(difficulty === 1 ? [{ value: 'half' }, { value: 'whole' }, { value: 'quarter' }] as RhythmEvent[] : figuresFor(2, { rests: false }), rng);
  const beats = durationInBeats(fig, { beats: 4, unit: 4 });
  const seconds = mul(beats, frac(60, bpm));
  const fmt = (f: Fraction) => `${toNumber(f).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} s`;
  const candidates = [frac(1, 2), frac(1), frac(3, 2), frac(2), frac(3), frac(4), frac(2, 3), frac(4, 3), frac(1, 4), frac(3, 4), frac(8, 3)];
  const distractors = shuffle(candidates.filter((c) => !equals(c, seconds)), rng).slice(0, 3).map(fmt);
  const { choices, correct } = mcqChoices(fmt(seconds), distractors, rng);
  return {
    type: 'mcq',
    id: questionId('tp', rng),
    skill: 'rythme.tempo',
    prompt: `Au tempo ♩ = ${bpm} (${bpm} noires par minute), combien de secondes dure ${withArticle(fig)} ?`,
    notation: { kind: 'glyphs', glyphs: [figureGlyph(fig)] },
    choices,
    correct,
    explanation: `À ${bpm} à la noire, une noire dure 60 ÷ ${bpm} = ${fmt(frac(60, bpm))}. ${capitalize(withArticle(fig))} vaut ${beatsLabel(
      beats,
    )}, soit ${fmt(seconds)}.`,
  };
}

const asDifficulty = (d: number): Difficulty => (d <= 1 ? 1 : d >= 3 ? 3 : 2);
const g =
  (fn: (d: Difficulty, rng?: Rng) => Question) =>
  (d: number, rng?: Rng) =>
    fn(asDifficulty(d), rng);

export const RHYTHM_DIFFICULTIES: DifficultyOption[] = [
  { value: 1, label: 'Débutant', description: 'Ronde à croche, silences, mesures 2/4, 3/4, 4/4.' },
  { value: 2, label: 'Intermédiaire', description: 'Doubles croches, figures pointées, 2/2, 3/8, 6/8.' },
  { value: 3, label: 'Avancé', description: 'Triolets, doubles points, 9/8, 12/8, 5/4.' },
];

export const RHYTHM_EXERCISES: ExerciseGenerator[] = [
  { id: 'figure-value', label: 'Durée des figures', description: 'Notes, silences, figures pointées et triolets.', minDifficulty: 1, generate: g(figureValueQuestion) },
  { id: 'equivalence', label: 'Équivalences', description: 'Combien de croches dans une blanche ?', minDifficulty: 1, generate: g(equivalenceQuestion) },
  { id: 'complete-measure', label: 'Compléter la mesure', description: 'Trouver la figure qui manque.', minDifficulty: 1, generate: g(completeMeasureQuestion) },
  { id: 'find-error', label: 'Trouver l’erreur', description: 'Repérer la mesure trop longue ou trop courte.', minDifficulty: 1, generate: g(findErrorQuestion) },
  { id: 'meter-type', label: 'Mesures et pulsation', description: 'Mesures simples et composées.', minDifficulty: 1, generate: g(meterTypeQuestion) },
  { id: 'syncopation', label: 'Syncopes', description: 'Reconnaître une syncope.', minDifficulty: 2, generate: g(syncopationQuestion) },
  { id: 'tempo', label: 'Tempo', description: 'Durée réelle d’une figure selon le tempo.', minDifficulty: 1, generate: g(tempoQuestion) },
];
