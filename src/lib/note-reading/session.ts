/**
 * Déroulement d'une séance de lecture de notes, sous forme de réducteur pur.
 * Les questions sont générées à l'extérieur (pour pouvoir injecter le hasard),
 * ce qui rend chaque transition testable et l'état sérialisable (reprise).
 */
import type { ClefChoice, LevelId } from './levels';
import { type NoteAnswer, type NoteQuestion, checkAnswer } from './questions';

export type SessionMode = 'training' | 'evaluation';
export type AnswerMode = 'buttons' | 'piano';

export interface SessionConfig {
  mode: SessionMode;
  clefChoice: ClefChoice;
  level: LevelId;
  answerMode: AnswerMode;
  /** Nombre de questions en évaluation (ignoré en entraînement). */
  evaluationLength: number;
}

export interface AnsweredItem {
  question: NoteQuestion;
  answer: NoteAnswer;
  correct: boolean;
  wrongOctaveOnly: boolean;
  /** Temps de réponse en millisecondes. */
  ms: number;
  answeredAt: string;
}

export type SessionPhase = 'question' | 'feedback' | 'finished';

export interface SessionState {
  id: string;
  config: SessionConfig;
  startedAt: string;
  finishedAt: string | null;
  /** Évaluation : série fixée à l'avance. Entraînement : seulement la question en cours. */
  questions: NoteQuestion[];
  index: number;
  questionShownAt: number;
  items: AnsweredItem[];
  phase: SessionPhase;
  streak: number;
  bestStreak: number;
}

export type SessionAction =
  | { type: 'answer'; answer: NoteAnswer; now: number }
  | { type: 'next'; question?: NoteQuestion; now: number }
  | { type: 'finish'; now: number };

export const MIN_EVALUATION_LENGTH = 5;
export const MAX_EVALUATION_LENGTH = 50;

export function createSession(id: string, config: SessionConfig, questions: NoteQuestion[], now: number): SessionState {
  if (questions.length === 0) throw new Error('Une séance doit commencer avec au moins une question.');
  if (config.mode === 'evaluation' && questions.length !== config.evaluationLength) {
    throw new Error("La série d'évaluation ne correspond pas au nombre de questions demandé.");
  }
  return {
    id,
    config,
    startedAt: new Date(now).toISOString(),
    finishedAt: null,
    questions,
    index: 0,
    questionShownAt: now,
    items: [],
    phase: 'question',
    streak: 0,
    bestStreak: 0,
  };
}

export function currentQuestion(state: SessionState): NoteQuestion | null {
  return state.questions[state.index] ?? null;
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'answer': {
      const question = currentQuestion(state);
      if (state.phase !== 'question' || !question) return state;
      const check = checkAnswer(question, action.answer);
      const item: AnsweredItem = {
        question,
        answer: action.answer,
        correct: check.correct,
        wrongOctaveOnly: check.wrongOctaveOnly,
        ms: Math.max(0, action.now - state.questionShownAt),
        answeredAt: new Date(action.now).toISOString(),
      };
      const streak = check.correct ? state.streak + 1 : 0;
      const base = { ...state, items: [...state.items, item], streak, bestStreak: Math.max(state.bestStreak, streak) };

      if (state.config.mode === 'training') return { ...base, phase: 'feedback' };

      // Évaluation : pas de correction immédiate, on enchaîne.
      const isLast = state.index >= state.questions.length - 1;
      if (isLast) return { ...base, phase: 'finished', finishedAt: new Date(action.now).toISOString() };
      return { ...base, index: state.index + 1, questionShownAt: action.now };
    }
    case 'next': {
      if (state.config.mode !== 'training' || state.phase !== 'feedback') return state;
      if (!action.question) throw new Error("L'entraînement a besoin d'une nouvelle question.");
      return {
        ...state,
        questions: [action.question],
        index: 0,
        phase: 'question',
        questionShownAt: action.now,
      };
    }
    case 'finish': {
      if (state.phase === 'finished') return state;
      return { ...state, phase: 'finished', finishedAt: new Date(action.now).toISOString() };
    }
  }
}

export interface SessionSummary {
  total: number;
  correct: number;
  /** Pourcentage arrondi, 0 si aucune réponse. */
  percent: number;
  averageMs: number | null;
  bestStreak: number;
}

export function summarize(state: Pick<SessionState, 'items' | 'bestStreak'>): SessionSummary {
  const total = state.items.length;
  const correct = state.items.filter((i) => i.correct).length;
  const averageMs = total ? Math.round(state.items.reduce((s, i) => s + i.ms, 0) / total) : null;
  return {
    total,
    correct,
    percent: total ? Math.round((correct / total) * 100) : 0,
    averageMs,
    bestStreak: state.bestStreak,
  };
}
