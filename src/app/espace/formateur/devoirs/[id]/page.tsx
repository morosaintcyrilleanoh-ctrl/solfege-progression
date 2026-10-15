import { notFound } from 'next/navigation';
import { deleteAssignmentAction, updateAssignmentStatusAction } from '@/app/espace/formateur/actions';
import { ReviewForm } from '@/components/academy/PeopleForms';
import { Empty, EspaceShell, Section } from '@/components/espace/EspaceShell';
import { ConfirmButton } from '@/components/forms/Controls';
import { Badge } from '@/components/ui/primitives';
import { requireRole } from '@/lib/auth/session';
import { LessonContent } from '@/lib/content/markdown';
import { displayName } from '@/lib/data/names';
import { LocalTime } from '@/components/ui/LocalTime';

const STATUS = { submitted: 'À corriger', reviewed: 'Corrigé', returned: 'À reprendre' } as const;

export default async function AssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, supabase, userId } = await requireRole(['trainer', 'admin'], `/espace/formateur/devoirs/${id}`);
  const { data: a } = await supabase.from('assignments').select('*').eq('id', id).maybeSingle();
  if (!a || (a.created_by !== userId && profile.role !== 'admin')) notFound();
  const { data: subs } = await supabase.from('assignment_submissions').select('*').eq('assignment_id', id).order('submitted_at');
  const ids = (subs ?? []).map((s) => s.student_id);
  const attemptIds = (subs ?? []).map((s) => s.attempt_id).filter((x): x is string => !!x);
  const [people, attempts, group] = await Promise.all([
    ids.length ? supabase.from('profiles').select('id, first_name, last_name').in('id', ids) : Promise.resolve({ data: [] as { id: string; first_name: string; last_name: string }[] }),
    attemptIds.length ? supabase.from('exercise_attempts').select('id, score, max_score').in('id', attemptIds) : Promise.resolve({ data: [] as { id: string; score: number; max_score: number }[] }),
    a.group_id ? supabase.from('groups').select('name').eq('id', a.group_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const name = new Map((people.data ?? []).map((p) => [p.id, displayName(p)]));
  const attempt = new Map((attempts.data ?? []).map((t) => [t.id, t]));

  return (
    <EspaceShell profile={profile} title={a.title} subtitle={group.data ? `Groupe ${group.data.name}` : 'Devoir individuel'}>
      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Consignes" className="lg:col-span-2">
          <p className="mb-2 text-sm text-slate-600">{a.due_at ? <>À rendre le <LocalTime iso={a.due_at} /></> : 'Sans date limite'}</p>
          {a.instructions ? <LessonContent source={a.instructions} /> : <Empty>Pas de consigne écrite.</Empty>}
        </Section>
        <Section title="Publication">
          <p className="mb-3">
            <Badge tone={a.status === 'published' ? 'success' : 'neutral'}>{a.status === 'published' ? 'Publié : visible par les élèves' : 'Brouillon'}</Badge>
          </p>
          <div className="flex flex-wrap gap-2">
            <ConfirmButton
              action={updateAssignmentStatusAction.bind(null, a.id, a.status === 'published' ? 'draft' : 'published')}
              label={a.status === 'published' ? 'Dépublier' : 'Publier'}
              variant="secondary"
            />
            <ConfirmButton action={deleteAssignmentAction.bind(null, a.id)} label="Supprimer" confirm="Supprimer ce devoir et les rendus des élèves ?" />
          </div>
        </Section>
      </div>
      <Section title={`Rendus (${subs?.length ?? 0})`}>
        {subs?.length ? (
          <ul className="space-y-4">
            {subs.map((s) => {
              const t = s.attempt_id ? attempt.get(s.attempt_id) : null;
              return (
                <li key={s.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-ink">{name.get(s.student_id) ?? 'Élève'}</p>
                    <span className="flex items-center gap-2 text-xs text-slate-500">
                      <LocalTime iso={s.submitted_at} />
                      <Badge tone={s.status === 'submitted' ? 'danger' : s.status === 'reviewed' ? 'success' : 'accent'}>{STATUS[s.status]}</Badge>
                    </span>
                  </div>
                  {t && (
                    <p className="mt-1 text-sm text-slate-700">
                      Exercice corrigé par la base : <strong>{t.score}/{t.max_score}</strong>
                    </p>
                  )}
                  {s.content && <p className="mt-2 whitespace-pre-line rounded-lg bg-mist p-2 text-sm">{s.content}</p>}
                  {s.attachment_path && (
                    <a href={`/api/fichiers/rendu/${s.id}`} className="mt-2 inline-block text-sm font-semibold text-electric-600 hover:underline">
                      Télécharger le fichier joint
                    </a>
                  )}
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <ReviewForm submissionId={s.id} assignmentId={a.id} score={s.score} feedback={s.feedback} />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>Aucun rendu pour le moment.</Empty>
        )}
      </Section>
    </EspaceShell>
  );
}
