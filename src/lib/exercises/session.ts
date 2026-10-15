/**
 * Séance générique (entraînement ou évaluation) pour tous les laboratoires
 * à base de questions. Même principe que la lecture de notes : réducteur pur,
 * questions fournies de l'extérieur, état sérialisable.
 */
import { checkQuestion } from './check';
import type { Question, QuestionAnswer } from './types';

export type QuizMode = 'training' | 'evaluation';

export interface QuizConfig {
  labId: string;
  mode: QuizMode;
  /** Types d'exercices choisis (identifiants des générateurs). */
  exerciseIds: string[];
  difficulty: number;
  evaluationLength: number;
}

export interface QuizItem {
  question: Question;
  answer: QuestionAnswer;
  correct: boolean;
  ms: number;
  answeredAt: string;
}

export interface QuizState {
  id: string;
  config: QuizConfig;
  startedAt: string;
  finishedAt: string | null;
  questions: Question[];
  index: number;
  questionShownAt: number;
  items: QuizItem[];
  phase: 'question' | 'feedback' | 'finished';
  streak: number;
  bestStreak: number;
}

export type QuizAction =
  | { type: 'answer'; answer: QuestionAnswer; now: number }
  | { type: 'next'; question?: Question; now: number }
  | { type: 'finish'; now: number };

export function createQuiz(id: string, config: QuizConfig, questions: Question[], now: number): QuizState {
  if (questions.length === 0) throw new Error('Aucune question.');
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

export function currentQuizQuestion(state: QuizState): Question | null {
  return state.questions[state.index] ?? null;
}

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'answer': {
      const question = currentQuizQuestion(state);
      if (state.phase !== 'question' || !question) return state;
      const { correct } = checkQuestion(question, action.answer);
      const item: QuizItem = {
        question,
        answer: action.answer,
        correct,
        ms: Math.max(0, action.now - state.questionShownAt),
        answeredAt: new Date(action.now).toISOString(),
      };
      const streak = correct ? state.streak + 1 : 0;
      const base = { ...state, items: [...state.items, item], streak, bestStreak: Math.max(state.bestStreak, streak) };
      if (state.config.mode === 'training') return { ...base, phase: 'feedback' };
      if (state.index >= state.questions.length - 1) {
        return { ...base, phase: 'finished', finishedAt: new Date(action.now).toISOString() };
      }
      return { ...base, index: state.index + 1, questionShownAt: action.now };
    }
    case 'next': {
      if (state.config.mode !== 'training' || state.phase !== 'feedback') return state;
      if (!action.question) throw new Error("L'entraînement a besoin d'une nouvelle question.");
      return { ...state, questions: [action.question], index: 0, phase: 'question', questionShownAt: action.now };
    }
    case 'finish': {
      if (state.phase === 'finished') return state;
      return { ...state, phase: 'finished', finishedAt: new Date(action.now).toISOString() };
    }
  }
}

export function quizSummary(state: Pick<QuizState, 'items' | 'bestStreak'>) {
  const total = state.items.length;
  const correct = state.items.filter((i) => i.correct).length;
  return {
    total,
    correct,
    percent: total ? Math.round((correct / total) * 100) : 0,
    averageMs: total ? Math.round(state.items.reduce((s, i) => s + i.ms, 0) / total) : null,
    bestStreak: state.bestStreak,
  };
}
