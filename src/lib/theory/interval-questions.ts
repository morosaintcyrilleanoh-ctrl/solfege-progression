/** Exercices du module 4 : intervalles, accords, renversements, fonctions, lecture mélodique, cadences. */
import type { DifficultyOption, ExerciseGenerator } from '@/lib/exercises/generators';
import type { McqQuestion, MatchQuestion, Question } from '@/lib/exercises/types';
import { mcqChoices, pick, questionId, shuffle } from '@/lib/exercises/util';
import { CADENCES, DEGREE_FUNCTION, INVERSION_NAMES_FR, type Inversion, TRIAD_NAMES_FR, type TriadQuality, buildTriad, triadOnDegree } from '@/lib/music/chords';
import { type Quality, buildInterval, intervalBetween, intervalName, tonesLabel } from '@/lib/music/intervals';
import { keyFromFifths, keyName, vexflowKeySpec } from '@/lib/music/keys';
import { type Accidental, type Letter, type Pitch, LETTERS, formatPitch } from '@/lib/music/pitch';
import { buildScale } from '@/lib/music/scales';
import { type Rng, defaultRng } from '@/lib/random';
import { noteDistractors, noteName } from './common';

type IntervalSpec = [number, Quality];

function intervalPool(d: number): IntervalSpec[] {
  const base: IntervalSpec[] = [[2, 'm'], [2, 'M'], [3, 'm'], [3, 'M'], [4, 'P'], [5, 'P'], [8, 'P']];
  if (d <= 1) return base;
  const mid: IntervalSpec[] = [...base, [6, 'm'], [6, 'M'], [7, 'm'], [7, 'M'], [4, 'A'], [5, 'd']];
  if (d === 2) return mid;
  return [...mid, [2, 'A'], [3, 'd'], [5, 'A'], [7, 'd'], [6, 'A']];
}

function randomRoot(d: number, rng: Rng): Pitch {
  const letter = pick(LETTERS, rng);
  const accidental = (d <= 1 ? 0 : pick([-1, 0, 0, 0, 1], rng)) as Accidental;
  return { letter, accidental, octave: 4 };
}

function safeBuild(rng: Rng, d: number, make: (root: Pitch) => Pitch[] | null): { root: Pitch; notes: Pitch[] } {
  for (let i = 0; i < 50; i++) {
    const root = randomRoot(d, rng);
    try {
      const notes = make(root);
      if (notes && notes.every((n) => Math.abs(n.accidental) <= 1)) return { root, notes };
    } catch {
      // intervalle impossible à écrire : on recommence
    }
  }
  throw new Error('Construction impossible');
}

// 1. Identifier un intervalle
export function identifyIntervalQuestion(d: number, rng: Rng = defaultRng): McqQuestion {
  const spec = pick(intervalPool(d), rng);
  const { notes } = safeBuild(rng, d, (root) => [root, buildInterval(root, spec[0], spec[1])]);
  const harmonic = d >= 2 && rng() < 0.5;
  const name = intervalName({ number: spec[0], quality: spec[1] });
  const distract = shuffle(intervalPool(Math.max(d, 2)).map(([n, q]) => intervalName({ number: n, quality: q })), rng)
    .filter((n) => n !== name)
    // Distracteurs proches : même nombre ou nombre voisin.
    .sort((a, b) => Number(!a.startsWith(name.split(' ')[0] as string)) - Number(!b.startsWith(name.split(' ')[0] as string)))
    .slice(0, 3);
  const { choices, correct } = mcqChoices(name, distract, rng);
  const semis = intervalBetween(notes[0] as Pitch, notes[1] as Pitch).semitones;
  return {
    type: 'mcq',
    id: questionId('ii', rng),
    skill: 'intervalles.identification',
    prompt: `Quel est cet intervalle ${harmonic ? 'harmonique' : 'mélodique'} ?`,
    notation: { kind: 'notes', clef: 'treble', notes, layout: harmonic ? 'harmonic' : 'melodic', forceAccidentals: true },
    choices,
    correct,
    explanation: `${noteName(notes[0] as Pitch)} – ${noteName(notes[1] as Pitch)} : on compte ${spec[0]} noms de notes (${spec[0] === 8 ? 'octave' : `${spec[0]}e`}) et ${semis} demi-tons (${tonesLabel(semis)}) : ${name}.`,
  };
}

