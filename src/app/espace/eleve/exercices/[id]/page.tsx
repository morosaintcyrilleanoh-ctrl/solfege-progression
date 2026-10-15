import { notFound } from 'next/navigation';
import { EspaceShell, Section } from '@/components/espace/EspaceShell';
import { ExercisePlayer } from '@/components/student/ExercisePlayer';
import { requireUser } from '@/lib/auth/session';
import { safeNextPath } from '@/lib/auth/redirects';
import { questionFromRow } from '@/lib/content/questions';

export default async function TakeExercise({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ devoir?: string; retour?: string }> }) {
  const { id } = await params;
  const { devoir, retour } = await searchParams;
  const { profile, supabase, userId } = await requireUser(`/espace/eleve/exercices/${id}`);
  const { data: exercise } = await supabase.from('exercises').select('*').eq('id', id).maybeSingle();
  if (!exercise) notFound();
  // Énoncés uniquement : les corrigés ne sont pas lisibles par l'élève (RLS).
  const { data: rows } = await supabase.from('exercise_questions').select('id, type, skill, prompt, notation, choices, answer_kind').eq('exercise_id', id).order('position');
  const { count } = await supabase.from('exercise_attempts').select('id', { count: 'exact', head: true }).eq('exercise_id', id).eq('user_id', userId);
  const remaining = exercise.max_attempts ? exercise.max_attempts - (count ?? 0) : null;
  const back = safeNextPath(retour, devoir ? `/espace/eleve/devoirs/${devoir}` : '/espace/eleve');
  return (
    <EspaceShell profile={profile} title={exercise.title} subtitle={exercise.kind === 'assessment' ? 'Évaluation' : 'Entraînement'}>
      {exercise.description && (
        <Section title="Consigne">
          <p className="whitespace-pre-line text-sm text-slate-700">{exercise.description}</p>
        </Section>
      )}
      {remaining !== null && remaining <= 0 ? (
        <p role="alert" className="rounded-xl bg-danger-50 p-3 text-sm text-danger-700">
          Tu as utilisé toutes tes tentatives pour cet exercice.
        </p>
      ) : rows?.length ? (
        <>
          {remaining !== null && <p className="text-sm text-slate-600">Tentatives restantes : {remaining}</p>}
          <ExercisePlayer exerciseId={id} questions={rows.map(questionFromRow)} assignmentId={devoir && /^[0-9a-f-]{36}$/i.test(devoir) ? devoir : null} backHref={back} />
        </>
      ) : (
        <p className="text-sm text-slate-500">Cet exercice ne contient pas encore de question.</p>
      )}
    </EspaceShell>
  );
}
