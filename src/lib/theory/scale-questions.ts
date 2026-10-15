/** Exercices du module 3 : tons et demi-tons, armures, gammes, degrés, tonalités. */
import type { DifficultyOption, ExerciseGenerator } from '@/lib/exercises/generators';
import type { McqQuestion, Question, ShortQuestion } from '@/lib/exercises/types';
import { mcqChoices, pick, questionId, shuffle } from '@/lib/exercises/util';
import { type StepKind, stepKind } from '@/lib/music/intervals';
import { type Key, type Mode, keyFromFifths, keyName, keySignatureAccidentals, relativeKey, vexflowKeySpec } from '@/lib/music/keys';
import { type Accidental, type Letter, type Pitch, LETTERS } from '@/lib/music/pitch';
import { type ScaleType, SCALE_NAMES_FR, buildScale, degreeName } from '@/lib/music/scales';
import type { Clef } from '@/lib/music/staff';
import { type Rng, defaultRng } from '@/lib/random';
import { noteAnswerVariants, noteDistractors, noteName } from './common';

/** Nombre maximal d'altérations à l'armure selon la difficulté. */
function maxFifths(d: number): number {
  return d <= 1 ? 2 : d === 2 ? 4 : 7;
}

function randomKey(d: number, rng: Rng, modes: Mode[] = ['major']): { key: Key; fifths: number } {
  const m = maxFifths(d);
  const fifths = Math.floor(rng() * (2 * m + 1)) - m;
  return { key: keyFromFifths(fifths, pick(modes, rng)), fifths };
}

function clefFor(rng: Rng): Clef {
  return rng() < 0.75 ? 'treble' : 'bass';
}

function octaveFor(clef: Clef, letter: Letter): number {
  // Garde la gamme dans la portée : clé de sol vers Do4/Ré4, clé de fa vers Do3.
  const i = LETTERS.indexOf(letter);
  return clef === 'treble' ? (i >= 4 ? 3 : 4) : i >= 4 ? 2 : 3;
}

function signatureLabel(fifths: number): string {
  if (fifths === 0) return 'Aucune altération';
  const n = Math.abs(fifths);
  return `${n} ${fifths > 0 ? `dièse${n > 1 ? 's' : ''}` : `bémol${n > 1 ? 's' : ''}`}`;
}

// 1. Ton ou demi-ton
export function toneSemitoneQuestion(d: number, rng: Rng = defaultRng): McqQuestion {
  const kinds: StepKind[] = d <= 1 ? ['ton', 'demi-ton diatonique'] : ['ton', 'demi-ton diatonique', 'demi-ton chromatique'];
  const want = pick(kinds, rng);
  let a: Pitch;
  let b: Pitch;
  do {
    const letter = pick(LETTERS, rng);
    const acc = (d <= 1 ? 0 : pick([-1, 0, 0, 1], rng)) as Accidental;
    a = { letter, accidental: acc, octave: 4 };
    if (want === 'demi-ton chromatique') b = { ...a, accidental: (acc + 1) as Accidental };
    else {
      const next = LETTERS[(LETTERS.indexOf(letter) + 1) % 7] as Letter;
      const nat = { letter: next, accidental: 0 as Accidental, octave: next === 'C' ? 5 : 4 };
      const target = want === 'ton' ? 2 : 1;
      const semis = (({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 })[next] + (next === 'C' ? 12 : 0)) - (({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 })[letter] + acc);
      b = { ...nat, accidental: (target - semis) as Accidental };
    }
  } while (Math.abs(b.accidental) > 1 || stepKind(a, b) !== want);
  const labels: Record<StepKind, string> = {
    ton: 'Un ton',
    'demi-ton diatonique': d <= 1 ? 'Un demi-ton' : 'Un demi-ton diatonique',
    'demi-ton chromatique': 'Un demi-ton chromatique',
    autre: 'Autre',
  };
  const choices = kinds.map((k) => ({ id: k, label: labels[k] }));
  return {
    type: 'mcq',
    id: questionId('ts', rng),
    skill: 'tonalites.tons',
    prompt: `Quel est l’écart entre ${noteName(a)} et ${noteName(b)} ?`,
    notation: { kind: 'notes', clef: 'treble', notes: [a, b], layout: 'melodic', forceAccidentals: true },
    choices,
    correct: [want],
    explanation:
      want === 'ton'
        ? `${noteName(a)} – ${noteName(b)} : deux noms voisins séparés de 2 demi-tons, c’est un ton.`
        : want === 'demi-ton chromatique'
          ? `${noteName(a)} – ${noteName(b)} : même nom de note, un demi-ton : demi-ton chromatique.`
          : `${noteName(a)} – ${noteName(b)} : deux noms voisins séparés d’un seul demi-ton : demi-ton${d <= 1 ? '' : ' diatonique'}.`,
  };
}