// 2. Construire un intervalle
export function buildIntervalQuestion(d: number, rng: Rng = defaultRng): McqQuestion {
  const spec = pick(intervalPool(d).filter(([n]) => n !== 8), rng);
  const { notes } = safeBuild(rng, d, (root) => [root, buildInterval(root, spec[0], spec[1])]);
  const [root, target] = notes as [Pitch, Pitch];
  const name = intervalName({ number: spec[0], quality: spec[1] });
  const { choices, correct } = mcqChoices(noteName(target), shuffle(noteDistractors(target), rng).slice(0, 3).map(noteName), rng);
  return {
    type: 'mcq',
    id: questionId('bi', rng),
    skill: 'intervalles.construction',
    prompt: `Quelle note forme une ${name} au-dessus de ${noteName(root)} ?`,
    notation: { kind: 'notes', clef: 'treble', notes: [root], layout: 'melodic', forceAccidentals: true },
    choices,
    correct,
    explanation: `Une ${name} au-dessus de ${noteName(root)} : ${spec[0]} noms de notes plus haut (${noteName({ letter: target.letter, accidental: 0 })}), puis on ajuste l’altération pour obtenir ${tonesLabel(intervalBetween(root, target).semitones)} : ${noteName(target)}.`,
  };
}

// 3. Qualité d'un accord
export function triadQualityQuestion(d: number, rng: Rng = defaultRng): McqQuestion {
  const qualities: TriadQuality[] = d <= 1 ? ['major', 'minor'] : ['major', 'minor', 'diminished', 'augmented'];
  const quality = pick(qualities, rng);
  const { root, notes } = safeBuild(rng, d, (r) => buildTriad(r, quality));
  return {
    type: 'mcq',
    id: questionId('tq', rng),
    skill: 'accords.qualite',
    prompt: 'Quelle est la nature de cet accord ?',
    notation: { kind: 'notes', clef: 'treble', notes, layout: 'harmonic', forceAccidentals: true },
    choices: qualities.map((q) => ({ id: q, label: `Accord ${TRIAD_NAMES_FR[q]}` })),
    correct: [quality],
    explanation: `${notes.map(noteName).join(' – ')} : ${
      {
        major: 'tierce majeure + quinte juste',
        minor: 'tierce mineure + quinte juste',
        diminished: 'tierce mineure + quinte diminuée',
        augmented: 'tierce majeure + quinte augmentée',
      }[quality]
    } au-dessus de ${noteName(root)} : accord de ${noteName(root)} ${TRIAD_NAMES_FR[quality]}.`,
  };
}

// 4. Renversements
export function inversionQuestion(d: number, rng: Rng = defaultRng): McqQuestion {
  const inversion = pick<Inversion>([0, 1, 2], rng);
  const quality = pick<TriadQuality>(d <= 1 ? ['major'] : ['major', 'minor'], rng);
  const { root, notes } = safeBuild(rng, d, (r) => buildTriad({ ...r, octave: 4 }, quality, inversion));
  return {
    type: 'mcq',
    id: questionId('iv', rng),
    skill: 'accords.renversements',
    prompt: `Cet accord de ${noteName(root)} ${TRIAD_NAMES_FR[quality]} est à quel état ?`,
    notation: { kind: 'notes', clef: 'treble', notes, layout: 'harmonic', forceAccidentals: true },
    choices: ([0, 1, 2] as Inversion[]).map((i) => ({ id: `i${i}`, label: INVERSION_NAMES_FR[i] })),
    correct: [`i${inversion}`],
    explanation: `La note la plus grave est ${noteName(notes[0] as Pitch)} : ${
      inversion === 0 ? 'la fondamentale' : inversion === 1 ? 'la tierce' : 'la quinte'
    } de l’accord, donc ${INVERSION_NAMES_FR[inversion]}.`,
  };
}

