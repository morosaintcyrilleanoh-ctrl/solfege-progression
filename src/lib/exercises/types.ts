/**
 * Moteur d'exercices générique : un format de question unique pour les
 * laboratoires (questions générées) et, plus tard, pour les exercices créés
 * par les formateurs (stockés dans la table exercise_questions).
 */
import type { Pitch } from '@/lib/music/pitch';
import type { Clef } from '@/lib/music/staff';
import type { RhythmEvent, TimeSignature } from '@/lib/rhythm';

/** Ce qui est affiché au-dessus de la question. */
export type Notation =
  | {
      kind: 'rhythm';
      timeSignature: TimeSignature;
      measures: RhythmEvent[][];
      /** Étiquette affichée au-dessus de chaque mesure (ex. « 1 », « 2 »). */
      labels?: string[];
      /** Affiche un « ? » à la fin de la dernière mesure. */
      missingEnd?: boolean;
    }
  | {
      kind: 'notes';
      clef: Clef;
      /** Armure (nom de tonalité majeure VexFlow : « D », « Bb »…). */
      keySignature?: string;
      notes: Pitch[];
      /** « melodic » : notes successives ; « harmonic » : notes superposées (accord, intervalle harmonique). */
      layout: 'melodic' | 'harmonic';
      /** Altérations dessinées même si l'armure les contient déjà. */
      forceAccidentals?: boolean;
      labels?: string[];
    }
  | { kind: 'keySignature'; clef: Clef; keySignature: string }
  | { kind: 'glyphs'; glyphs: string[] };

interface BaseQuestion {
  id: string;
  /** Compétence évaluée, ex. « rythme.durees ». Sert aux statistiques et recommandations. */
  skill: string;
  prompt: string;
  notation?: Notation;
  /** Explication montrée après la réponse. */
  explanation: string;
}

export interface McqQuestion extends BaseQuestion {
  type: 'mcq';
  choices: { id: string; label: string; glyph?: string }[];
  /** Identifiants des choix acceptés (plusieurs si équivalents). */
  correct: string[];
}

export interface ShortQuestion extends BaseQuestion {
  type: 'short';
  /** Réponses acceptées, comparées après normalisation. */
  accepted: string[];
  answerKind: 'text' | 'number';
  placeholder?: string;
}

export interface MatchQuestion extends BaseQuestion {
  type: 'match';
  /** Paires correctes ; la colonne de droite est mélangée à l'affichage. */
  pairs: { left: string; right: string }[];
}

export type Question = McqQuestion | ShortQuestion | MatchQuestion;

export type QuestionAnswer =
  | { type: 'mcq'; choiceId: string }
  | { type: 'short'; text: string }
  | { type: 'match'; /** index gauche -> libellé droit choisi */ mapping: string[] };

export interface QuestionCheck {
  correct: boolean;
  /** Pour l'association : nombre de paires justes. */
  partial?: { right: number; total: number };
}