// 2. Armure d'une tonalité
export function signatureCountQuestion(d: number, rng: Rng = defaultRng): McqQuestion {
  const { key, fifths } = randomKey(d, rng, d >= 2 ? ['major', 'minor'] : ['major']);
  const others = shuffle(
    [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7].filter((f) => f !== fifths && Math.abs(f - fifths) <= 4),
    rng,
  ).slice(0, 3);
  const { choices, correct } = mcqChoices(signatureLabel(fifths), others.map(signatureLabel), rng);
  const list = keySignatureAccidentals(fifths).map(noteName).join(', ');
  return {
    type: 'mcq',
    id: questionId('sc', rng),
    skill: 'tonalites.armures',
    prompt: `Combien d’altérations à l’armure de ${keyName(key)} ?`,
    choices,
    correct,
    explanation: `${keyName(key)} : ${signatureLabel(fifths).toLowerCase()}${list ? ` (${list})` : ''}.${
      key.mode === 'minor' ? ` C’est l’armure de son relatif majeur, ${keyName(relativeKey(key))}.` : ''
    }`,
  };
}

// 3. Reconnaître la tonalité d'après l'armure
export function identifyKeyQuestion(d: number, rng: Rng = defaultRng): McqQuestion {
  const { fifths } = randomKey(d, rng);
  const major = keyFromFifths(fifths, 'major');
  const minor = keyFromFifths(fifths, 'minor');
  const clef = clefFor(rng);
  const label = (f: number) => (d >= 2 ? `${keyName(keyFromFifths(f, 'major'))} ou ${keyName(keyFromFifths(f, 'minor'))}` : keyName(keyFromFifths(f, 'major')));
  const near = shuffle([fifths - 1, fifths + 1, -fifths, fifths + 2, fifths - 2].filter((f) => f !== fifths && f >= -7 && f <= 7), rng).slice(0, 3);
  const { choices, correct } = mcqChoices(label(fifths), near.map(label), rng);
  const rule =
    fifths > 0
      ? 'Avec des dièses, la tonique majeure est un demi-ton au-dessus du dernier dièse.'
      : fifths < -1
        ? 'Avec des bémols, la tonique majeure est l’avant-dernier bémol.'
        : fifths === -1
          ? 'Un seul bémol (Si♭) : Fa majeur.'
          : 'Aucune altération : Do majeur.';
  return {
    type: 'mcq',
    id: questionId('ik', rng),
    skill: 'tonalites.identification',
    prompt: d >= 2 ? 'Quelles tonalités ont cette armure ?' : 'Quelle tonalité majeure a cette armure ?',
    notation: { kind: 'keySignature', clef, keySignature: vexflowKeySpec(fifths) },
    choices,
    correct,
    explanation: `${rule} ${keyName(major)}${d >= 2 ? ` ; son relatif mineur, ${keyName(minor)}, a la même armure` : ''}.`,
  };
}

// 4. Degrés de la gamme
export function degreeQuestion(d: number, rng: Rng = defaultRng): Question {
  const { key } = randomKey(d, rng, d >= 3 ? ['major', 'minor'] : ['major']);
  const type: ScaleType = key.mode === 'major' ? 'major' : 'harmonic-minor';
  const scale = buildScale(key.tonic, type, 4);
  const degree = 2 + Math.floor(rng() * 6); // 2 à 7
  const target = scale[degree - 1] as Pitch;
  const name = degreeName(scale, degree);
  const scaleLabel = key.mode === 'major' ? keyName(key) : `${keyName(key)} (gamme harmonique)`;
  if (d >= 2 && rng() < 0.4) {
    const q: ShortQuestion = {
      type: 'short',
      id: questionId('dg', rng),
      skill: 'tonalites.degres',
      prompt: `Écris le nom du ${degree}e degré (${name}) de ${scaleLabel}.`,
      accepted: noteAnswerVariants(target),
      answerKind: 'text',
      placeholder: 'ex. Fa♯ ou fa dièse',
      explanation: `Gamme de ${scaleLabel} : ${scale.slice(0, 7).map(noteName).join(' – ')}. Le ${degree}e degré est ${noteName(target)}.`,
    };
    return q;
  }
  const { choices, correct } = mcqChoices(noteName(target), shuffle(noteDistractors(target), rng).slice(0, 3).map(noteName), rng);
  return {
    type: 'mcq',
    id: questionId('dg', rng),
    skill: 'tonalites.degres',
    prompt: `Quelle est la ${name} (${degree}e degré) de ${scaleLabel} ?`,
    choices,
    correct,
    explanation: `Gamme de ${scaleLabel} : ${scale.slice(0, 7).map(noteName).join(' – ')}. Le ${degree}e degré est ${noteName(target)}.`,
  };
}