// 5. Degrés et fonctions harmoniques
export function functionQuestion(d: number, rng: Rng = defaultRng): McqQuestion {
  const fifths = Math.floor(rng() * (d <= 2 ? 5 : 9)) - (d <= 2 ? 2 : 4);
  const key = keyFromFifths(fifths, d >= 3 && rng() < 0.4 ? 'minor' : 'major');
  const degree = pick([1, 2, 4, 5, 6, 7], rng);
  const chord = triadOnDegree(key, degree, 4);
  const label = (deg: number) => `${triadOnDegree(key, deg).roman} – ${DEGREE_FUNCTION[deg]}`;
  const others = shuffle([1, 2, 3, 4, 5, 6, 7].filter((x) => x !== degree), rng).slice(0, 3).map(label);
  const { choices, correct } = mcqChoices(label(degree), others, rng);
  return {
    type: 'mcq',
    id: questionId('fn', rng),
    skill: 'accords.fonctions',
    prompt: `En ${keyName(key)}, sur quel degré est construit cet accord, et quelle est sa fonction ?`,
    notation: { kind: 'notes', clef: 'treble', keySignature: vexflowKeySpec(fifths), notes: chord.notes, layout: 'harmonic' },
    choices,
    correct,
    explanation: `${chord.notes.map(noteName).join(' – ')} a pour fondamentale le ${degree}e degré de ${keyName(key)} : ${chord.roman}, fonction de ${DEGREE_FUNCTION[degree]}.`,
  };
}

