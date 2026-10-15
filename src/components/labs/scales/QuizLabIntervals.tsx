'use client';

import { QuizLab } from '@/components/labs/quiz/QuizLab';
import { INTERVAL_DIFFICULTIES, INTERVAL_EXERCISES } from '@/lib/theory/interval-questions';

export function QuizLabIntervals() {
  return (
    <QuizLab
      labId="intervalles"
      exercises={INTERVAL_EXERCISES}
      difficulties={INTERVAL_DIFFICULTIES}
      measures="Ces exercices vérifient la reconnaissance écrite des intervalles et des accords, et la lecture. Ils n’évaluent pas l’oreille (reconnaissance à l’écoute)."
    />
  );
}