// 5. Altérations d'une gamme majeure
export function scaleAccidentalsQuestion(d: number, rng: Rng = defaultRng): McqQuestion {
  const { key, fifths } = randomKey(Math.max(d, 2), rng);
  const list = (f: number) => {
    const acc = keySignatureAccidentals(f).map(noteName);
    return acc.length ? acc.join(', ') : 'Aucune altération';
  };
  const near = shuffle([fifths - 1, fifths + 1, -fifths, fifths + 2].filter((f) => f !== fifths && f >= -7 && f <= 7), rng).slice(0, 3);
  const { choices, correct } = mcqChoices(list(fifths), near.map(list), rng);
  return {
    type: 'mcq',
    id: questionId('sa', rng),
    skill: 'tonalites.gammes-majeures',
    prompt: `Quelles altérations contient la gamme de ${keyName(key)} ?`,
    choices,
    correct,
    explanation: `${keyName(key)} : ${buildScale(key.tonic, 'major').slice(0, 7).map(noteName).join(' – ')}.`,
  };
}

// 6. Type de gamme mineure
export function minorTypeQuestion(d: number, rng: Rng = defaultRng): McqQuestion {
  const { key } = randomKey(Math.min(d, 2), rng, ['minor']);
  const type = pick<ScaleType>(['natural-minor', 'harmonic-minor', 'melodic-minor'], rng);
  const clef: Clef = 'treble';
  const scale = buildScale(key.tonic, type, octaveFor(clef, key.tonic.letter));
  const types: ScaleType[] = ['natural-minor', 'harmonic-minor', 'melodic-minor'];
  const why: Record<ScaleType, string> = {
    'natural-minor': 'Aucune note n’est élevée : ce sont les notes de l’armure.',
    'harmonic-minor': 'Seul le 7e degré est élevé (sensible), d’où l’intervalle d’un ton et demi entre le 6e et le 7e degré.',
    'melodic-minor': 'Le 6e et le 7e degré sont élevés à la montée.',
    major: '',
  };
  return {
    type: 'mcq',
    id: questionId('mn', rng),
    skill: 'tonalites.gammes-mineures',
    prompt: `Cette gamme de ${keyName(key)} (montante) est la gamme mineure…`,
    notation: { kind: 'notes', clef, notes: scale, layout: 'melodic', forceAccidentals: true },
    choices: types.map((t) => ({ id: t, label: SCALE_NAMES_FR[t].replace('mineure ', '') })),
    correct: [type],
    explanation: `${capitalize(SCALE_NAMES_FR[type])}. ${why[type]}`,
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// 7. Note mal orthographiée
export function spellingErrorQuestion(d: number, rng: Rng = defaultRng): McqQuestion {
  let key: Key;
  let scale: Pitch[];
  let wrongDegree: number;
  let wrong: Pitch;
  for (;;) {
    key = randomKey(Math.max(d, 2), rng).key;
    scale = buildScale(key.tonic, 'major', octaveFor('treble', key.tonic.letter));
    wrongDegree = 2 + Math.floor(rng() * 6);
    const right = scale[wrongDegree - 1] as Pitch;
    // Même son, autre nom (ex. Si♭ écrit La♯).
    const i = LETTERS.indexOf(right.letter);
    const useUpper = rng() < 0.5;
    const letter = LETTERS[(i + (useUpper ? 1 : 6)) % 7] as Letter;
    const naturalSemis = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 } as const;
    let diff = naturalSemis[right.letter] + right.accidental - naturalSemis[letter];
    if (diff > 6) diff -= 12;
    if (diff < -6) diff += 12;
    if (Math.abs(diff) <= 1) {
      const octave = right.octave + (useUpper && letter === 'C' ? 1 : !useUpper && right.letter === 'C' ? -1 : 0);
      wrong = { letter, accidental: diff as Accidental, octave };
      break;
    }
  }
  const shown = scale.map((n, k) => (k === wrongDegree - 1 ? wrong : n));
  const right = scale[wrongDegree - 1] as Pitch;
  return {
    type: 'mcq',
    id: questionId('sp', rng),
    skill: 'tonalites.gammes-majeures',
    prompt: `Dans cette gamme de ${keyName(key)}, une note est mal écrite (bon son, mauvais nom). Laquelle ?`,
    notation: { kind: 'notes', clef: 'treble', notes: shown, layout: 'melodic', forceAccidentals: true, labels: shown.map((_, k) => String(k + 1)) },
    choices: shown.slice(1, 7).map((n, k) => ({ id: `d${k + 2}`, label: `${k + 2} : ${noteName(n)}` })),
    correct: [`d${wrongDegree}`],
    explanation: `Le ${wrongDegree}e degré doit s’écrire ${noteName(right)} : une gamme utilise chaque nom de note une seule fois. ${noteName(wrong)} a le même son mais répète ou saute une lettre.`,
  };
}

// 8. Tonalité relative
export function relativeQuestion(d: number, rng: Rng = defaultRng): McqQuestion {
  const { key, fifths } = randomKey(d, rng, ['major', 'minor']);
  const rel = relativeKey(key);
  // Distracteurs : tonalité homonyme (même tonique, autre mode) et voisines dans le cycle.
  const parallel = keyName({ tonic: key.tonic, mode: rel.mode });
  const neighbours = [fifths - 1, fifths + 1, fifths + 3, fifths - 3]
    .filter((f) => f >= -7 && f <= 7)
    .map((f) => keyName(keyFromFifths(f, rel.mode)));
  const distract = [parallel, ...shuffle(neighbours, rng)].filter((n) => n !== keyName(rel)).slice(0, 3);
  const { choices, correct } = mcqChoices(keyName(rel), distract, rng);
  return {
    type: 'mcq',
    id: questionId('rl', rng),
    skill: 'tonalites.relatives',
    prompt: `Quel est le relatif ${rel.mode === 'minor' ? 'mineur' : 'majeur'} de ${keyName(key)} ?`,
    choices,
    correct,
    explanation:
      key.mode === 'major'
        ? `Le relatif mineur se trouve une tierce mineure (un ton et demi) sous la tonique majeure : ${keyName(rel)}. Même armure.`
        : `Le relatif majeur se trouve une tierce mineure au-dessus de la tonique mineure : ${keyName(rel)}. Même armure.`,
  };
}

export const SCALE_DIFFICULTIES: DifficultyOption[] = [
  { value: 1, label: 'Débutant', description: 'Tons et demi-tons, tonalités jusqu’à 2 altérations, majeur.' },
  { value: 2, label: 'Intermédiaire', description: 'Jusqu’à 4 altérations, mineur, demi-tons chromatiques, orthographe.' },
  { value: 3, label: 'Avancé', description: 'Toutes les tonalités jusqu’à 7 altérations, degrés en mineur.' },
];

export const SCALE_EXERCISES: ExerciseGenerator[] = [
  { id: 'tone-semitone', label: 'Tons et demi-tons', description: 'Écart entre deux notes voisines.', minDifficulty: 1, generate: toneSemitoneQuestion },
  { id: 'signature-count', label: 'Armures', description: 'Nombre d’altérations d’une tonalité.', minDifficulty: 1, generate: signatureCountQuestion },
  { id: 'identify-key', label: 'Reconnaître la tonalité', description: 'D’après l’armure.', minDifficulty: 1, generate: identifyKeyQuestion },
  { id: 'degree', label: 'Degrés de la gamme', description: 'Tonique, dominante, sensible…', minDifficulty: 1, generate: degreeQuestion },
  { id: 'scale-accidentals', label: 'Altérations des gammes', description: 'Quelles notes sont altérées ?', minDifficulty: 1, generate: scaleAccidentalsQuestion },
  { id: 'relative', label: 'Tonalités relatives', description: 'Relatif majeur et mineur.', minDifficulty: 1, generate: relativeQuestion },
  { id: 'minor-type', label: 'Gammes mineures', description: 'Naturelle, harmonique, mélodique.', minDifficulty: 2, generate: minorTypeQuestion },
  { id: 'spelling', label: 'Orthographe des gammes', description: 'Trouver la note mal écrite.', minDifficulty: 2, generate: spellingErrorQuestion },
];