// 6. Association intervalle ↔ nombre de tons
export function intervalTonesMatchQuestion(d: number, rng: Rng = defaultRng): MatchQuestion {
  const pool = shuffle(intervalPool(d), rng);
  const seen = new Set<string>();
  const pairs: { left: string; right: string }[] = [];
  for (const [n, q] of pool) {
    const semis = intervalBetween({ letter: 'C', accidental: 0, octave: 4 }, buildInterval({ letter: 'C', accidental: 0, octave: 4 }, n, q)).semitones;
    const right = tonesLabel(semis);
    if (seen.has(right)) continue;
    seen.add(right);
    pairs.push({ left: capitalize(intervalName({ number: n, quality: q })), right });
    if (pairs.length === 4) break;
  }
  return {
    type: 'match',
    id: questionId('mt', rng),
    skill: 'intervalles.identification',
    prompt: 'Associe chaque intervalle à son nombre de tons.',
    pairs,
    explanation: pairs.map((p) => `${p.left} = ${p.right}`).join(' ; ') + '.',
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// 7. Lecture mélodique
export function melodicReadingQuestion(d: number, rng: Rng = defaultRng): McqQuestion {
  const fifths = d <= 1 ? 0 : Math.floor(rng() * 5) - 2;
  const key = keyFromFifths(fifths, 'major');
  const scale = [...buildScale(key.tonic, 'major', 4).slice(0, 7), ...buildScale(key.tonic, 'major', 5)];
  const length = d <= 1 ? 4 : d === 2 ? 5 : 6;
  let idx = Math.floor(rng() * 5);
  const melody: Pitch[] = [];
  for (let i = 0; i < length; i++) {
    melody.push(scale[idx] as Pitch);
    const leap = d >= 3 && rng() < 0.3 ? pick([-3, -2, 2, 3], rng) : pick([-1, 1, 1, -1, 2], rng);
    idx = Math.max(0, Math.min(scale.length - 1, idx + leap));
  }
  const fmt = (list: Pitch[]) => list.map((p) => formatPitch(p, { octave: false })).join(' – ');
  const right = fmt(melody);
  const distractors: string[] = [];
  for (let k = 0; k < 10 && distractors.length < 3; k++) {
    const copy = [...melody];
    const pos = 1 + Math.floor(rng() * (length - 1));
    const i = scale.findIndex((s) => s.letter === copy[pos]?.letter && s.octave === copy[pos]?.octave);
    copy[pos] = scale[Math.max(0, Math.min(scale.length - 1, i + pick([-1, 1], rng)))] as Pitch;
    const label = fmt(copy);
    if (label !== right && !distractors.includes(label)) distractors.push(label);
  }
  const { choices, correct } = mcqChoices(right, distractors, rng);
  return {
    type: 'mcq',
    id: questionId('ml', rng),
    skill: 'lecture.melodique',
    prompt: `Lis cette mélodie en ${keyName(key)}. Quelle est la suite de notes ?`,
    notation: { kind: 'notes', clef: 'treble', keySignature: vexflowKeySpec(fifths), notes: melody, layout: 'melodic' },
    choices,
    correct,
    explanation: `La mélodie est : ${right}.${fifths !== 0 ? ' N’oublie pas les altérations de l’armure.' : ''}`,
  };
}

// 8. Cadences
export function cadenceQuestion(d: number, rng: Rng = defaultRng): McqQuestion {
  const key = keyFromFifths(Math.floor(rng() * 5) - 2, 'major');
  const cad = pick(CADENCES, rng);
  const a = triadOnDegree(key, cad.from);
  const b = triadOnDegree(key, cad.to);
  const from = cad.name === 'demi-cadence' ? pick([1, 2, 4], rng) : cad.from;
  const first = cad.name === 'demi-cadence' ? triadOnDegree(key, from) : a;
  return {
    type: 'mcq',
    id: questionId('cd', rng),
    skill: 'accords.fonctions',
    prompt: `En ${keyName(key)}, la phrase se termine par l’enchaînement ${first.notes.map(noteName).join('-')} → ${b.notes.map(noteName).join('-')}. Quelle cadence est-ce ?`,
    choices: CADENCES.map((c) => ({ id: c.name, label: `Cadence ${c.name === 'demi-cadence' ? '(demi-cadence)' : c.name}` })),
    correct: [cad.name],
    explanation: `${first.roman} → ${b.roman} : ${CADENCES.find((c) => c.name === cad.name)?.description}.`,
  };
}

export const INTERVAL_DIFFICULTIES: DifficultyOption[] = [
  { value: 1, label: 'Intermédiaire', description: 'Intervalles courants, accords majeurs et mineurs, Do majeur.' },
  { value: 2, label: 'Avancé', description: 'Toutes les qualités, notes altérées, intervalles harmoniques, renversements.' },
  { value: 3, label: 'Expert', description: 'Intervalles augmentés et diminués, mineur, cadences, mélodies plus longues.' },
];

export const INTERVAL_EXERCISES: ExerciseGenerator[] = [
  { id: 'identify-interval', label: 'Identifier un intervalle', description: 'Nombre et qualité.', minDifficulty: 1, generate: identifyIntervalQuestion },
  { id: 'build-interval', label: 'Construire un intervalle', description: 'Trouver la note au-dessus.', minDifficulty: 1, generate: buildIntervalQuestion },
  { id: 'interval-tones', label: 'Intervalles et tons', description: 'Association.', minDifficulty: 1, generate: intervalTonesMatchQuestion },
  { id: 'triad-quality', label: 'Accords', description: 'Majeur, mineur, diminué, augmenté.', minDifficulty: 1, generate: triadQualityQuestion },
  { id: 'inversion', label: 'Renversements', description: 'État fondamental, 1er, 2e renversement.', minDifficulty: 1, generate: inversionQuestion },
  { id: 'function', label: 'Degrés et fonctions', description: 'Tonique, sous-dominante, dominante.', minDifficulty: 2, generate: functionQuestion },
  { id: 'melodic-reading', label: 'Lecture mélodique', description: 'Lire une courte mélodie.', minDifficulty: 1, generate: melodicReadingQuestion },
  { id: 'cadence', label: 'Analyse : cadences', description: 'Parfaite, plagale, demi-cadence, rompue.', minDifficulty: 3, generate: cadenceQuestion },
];

export type { Question, Letter };
