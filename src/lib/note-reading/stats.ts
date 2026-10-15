/**
 * Statistiques par note et recommandations de révision.
 * Calculées uniquement à partir des réponses réellement enregistrées.
 */
import { type Pitch, parsePitchKey } from '@/lib/music/pitch';
import type { Clef } from '@/lib/music/staff';

export interface AttemptRecord {
  /** questionKey, ex. « treble:G4 » */
  k: string;
  c: boolean;
}

export interface NoteStat {
  key: string;
  clef: Clef;
  pitch: Pitch;
  attempts: number;
  correct: number;
  accuracy: number;
}

export function parseQuestionKey(key: string): { clef: Clef; pitch: Pitch } {
  const [clef, pitch] = key.split(':');
  if ((clef !== 'treble' && clef !== 'bass') || !pitch) throw new Error(`Clé de question invalide : ${key}`);
  return { clef, pitch: parsePitchKey(pitch) };
}

export function aggregateNoteStats(records: Iterable<AttemptRecord>): NoteStat[] {
  const map = new Map<string, { attempts: number; correct: number }>();
  for (const r of records) {
    const s = map.get(r.k) ?? { attempts: 0, correct: 0 };
    s.attempts += 1;
    if (r.c) s.correct += 1;
    map.set(r.k, s);
  }
  const stats: NoteStat[] = [];
  for (const [key, s] of map) {
    try {
      const { clef, pitch } = parseQuestionKey(key);
      stats.push({ key, clef, pitch, ...s, accuracy: s.correct / s.attempts });
    } catch {
      // Donnée corrompue : on l'ignore plutôt que de fausser les statistiques.
    }
  }
  return stats;
}

/** Seuils volontairement simples pour rester compréhensibles par l'élève. */
export const WEAK_MIN_ATTEMPTS = 2;
export const WEAK_ACCURACY = 0.7;

export function weakNotes(stats: NoteStat[], limit = 6): NoteStat[] {
  return stats
    .filter((s) => s.attempts >= WEAK_MIN_ATTEMPTS && s.accuracy < WEAK_ACCURACY)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)
    .slice(0, limit);
}

/** Poids de révision : une note souvent manquée revient plus souvent en entraînement. */
export function focusWeights(stats: NoteStat[]): Record<string, number> {
  const weights: Record<string, number> = {};
  for (const s of stats) {
    const errors = s.attempts - s.correct;
    if (errors > 0) weights[s.key] = Math.min(4, errors * (1 - s.accuracy) * 2);
  }
  return weights;
}
