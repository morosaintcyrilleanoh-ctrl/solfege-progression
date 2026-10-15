import type { Rng } from '@/lib/random';
import type { Question } from './types';

export interface ExerciseGenerator {
  id: string;
  label: string;
  description: string;
  /** Difficulté minimale à laquelle ce type est proposé. */
  minDifficulty: number;
  generate: (difficulty: number, rng?: Rng) => Question;
}

export interface DifficultyOption {
  value: number;
  label: string;
  description: string;
}
