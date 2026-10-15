'use client';

import { Metronome } from '@/components/instruments/Metronome';
import { QuizLab } from '@/components/labs/quiz/QuizLab';
import { Card } from '@/components/ui/primitives';
import { Tabs } from '@/components/ui/Tabs';
import { RHYTHM_DIFFICULTIES, RHYTHM_EXERCISES } from '@/lib/rhythm/questions';
import { PulseExercise } from './PulseExercise';
import { RhythmPlayButton } from './RhythmPlayButton';

export function RhythmLab() {
  return (
    <Tabs
      label="Laboratoire rythmique"
      tabs={[
        {
          id: 'exercices',
          label: 'Exercices',
          content: (
            <QuizLab
              labId="rythme"
              exercises={RHYTHM_EXERCISES}
              difficulties={RHYTHM_DIFFICULTIES}
              measures="Ces exercices sont théoriques : ils vérifient ta compréhension des durées, des mesures et du tempo. Ils n’évaluent pas ta précision quand tu joues ou frappes un rythme (voir l’onglet Pulsation)."
              renderTools={(q) =>
                q.notation?.kind === 'rhythm' && !q.notation.missingEnd && !q.notation.labels ? (
                  <RhythmPlayButton measures={q.notation.measures} timeSignature={q.notation.timeSignature} />
                ) : null
              }
            />
          ),
        },
        {
          id: 'metronome',
          label: 'Métronome',
          content: (
            <Card>
              <Metronome />
            </Card>
          ),
        },
        { id: 'pulsation', label: 'Pulsation', content: <PulseExercise /> },
      ]}
    />
  );
}
