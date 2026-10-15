'use client';

import { QuizLab } from '@/components/labs/quiz/QuizLab';
import { Tabs } from '@/components/ui/Tabs';
import { SCALE_DIFFICULTIES, SCALE_EXERCISES } from '@/lib/theory/scale-questions';
import { CircleOfFifths } from './CircleOfFifths';
import { ScaleExplorer } from './ScaleExplorer';

export function ScalesLab() {
  return (
    <Tabs
      label="Laboratoire des tonalités"
      tabs={[
        {
          id: 'exercices',
          label: 'Exercices',
          content: (
            <QuizLab
              labId="tonalites"
              exercises={SCALE_EXERCISES}
              difficulties={SCALE_DIFFICULTIES}
              measures="Ces exercices vérifient tes connaissances théoriques (armures, gammes, orthographe des notes). Ils n’évaluent pas l’oreille ni le chant."
            />
          ),
        },
        { id: 'gammes', label: 'Gammes', content: <ScaleExplorer /> },
        { id: 'quintes', label: 'Cycle des quintes', content: <CircleOfFifths /> },
      ]}
    />
  );
}
