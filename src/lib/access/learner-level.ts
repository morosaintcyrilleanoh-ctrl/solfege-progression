/**
 * Niveau de l'élève et accès aux modules avancés.
 *
 * Sans compte : le niveau vient du test de positionnement, ou d'une
 * évaluation réussie du module précédent (données réelles de l'appareil).
 * Avec un compte (étape 7) : le niveau du profil, et les déblocages décidés
 * par le formateur, vérifiés côté serveur et par la base de données.
 */
import { loadQuizHistory } from '@/lib/exercises/history';
import { readJson, writeJson } from '@/lib/storage/safe-storage';

export type LearnerLevel = 'debutant' | 'intermediaire' | 'avance';

export const LEVEL_LABELS: Record<LearnerLevel, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
};

const ORDER: LearnerLevel[] = ['debutant', 'intermediaire', 'avance'];

export function atLeast(level: LearnerLevel, min: LearnerLevel): boolean {
  return ORDER.indexOf(level) >= ORDER.indexOf(min);
}

export interface PlacementResult {
  v: 1;
  level: LearnerLevel;
  takenAt: string;
  scores: Record<string, { correct: number; total: number }>;
}

const PLACEMENT_KEY = 'solfege-progression:placement:v1';

export function loadPlacement(): PlacementResult | null {
  return readJson(PLACEMENT_KEY, (v): v is PlacementResult => {
    const r = v as PlacementResult;
    return !!r && r.v === 1 && ORDER.includes(r.level) && typeof r.takenAt === 'string';
  });
}

export function savePlacement(result: PlacementResult) {
  return writeJson(PLACEMENT_KEY, result);
}

/** Calcule le niveau à partir des scores par domaine (règles simples et transparentes). */
export function levelFromScores(scores: Record<string, { correct: number; total: number }>): LearnerLevel {
  const total = Object.values(scores).reduce((s, x) => s + x.total, 0);
  const correct = Object.values(scores).reduce((s, x) => s + x.correct, 0);
  const ratio = total ? correct / total : 0;
  const theory = scores.intervalles;
  const theoryRatio = theory && theory.total ? theory.correct / theory.total : 0;
  if (ratio >= 0.8 && theoryRatio >= 0.66) return 'avance';
  if (ratio >= 0.5) return 'intermediaire';
  return 'debutant';
}

export interface ModuleAccess {
  allowed: boolean;
  reason: string;
}

/** Module 4 : réservé aux élèves de niveau intermédiaire, ou ayant réussi une évaluation du module 3. */
export function localAccessToAdvanced(): ModuleAccess {
  const placement = loadPlacement();
  if (placement && atLeast(placement.level, 'intermediaire')) {
    return { allowed: true, reason: `Débloqué par ton test de positionnement (niveau ${LEVEL_LABELS[placement.level].toLowerCase()}).` };
  }
  const passed = loadQuizHistory('tonalites').some((s) => s.mode === 'evaluation' && s.finishedAt && s.total >= 10 && s.correct / s.total >= 0.7);
  if (passed) return { allowed: true, reason: 'Débloqué par ta réussite à une évaluation du module Tonalités et gammes.' };
  return {
    allowed: false,
    reason:
      'Ce module est prévu après les tonalités et les gammes. Il se débloque avec un test de positionnement de niveau intermédiaire, ou une évaluation du module 3 réussie à 70 % ou plus.',
  };
}
