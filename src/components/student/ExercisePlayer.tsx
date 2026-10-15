'use client';

import Link from 'next/link';
import { useCallback, useState, useTransition } from 'react';
import { type ExerciseResult, submitExerciseAction } from '@/app/cours/actions';
import { QuestionView } from '@/components/labs/quiz/QuestionView';
import { Card, ProgressBar, buttonClasses } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { describeAnswer } from '@/lib/exercises/check';
import type { Question, QuestionAnswer } from '@/lib/exercises/types';

function expectedLabel(q: Question, expected: unknown): string {
  const list = Array.isArray(expected) ? (expected as string[]) : [];
  if (q.type === 'mcq') return q.choices.filter((c) => list.includes(c.id)).map((c) => c.label).join(' ou ');
  if (q.type === 'short') return list[0] ?? '';
  return q.pairs.map((p, i) => `${p.left} → ${list[i] ?? '?'}`).join(' ; ');
}

/** Passage d'un exercice du formateur : une question à la fois, correction par la base à la fin. */
export function ExercisePlayer({ exerciseId, questions, assignmentId, backHref }: { exerciseId: string; questions: Question[]; assignmentId: string | null; backHref: string }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const [pending, start] = useTransition();

  const submit = useCallback(
    (all: Record<string, QuestionAnswer>) =>
      start(async () => {
        const payload = Object.fromEntries(
          Object.entries(all).map(([id, a]) => [id, a.type === 'mcq' ? { choiceId: a.choiceId } : a.type === 'short' ? { text: a.text } : { mapping: a.mapping }]),
        );
        setResult(await submitExerciseAction(exerciseId, payload, assignmentId).catch(() => ({ ok: false, message: 'Envoi impossible : vérifie ta connexion.' })));
      }),
    [exerciseId, assignmentId],
  );

  const answer = (a: QuestionAnswer) => {
    const q = questions[index];
    if (!q) return;
    const next = { ...answers, [q.id]: a };
    setAnswers(next);
    if (index < questions.length - 1) setIndex(index + 1);
    else submit(next);
  };

  if (result?.ok) {
    const byId = new Map((result.results ?? []).map((r) => [r.question_id, r]));
    return (
      <div className="space-y-4">
        <Card className="overflow-hidden !p-0">
          <div className="bg-night-900 px-5 py-6 text-white">
            <p className="text-sm text-accent-300">Résultat enregistré sur ton compte</p>
            <p className="mt-1 text-4xl font-extrabold">
              {result.score}/{result.maxScore}
            </p>
          </div>
        </Card>
        <Card>
          <h2 className="mb-2 font-bold text-night-800">Correction</h2>
          <ol className="space-y-3 text-sm">
            {questions.map((q, i) => {
              const r = byId.get(q.id);
              const a = answers[q.id];
              return (
                <li key={q.id} className={`rounded-xl p-3 ${r?.correct ? 'bg-success-50' : 'bg-danger-50'}`}>
                  <p className="font-semibold text-ink">
                    {i + 1}. {q.prompt}
                  </p>
                  {a && <p className={r?.correct ? 'text-success-700' : 'text-danger-700'}>Ta réponse : {describeAnswer(q, a)}</p>}
                  {!r?.correct && r && <p className="text-success-700">Réponse attendue : {expectedLabel(q, r.expected)}</p>}
                  {r?.explanation && <p className="mt-1 text-slate-700">{r.explanation}</p>}
                </li>
              );
            })}
          </ol>
        </Card>
        <Link href={backHref} className={buttonClasses('primary', 'lg')}>
          Continuer
        </Link>
      </div>
    );
  }

  const q = questions[index];
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm font-semibold text-slate-700">
        <span>
          Question {Math.min(index + 1, questions.length)}/{questions.length}
        </span>
      </div>
      <ProgressBar value={Object.keys(answers).length} max={questions.length} label="Avancement" tone="accent" />
      {result && !result.ok && (
        <div role="alert" className="rounded-xl bg-danger-50 p-3 text-sm text-danger-700">
          {result.message}
          <button type="button" onClick={() => submit(answers)} className="ml-2 font-semibold underline">
            Réessayer l’envoi
          </button>
        </div>
      )}
      {pending ? (
        <p className="py-8 text-center text-slate-500" aria-live="polite">
          <Icon name="check" className="mr-1 inline size-4" /> Envoi et correction…
        </p>
      ) : (
        q && !(result && !result.ok) && <QuestionView key={q.id} question={q} disabled={false} feedback={null} onAnswer={answer} />
      )}
    </div>
  );
}
