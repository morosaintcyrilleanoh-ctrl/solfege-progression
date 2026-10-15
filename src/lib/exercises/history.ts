/**
 * Historique local des séances de laboratoires à questions (rythme, gammes,
 * intervalles…). Même format pour tous, proche de la table exercise_attempts.
 */
import { type WriteResult, readJson, removeKey, writeJson } from '@/lib/storage/safe-storage';
import { type QuizState, quizSummary } from './session';

export const MAX_QUIZ_SESSIONS = 60;

export interface StoredQuizItem {
  /** Compétence */
  s: string;
  c: boolean;
  ms: number;
}

export interface StoredQuizSession {
  v: 1;
  id: string;
  labId: string;
  mode: 'training' | 'evaluation';
  exerciseIds: string[];
  difficulty: number;
  startedAt: string;
  finishedAt: string | null;
  total: number;
  correct: number;
  averageMs: number | null;
  items: StoredQuizItem[];
}

export function quizHistoryKey(labId: string): string {
  return `solfege-progression:quiz:${labId}:history:v1`;
}

export function quizActiveKey(labId: string): string {
  return `solfege-progression:quiz:${labId}:active-evaluation:v1`;
}

function isStored(v: unknown): v is StoredQuizSession {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  return (
    s.v === 1 &&
    typeof s.id === 'string' &&
    typeof s.labId === 'string' &&
    (s.mode === 'training' || s.mode === 'evaluation') &&
    typeof s.startedAt === 'string' &&
    typeof s.total === 'number' &&
    typeof s.correct === 'number' &&
    Array.isArray(s.items)
  );
}

export function toStoredQuiz(state: QuizState): StoredQuizSession {
  const summary = quizSummary(state);
  return {
    v: 1,
    id: state.id,
    labId: state.config.labId,
    mode: state.config.mode,
    exerciseIds: state.config.exerciseIds,
    difficulty: state.config.difficulty,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    total: summary.total,
    correct: summary.correct,
    averageMs: summary.averageMs,
    items: state.items.map((i) => ({ s: i.question.skill, c: i.correct, ms: i.ms })),
  };
}

export function loadQuizHistory(labId: string): StoredQuizSession[] {
  const raw = readJson(quizHistoryKey(labId), (v): v is unknown[] => Array.isArray(v)) ?? [];
  return raw.filter(isStored).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function upsertQuizSession(session: StoredQuizSession): WriteResult {
  if (session.total === 0) return { ok: true };
  const others = loadQuizHistory(session.labId).filter((s) => s.id !== session.id);
  return writeJson(quizHistoryKey(session.labId), [session, ...others].slice(0, MAX_QUIZ_SESSIONS));
}

export function clearQuizHistory(labId: string): WriteResult {
  return removeKey(quizHistoryKey(labId));
}

function isActive(v: unknown): v is QuizState {
  if (!v || typeof v !== 'object') return false;
  const s = v as Partial<QuizState>;
  return typeof s.id === 'string' && s.config?.mode === 'evaluation' && Array.isArray(s.questions) && s.phase === 'question';
}

export function loadActiveQuiz(labId: string): QuizState | null {
  return readJson(quizActiveKey(labId), isActive);
}

export function saveActiveQuiz(state: QuizState): WriteResult {
  return writeJson(quizActiveKey(state.config.labId), state);
}

export function clearActiveQuiz(labId: string): WriteResult {
  return removeKey(quizActiveKey(labId));
}

/** Réussite par compétence, pour les recommandations. */
export function skillStats(history: StoredQuizSession[]): { skill: string; attempts: number; correct: number; accuracy: number }[] {
  const map = new Map<string, { attempts: number; correct: number }>();
  for (const s of history) {
    for (const i of s.items) {
      const m = map.get(i.s) ?? { attempts: 0, correct: 0 };
      m.attempts += 1;
      if (i.c) m.correct += 1;
      map.set(i.s, m);
    }
  }
  return [...map].map(([skill, m]) => ({ skill, ...m, accuracy: m.correct / m.attempts }));
}
