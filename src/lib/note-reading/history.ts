/**
 * Historique local des séances de lecture de notes.
 *
 * Étape actuelle : les résultats sont enregistrés sur l'appareil de l'élève
 * (aucun compte n'est encore nécessaire). Le format est volontairement proche
 * de la future table `exercise_attempts` pour permettre une synchronisation
 * avec Supabase à l'étape « authentification ».
 */
import { type WriteResult, readJson, removeKey, writeJson } from '@/lib/storage/safe-storage';
import { isLevelId, type ClefChoice, type LevelId } from './levels';
import { type AnswerMode, type SessionMode, type SessionState, summarize } from './session';
import { questionKey } from './questions';
import type { AttemptRecord } from './stats';

export const HISTORY_KEY = 'solfege-progression:note-reading:history:v1';
export const ACTIVE_EVALUATION_KEY = 'solfege-progression:note-reading:active-evaluation:v1';
export const MAX_SESSIONS = 60;

export interface StoredItem extends AttemptRecord {
  ms: number;
}

export interface StoredSession {
  v: 1;
  id: string;
  mode: SessionMode;
  clefChoice: ClefChoice;
  level: LevelId;
  answerMode: AnswerMode;
  startedAt: string;
  finishedAt: string | null;
  total: number;
  correct: number;
  averageMs: number | null;
  bestStreak: number;
  items: StoredItem[];
}

function isStoredSession(v: unknown): v is StoredSession {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  return (
    s.v === 1 &&
    typeof s.id === 'string' &&
    (s.mode === 'training' || s.mode === 'evaluation') &&
    (s.clefChoice === 'treble' || s.clefChoice === 'bass' || s.clefChoice === 'both') &&
    isLevelId(s.level) &&
    typeof s.startedAt === 'string' &&
    typeof s.total === 'number' &&
    typeof s.correct === 'number' &&
    Array.isArray(s.items)
  );
}

function isHistory(v: unknown): v is StoredSession[] {
  return Array.isArray(v);
}

export function toStoredSession(state: SessionState): StoredSession {
  const summary = summarize(state);
  return {
    v: 1,
    id: state.id,
    mode: state.config.mode,
    clefChoice: state.config.clefChoice,
    level: state.config.level,
    answerMode: state.config.answerMode,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    total: summary.total,
    correct: summary.correct,
    averageMs: summary.averageMs,
    bestStreak: summary.bestStreak,
    items: state.items.map((i) => ({ k: questionKey(i.question), c: i.correct, ms: i.ms })),
  };
}

export function loadHistory(): StoredSession[] {
  const raw = readJson(HISTORY_KEY, isHistory) ?? [];
  return raw.filter(isStoredSession).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

/**
 * Ajoute ou met à jour une séance (par identifiant). Appelée après chaque
 * réponse : une coupure ou un rechargement ne fait perdre aucune réponse.
 * Une évaluation n'entre dans l'historique qu'une fois terminée.
 */
export function upsertSession(session: StoredSession): WriteResult {
  if (session.total === 0) return { ok: true };
  const others = loadHistory().filter((s) => s.id !== session.id);
  const next = [session, ...others].slice(0, MAX_SESSIONS);
  return writeJson(HISTORY_KEY, next);
}

export function clearHistory(): WriteResult {
  return removeKey(HISTORY_KEY);
}

export function allAttemptRecords(history: StoredSession[]): AttemptRecord[] {
  return history.flatMap((s) => s.items);
}

// --- Évaluation interrompue -------------------------------------------------

function isActiveEvaluation(v: unknown): v is SessionState {
  if (!v || typeof v !== 'object') return false;
  const s = v as Partial<SessionState>;
  return (
    typeof s.id === 'string' &&
    s.config?.mode === 'evaluation' &&
    Array.isArray(s.questions) &&
    Array.isArray(s.items) &&
    typeof s.index === 'number' &&
    s.phase === 'question'
  );
}

export function loadActiveEvaluation(): SessionState | null {
  return readJson(ACTIVE_EVALUATION_KEY, isActiveEvaluation);
}

export function saveActiveEvaluation(state: SessionState): WriteResult {
  return writeJson(ACTIVE_EVALUATION_KEY, state);
}

export function clearActiveEvaluation(): WriteResult {
  return removeKey(ACTIVE_EVALUATION_KEY);
}
