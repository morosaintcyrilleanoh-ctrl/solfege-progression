import type { NameNotation, OctaveConvention } from '@/lib/music/pitch';
import { readJson, writeJson } from '@/lib/storage/safe-storage';
import { type ClefChoice, type LevelId, isLevelId } from './levels';
import type { AnswerMode } from './session';

export interface NoteLabSettings {
  clefChoice: ClefChoice;
  level: LevelId;
  answerMode: AnswerMode;
  evaluationLength: 10 | 20;
  notation: NameNotation;
  octaveConvention: OctaveConvention;
  sound: boolean;
  autoAdvance: boolean;
}

export const DEFAULT_SETTINGS: NoteLabSettings = {
  clefChoice: 'treble',
  level: 1,
  answerMode: 'buttons',
  evaluationLength: 10,
  notation: 'fr',
  octaveConvention: 'fr',
  sound: false,
  autoAdvance: true,
};

const SETTINGS_KEY = 'solfege-progression:note-reading:settings:v1';

/** Valide champ par champ : une valeur invalide reprend sa valeur par défaut. */
export function sanitizeSettings(raw: unknown): NoteLabSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const pick = <T,>(value: unknown, allowed: readonly T[], fallback: T): T =>
    allowed.includes(value as T) ? (value as T) : fallback;
  return {
    clefChoice: pick(r.clefChoice, ['treble', 'bass', 'both'] as const, DEFAULT_SETTINGS.clefChoice),
    level: isLevelId(r.level) ? r.level : DEFAULT_SETTINGS.level,
    answerMode: pick(r.answerMode, ['buttons', 'piano'] as const, DEFAULT_SETTINGS.answerMode),
    evaluationLength: pick(r.evaluationLength, [10, 20] as const, DEFAULT_SETTINGS.evaluationLength),
    notation: pick(r.notation, ['fr', 'intl'] as const, DEFAULT_SETTINGS.notation),
    octaveConvention: pick(r.octaveConvention, ['fr', 'intl'] as const, DEFAULT_SETTINGS.octaveConvention),
    sound: typeof r.sound === 'boolean' ? r.sound : DEFAULT_SETTINGS.sound,
    autoAdvance: typeof r.autoAdvance === 'boolean' ? r.autoAdvance : DEFAULT_SETTINGS.autoAdvance,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function loadSettings(): NoteLabSettings {
  return sanitizeSettings(readJson(SETTINGS_KEY, isObject));
}

export function saveSettings(settings: NoteLabSettings) {
  return writeJson(SETTINGS_KEY, settings);
}
