/**
 * Génération et correction des questions de lecture de notes.
 * Logique pure : aucune dépendance à React, au navigateur ou à VexFlow.
 */
import {
  type Accidental,
  type Letter,
  type Pitch,
  ACCIDENTAL_NAMES_FR,
  FRENCH_NAMES,
  formatPitch,
  midiNumber,
  pitchFromMidi,
  pitchKey,
  type NameNotation,
  type OctaveConvention,
} from '@/lib/music/pitch';
import { type Clef, CLEFS, pitchAtStep, staffPosition } from '@/lib/music/staff';
import { type Rng, defaultRng, pickWeighted } from '@/lib/random';
import { type ClefChoice, type LevelId, LEVELS, clefsFor } from './levels';

export interface NoteQuestion {
  id: string;
  clef: Clef;
  pitch: Pitch;
}

/** Clé statistique d'une question : la même note dans deux clés n'est pas la même difficulté. */
export function questionKey(q: Pick<NoteQuestion, 'clef' | 'pitch'>): string {
  return `${q.clef}:${pitchKey(q.pitch)}`;
}

/**
 * Notes altérées exclues au niveau 4 : Mi♯, Si♯, Fa♭ et Do♭ sont correctes en
 * théorie mais rares en début d'apprentissage et prêtent à confusion.
 */
const RARE_SPELLINGS = new Set(['E1', 'B1', 'F-1', 'C-1']);

function isRareSpelling(letter: Letter, accidental: Accidental): boolean {
  return RARE_SPELLINGS.has(`${letter}${accidental}`);
}

export function candidatesFor(clefChoice: ClefChoice, levelId: LevelId): NoteQuestion[] {
  const level = LEVELS[levelId];
  const accidentals: Accidental[] = level.accidentals ? [-1, 0, 1] : [0];
  const result: NoteQuestion[] = [];
  for (const clef of clefsFor(clefChoice)) {
    for (let step = level.minStep; step <= level.maxStep; step++) {
      for (const acc of accidentals) {
        const pitch = pitchAtStep(step, clef, acc);
        if (acc !== 0 && isRareSpelling(pitch.letter, acc)) continue;
        result.push({ id: '', clef, pitch });
      }
    }
  }
  return result;
}

export interface GenerateOptions {
  clefChoice: ClefChoice;
  level: LevelId;
  rng?: Rng;
  /** Question précédente : elle n'est jamais répétée immédiatement. */
  previous?: NoteQuestion | null;
  /** Poids supplémentaire par questionKey (révision ciblée des notes souvent manquées). */
  focus?: Record<string, number>;
}

let counter = 0;
function nextId(rng: Rng): string {
  counter = (counter + 1) % 1_000_000;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.floor(rng() * 1e9).toString(36)}`;
}

export function generateQuestion({ clefChoice, level, rng = defaultRng, previous, focus }: GenerateOptions): NoteQuestion {
  let pool = candidatesFor(clefChoice, level);
  if (previous && pool.length > 1) {
    const prevKey = questionKey(previous);
    pool = pool.filter((c) => questionKey(c) !== prevKey);
  }
  const levelDef = LEVELS[level];
  const weights = pool.map((c) => {
    // Au niveau 4, on veut environ une note altérée sur deux.
    const w = levelDef.accidentals && c.pitch.accidental !== 0 ? 0.5 : 1;
    const extra = focus?.[questionKey(c)] ?? 0;
    return w * (1 + Math.max(0, extra));
  });
  const chosen = pickWeighted(pool, weights, rng);
  return { ...chosen, id: nextId(rng) };
}

export function generateSeries(count: number, options: Omit<GenerateOptions, 'previous'>): NoteQuestion[] {
  const series: NoteQuestion[] = [];
  let previous: NoteQuestion | null = null;
  for (let i = 0; i < count; i++) {
    previous = generateQuestion({ ...options, previous });
    series.push(previous);
  }
  return series;
}

// ---------------------------------------------------------------------------
// Réponses
// ---------------------------------------------------------------------------

/**
 * Deux façons de répondre, qui ne vérifient pas la même chose :
 * - « name » : le nom de la note (et son altération), sans l'octave ;
 * - « key »  : la touche exacte du clavier, donc aussi l'octave
 *   (deux orthographes enharmoniques, ex. Fa♯/Sol♭, désignent la même touche).
 */
export type NoteAnswer = { kind: 'name'; letter: Letter; accidental: Accidental } | { kind: 'key'; midi: number };

export interface AnswerCheck {
  correct: boolean;
  /** Nom de la note juste (lettre et altération). */
  nameCorrect: boolean;
  /** Pour une réponse au clavier : le nom est juste mais pas l'octave. */
  wrongOctaveOnly: boolean;
}

export function checkAnswer(question: NoteQuestion, answer: NoteAnswer): AnswerCheck {
  if (answer.kind === 'name') {
    const nameCorrect = answer.letter === question.pitch.letter && answer.accidental === question.pitch.accidental;
    return { correct: nameCorrect, nameCorrect, wrongOctaveOnly: false };
  }
  const expected = midiNumber(question.pitch);
  const correct = answer.midi === expected;
  const samePitchClass = ((answer.midi - expected) % 12 + 12) % 12 === 0;
  return { correct, nameCorrect: samePitchClass, wrongOctaveOnly: !correct && samePitchClass };
}

export interface LabelOptions {
  notation: NameNotation;
  octaveConvention: OctaveConvention;
}

export function answerLabel(answer: NoteAnswer, { notation, octaveConvention }: LabelOptions): string {
  if (answer.kind === 'name') {
    return formatPitch({ letter: answer.letter, accidental: answer.accidental, octave: 4 }, { notation, octave: false });
  }
  return `touche ${formatPitch(pitchFromMidi(answer.midi), { notation, octave: octaveConvention })}`;
}

/** Explication pédagogique, ex. « En clé de sol, la note sur la 2e ligne est Sol 3. » */
export function explainQuestion(question: NoteQuestion, options: LabelOptions): string {
  const pos = staffPosition(question.pitch, question.clef);
  const clef = CLEFS[question.clef].label.toLowerCase();
  const name = formatPitch(question.pitch, { notation: options.notation, octave: options.octaveConvention });
  const where = pos.description.startsWith('sous') || pos.description.startsWith('au-dessus')
    ? `la note placée ${pos.description}`
    : `la note sur ${pos.description.includes('interligne') ? 'le' : 'la'} ${pos.description}`;
  let sentence = `En ${clef}, ${where} est ${name}.`;
  if (question.pitch.accidental !== 0) {
    const natural = FRENCH_NAMES[question.pitch.letter];
    sentence += ` Le ${ACCIDENTAL_NAMES_FR[question.pitch.accidental]} s'ajoute au nom : ${natural} devient ${formatPitch(question.pitch, { notation: 'fr', octave: false })}.`;
  }
  return sentence;
}
