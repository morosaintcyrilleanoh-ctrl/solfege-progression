'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { QuestionView } from '@/components/labs/quiz/QuestionView';
import { Card, ProgressBar, buttonClasses } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { LEVEL_LABELS, type PlacementResult, levelFromScores, savePlacement } from '@/lib/access/learner-level';
import { AREA_LABELS, AREA_LINKS, type Area, PLACEMENT_LENGTH, areaOf, buildPlacementTest } from '@/lib/access/placement';
import { type QuizState, createQuiz, currentQuizQuestion, quizReducer } from '@/lib/exercises/session';
import type { QuestionAnswer } from '@/lib/exercises/types';
import { writeErrorMessage } from '@/lib/storage/safe-storage';

export function PlacementTest() {
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [result, setResult] = useState<{ placement: PlacementResult; saveError: string | null } | null>(null);

  const start = () => {
    setResult(null);
    const questions = buildPlacementTest();
    setQuiz(
      createQuiz(
        `placement-${Date.now()}`,
        { labId: 'positionnement', mode: 'evaluation', exerciseIds: ['placement'], difficulty: 1, evaluationLength: questions.length },
        questions,
        Date.now(),
      ),
    );
  };

  const answer = useCallback((a: QuestionAnswer) => {
    setQuiz((q) => {
      if (!q) return q;
      const next = quizReducer(q, { type: 'answer', answer: a, now: Date.now() });
      if (next.phase === 'finished') {
        const scores: PlacementResult['scores'] = {};
        for (const i of next.items) {
          const area = areaOf(i.question.skill);
          const s = (scores[area] ??= { correct: 0, total: 0 });
          s.total += 1;
          if (i.correct) s.correct += 1;
        }
        const placement: PlacementResult = { v: 1, level: levelFromScores(scores), takenAt: new Date().toISOString(), scores };
        setResult({ placement, saveError: writeErrorMessage(savePlacement(placement)) });
      }
      return next;
    });
  }, []);

  if (result) {
    const { placement, saveError } = result;
    const weak = (Object.keys(AREA_LABELS) as Area[]).filter((a) => {
      const s = placement.scores[a];
      return s && s.correct / s.total < 0.5;
    });
    return (
      <div className="space-y-4">
        <Card className="overflow-hidden !p-0">
          <div className="bg-night-900 px-5 py-6 text-white">
            <p className="text-sm text-accent-300">Ton niveau estimé</p>
            <p className="mt-1 text-3xl font-extrabold">{LEVEL_LABELS[placement.level]}</p>
          </div>
          <ul className="divide-y divide-slate-100 px-5 py-2">
            {(Object.keys(AREA_LABELS) as Area[]).map((a) => {
              const s = placement.scores[a];
              if (!s) return null;
              return (
                <li key={a} className="py-2.5">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{AREA_LABELS[a]}</span>
                    <span className="font-semibold">
                      {s.correct}/{s.total}
                    </span>
                  </div>
                  <ProgressBar value={s.correct} max={s.total} label={AREA_LABELS[a]} tone={s.correct / s.total >= 0.7 ? 'success' : 'electric'} />
                </li>
              );
            })}
          </ul>
        </Card>
        {saveError ? (
          <p className="rounded-xl bg-danger-50 p-3 text-sm text-danger-700" role="alert">{saveError}</p>
        ) : (
          <p className="text-center text-xs text-slate-500">✓ Résultat enregistré sur cet appareil.</p>
        )}
        <Card>
          <h2 className="font-bold text-night-800">Par où commencer ?</h2>
          {weak.length ? (
            <ul className="mt-2 space-y-2 text-sm">
              {weak.map((a) => (
                <li key={a}>
                  <Link href={AREA_LINKS[a]} className="font-semibold text-electric-600 hover:underline">
                    {AREA_LABELS[a]}
                  </Link>{' '}
                  : moins de la moitié des réponses justes, c’est le domaine à travailler en priorité.
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-700">Tu as de bonnes bases dans tous les domaines. Choisis le niveau supérieur dans chaque laboratoire.</p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Ce test de {PLACEMENT_LENGTH} questions donne une estimation de tes connaissances théoriques ; il ne mesure ni l’oreille, ni la voix, ni
            l’exécution instrumentale.
          </p>
        </Card>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link href="/tableau-de-bord" className={`${buttonClasses('primary', 'lg')} w-full`}>
            Mon tableau de bord
          </Link>
          <button type="button" onClick={start} className={`${buttonClasses('secondary', 'lg')} w-full`}>
            Repasser le test
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <Card>
        <h2 className="text-lg font-bold text-night-800">Test de positionnement</h2>
        <p className="mt-2 text-sm text-slate-700">
          {PLACEMENT_LENGTH} questions sur la lecture des notes, le rythme, les tonalités et les intervalles, des plus simples aux plus
          avancées. Pas de correction pendant le test : réponds comme tu peux, sans chercher. Environ 5 minutes.
        </p>
        <p className="mt-2 text-sm text-slate-700">À la fin, tu obtiens ton niveau estimé et les domaines à travailler en priorité.</p>
        <button type="button" onClick={start} className={`${buttonClasses('primary', 'lg')} mt-4 w-full sm:w-auto`}>
          <Icon name="play" /> Commencer le test
        </button>
      </Card>
    );
  }

  const question = currentQuizQuestion(quiz);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
        <span>
          Question {quiz.index + 1}/{quiz.questions.length}
        </span>
        <span className="text-slate-500">{question ? AREA_LABELS[areaOf(question.skill)] : ''}</span>
      </div>
      <ProgressBar value={quiz.index} max={quiz.questions.length} label="Avancement du test" tone="accent" />
      {question && <QuestionView key={question.id} question={question} disabled={false} feedback={null} onAnswer={answer} />}
    </div>
  );
}
