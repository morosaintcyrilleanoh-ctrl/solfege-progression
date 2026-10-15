import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EspaceShell, Section } from '@/components/espace/EspaceShell';
import { SubmissionForm, SubmissionUpload } from '@/components/student/SubmissionForms';
import { Badge, buttonClasses } from '@/components/ui/primitives';
import { LocalTime } from '@/components/ui/LocalTime';
import { requireUser } from '@/lib/auth/session';
import { LessonContent } from '@/lib/content/markdown';

export default async function StudentAssignment({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, supabase, userId } = await requireUser(`/espace/eleve/devoirs/${id}`);
  const { data: a } = await supabase.from('assignments').select('*').eq('id', id).maybeSingle();
  if (!a) notFound();
  const [sub, exercise, lesson] = await Promise.all([
    supabase.from('assignment_submissions').select('*').eq('assignment_id', id).eq('student_id', userId).maybeSingle(),
    a.exercise_id ? supabase.from('exercises').select('id, title').eq('id', a.exercise_id).maybeSingle() : Promise.resolve({ data: null }),
    a.lesson_id ? supabase.from('lessons').select('id, title, module_id').eq('id', a.lesson_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const lessonCourse = lesson.data
    ? (await supabase.from('modules').select('course_id').eq('id', lesson.data.module_id).maybeSingle()).data
    : null;
  const course = lessonCourse ? (await supabase.from('courses').select('slug').eq('id', lessonCourse.course_id).maybeSingle()).data : null;
  const s = sub.data;
  const reviewed = s?.status === 'reviewed';
  const attempt = s?.attempt_id ? (await supabase.from('exercise_attempts').select('score, max_score').eq('id', s.attempt_id).maybeSingle()).data : null;

  return (
    <EspaceShell profile={profile} title={a.title}>
      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Consignes" className="lg:col-span-2">
          <p className="mb-2 text-sm text-slate-600">{a.due_at ? <>À rendre le <LocalTime iso={a.due_at} /></> : 'Sans date limite'}</p>
          {a.instructions ? <LessonContent source={a.instructions} /> : <p className="text-sm text-slate-500">Pas de consigne écrite.</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {lesson.data && course && (
              <Link href={`/cours/${course.slug}/lecon/${lesson.data.id}`} className={buttonClasses('secondary')}>
                Étudier : {lesson.data.title}
              </Link>
            )}
            {exercise.data && !reviewed && (
              <Link href={`/espace/eleve/exercices/${exercise.data.id}?devoir=${a.id}`} className={buttonClasses('primary')}>
                Faire l’exercice : {exercise.data.title}
              </Link>
            )}
          </div>
          {attempt && (
            <p className="mt-3 text-sm text-slate-700">
              Exercice rendu : <strong>{attempt.score}/{attempt.max_score}</strong>
            </p>
          )}
        </Section>
        <Section title="État">
          {s ? (
            <>
              <Badge tone={reviewed ? 'success' : s.status === 'returned' ? 'danger' : 'electric'}>{reviewed ? 'Corrigé' : s.status === 'returned' ? 'À reprendre' : 'Rendu, en attente de correction'}</Badge>
              <p className="mt-1 text-xs text-slate-500">
                Envoyé le <LocalTime iso={s.submitted_at} />
              </p>
              {s.score != null && <p className="mt-2 text-2xl font-extrabold text-ink">{s.score}/100</p>}
              {s.feedback && <p className="mt-2 whitespace-pre-line rounded-xl bg-accent-600/5 p-3 text-sm text-slate-800">{s.feedback}</p>}
              {s.attachment_path && (
                <a href={`/api/fichiers/rendu/${s.id}`} className="mt-2 inline-block text-sm font-semibold text-electric-600 hover:underline">
                  Mon fichier joint
                </a>
              )}
            </>
          ) : (
            <Badge>Pas encore rendu</Badge>
          )}
        </Section>
      </div>
      {!reviewed && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Mon travail">
            <SubmissionForm assignmentId={a.id} content={s?.content ?? ''} />
          </Section>
          <Section title="Fichier">
            <SubmissionUpload assignmentId={a.id} userId={userId} />
          </Section>
        </div>
      )}
    </EspaceShell>
  );
}
