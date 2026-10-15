import { notFound } from 'next/navigation';
import { deleteExerciseAction, deleteQuestionAction } from '@/app/espace/formateur/actions';
import { ExerciseForm, GenerateForm, QuestionForm } from '@/components/academy/ExerciseForms';
import { Empty, EspaceShell, Section } from '@/components/espace/EspaceShell';
import { ConfirmButton } from '@/components/forms/Controls';
import { Badge } from '@/components/ui/primitives';
import { requireRole } from '@/lib/auth/session';
import { trainerOptions } from '@/lib/data/trainer-options';
import { exerciseStats } from '@/lib/dashboard/stats';
import { RHYTHM_EXERCISES } from '@/lib/rhythm/questions';
import { INTERVAL_EXERCISES } from '@/lib/theory/interval-questions';
import { SCALE_EXERCISES } from '@/lib/theory/scale-questions';

const GENERATOR_OPTIONS = [
  { value: 'lecture:notes', label: 'Lecture · Identifier une note' },
  ...RHYTHM_EXERCISES.map((g) => ({ value: `rythme:${g.id}`, label: `Rythme · ${g.label}` })),
  ...SCALE_EXERCISES.map((g) => ({ value: `tonalites:${g.id}`, label: `Tonalités · ${g.label}` })),
  ...INTERVAL_EXERCISES.map((g) => ({ value: `intervalles:${g.id}`, label: `Intervalles · ${g.label}` })),
];

const TYPE_LABEL = { mcq: 'QCM', short: 'Réponse courte', match: 'Association' } as const;

export default async function ExerciseEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, supabase, userId } = await requireRole(['trainer', 'admin'], `/espace/formateur/exercices/${id}`);
  const { data: exercise } = await supabase.from('exercises').select('*').eq('id', id).maybeSingle();
  if (!exercise || (exercise.owner_id !== userId && profile.role !== 'admin')) notFound();
  const [questions, attempts, opts] = await Promise.all([
    supabase.from('exercise_questions').select('*').eq('exercise_id', id).order('position'),
    supabase.from('exercise_attempts').select('user_id, score, max_score, created_at, exercise_id').eq('exercise_id', id),
    trainerOptions(supabase, userId, profile.role === 'admin'),
  ]);
  const qIds = (questions.data ?? []).map((q) => q.id);
  const keys = qIds.length ? await supabase.from('exercise_question_keys').select('question_id, correct, explanation').in('question_id', qIds) : { data: [] };
  const keyByQ = new Map((keys.data ?? []).map((k) => [k.question_id, k]));
  const stats = exerciseStats(attempts.data ?? []).get(id);

  return (
    <EspaceShell profile={profile} title={exercise.title} subtitle={stats ? `${stats.attempts} tentative(s) par ${stats.students} élève(s), ${stats.averagePercent} % en moyenne` : 'Aucune tentative pour le moment'}>
      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Paramètres" className="lg:col-span-2">
          <ExerciseForm exercise={exercise} courses={opts.courses} lessons={opts.lessons} />
        </Section>
        <Section title="Accès des élèves">
          <p className="text-sm text-slate-600">
            Un exercice publié est accessible aux élèves inscrits au cours choisi (ou à la leçon), ou aux élèves à qui il est donné en devoir. La
            correction se fait dans la base : les élèves ne voient jamais le corrigé avant d’avoir répondu.
          </p>
          <div className="mt-4">
            <ConfirmButton action={deleteExerciseAction.bind(null, exercise.id)} label="Supprimer l’exercice" confirm="Supprimer cet exercice et ses questions ?" />
          </div>
        </Section>
      </div>
      <Section title={`Questions (${questions.data?.length ?? 0})`}>
        {questions.data?.length ? (
          <ol className="space-y-3">
            {questions.data.map((q, i) => {
              const k = keyByQ.get(q.id);
              return (
                <li key={q.id} className="rounded-xl bg-mist p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-ink">
                      {i + 1}. {q.prompt}
                    </p>
                    <ConfirmButton action={deleteQuestionAction.bind(null, q.id, exercise.id)} label="Supprimer" confirm="Supprimer cette question ?" />
                  </div>
                  <p className="mt-1 flex flex-wrap gap-1.5">
                    <Badge>{TYPE_LABEL[q.type]}</Badge>
                    {q.notation ? <Badge tone="electric">avec partition</Badge> : null}
                    <Badge tone="accent">{q.skill}</Badge>
                  </p>
                  {q.type === 'mcq' && Array.isArray(q.choices) && (
                    <ul className="mt-1 list-disc pl-5 text-slate-700">
                      {(q.choices as { id: string; label: string }[]).map((c) => (
                        <li key={c.id} className={Array.isArray(k?.correct) && (k.correct as string[]).includes(c.id) ? 'font-semibold text-success-700' : ''}>
                          {c.label}
                        </li>
                      ))}
                    </ul>
                  )}
                  {q.type !== 'mcq' && k && <p className="mt-1 text-success-700">Corrigé : {(k.correct as string[]).join(' | ')}</p>}
                </li>
              );
            })}
          </ol>
        ) : (
          <Empty>Aucune question. Ajoute des questions ci-dessous ou génère-les depuis un laboratoire.</Empty>
        )}
      </Section>
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Écrire une question">
          <QuestionForm exerciseId={exercise.id} />
        </Section>
        <Section title="Générer depuis un laboratoire">
          <p className="mb-3 text-sm text-slate-600">Questions avec partition, construites et corrigées par la logique musicale testée de la plateforme.</p>
          <GenerateForm exerciseId={exercise.id} generators={GENERATOR_OPTIONS} />
        </Section>
      </div>
    </EspaceShell>
  );
}
