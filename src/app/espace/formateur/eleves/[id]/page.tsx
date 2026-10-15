import { notFound } from 'next/navigation';
import { toggleAdvancedUnlockAction } from '@/app/espace/formateur/actions';
import { CommentForm, LevelForm } from '@/components/academy/PeopleForms';
import { Empty, EspaceShell, Section } from '@/components/espace/EspaceShell';
import { ConfirmButton } from '@/components/forms/Controls';
import { Badge } from '@/components/ui/primitives';
import { requireRole } from '@/lib/auth/session';
import { skillAccuracy } from '@/lib/dashboard/stats';
import { LEVEL_LABELS_DB, displayName, formatDate } from '@/lib/data/names';

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, supabase } = await requireRole(['trainer', 'admin'], `/espace/formateur/eleves/${id}`);
  // Le RLS ne renvoie le profil que si l'élève est suivi par ce formateur.
  const { data: student } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (!student || student.role !== 'student') notFound();
  const [attempts, comments, unlock, submissions] = await Promise.all([
    supabase.from('exercise_attempts').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(100),
    supabase.from('pedagogical_comments').select('*').eq('student_id', id).order('created_at', { ascending: false }).limit(20),
    supabase.from('module_unlocks').select('id').eq('student_id', id).eq('lab_key', 'intervalles').maybeSingle(),
    supabase.from('assignment_submissions').select('id, assignment_id, status, score, submitted_at').eq('student_id', id).order('submitted_at', { ascending: false }).limit(20),
  ]);
  const skills = skillAccuracy(attempts.data ?? []).sort((a, b) => a.accuracy - b.accuracy);
  const placement = student.placement as { scores?: Record<string, { correct: number; total: number }> } | null;

  return (
    <EspaceShell profile={profile} title={displayName(student)} subtitle={`${LEVEL_LABELS_DB[student.level]}${student.instrument ? ` · ${student.instrument}` : ''}`}>
      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Profil musical" className="lg:col-span-2">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-500">Parcours</dt>
              <dd className="whitespace-pre-line">{student.musical_background || '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Objectifs</dt>
              <dd className="whitespace-pre-line">{student.goals || '—'}</dd>
            </div>
            {placement?.scores && (
              <div className="sm:col-span-2">
                <dt className="font-semibold text-slate-500">Test de positionnement</dt>
                <dd>
                  {Object.entries(placement.scores)
                    .map(([k, v]) => `${k} ${v.correct}/${v.total}`)
                    .join(' · ')}
                </dd>
              </div>
            )}
          </dl>
        </Section>
        <Section title="Parcours">
          <LevelForm studentId={student.id} level={student.level} />
          <div className="mt-4 border-t border-slate-100 pt-4 text-sm">
            <p className="mb-2 text-slate-600">
              Module 4 (intervalles et théorie) : {unlock.data ? <Badge tone="success">débloqué pour cet élève</Badge> : <Badge>selon son niveau</Badge>}
            </p>
            <ConfirmButton
              action={toggleAdvancedUnlockAction.bind(null, student.id, !unlock.data)}
              label={unlock.data ? 'Retirer le déblocage' : 'Débloquer le module 4'}
              variant="secondary"
            />
          </div>
        </Section>
        <Section title="Compétences (séances enregistrées)" className="lg:col-span-2">
          {skills.length ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {skills.map((s) => (
                <li key={s.skill} className="flex justify-between py-1.5">
                  <span>{s.label}</span>
                  <span className={s.accuracy < 0.7 ? 'font-semibold text-danger-700' : 'text-success-700'}>
                    {s.correct}/{s.total} ({Math.round(s.accuracy * 100)} %)
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Pas encore de résultats détaillés.</Empty>
          )}
          <p className="mt-2 text-xs text-slate-500">Les séances de laboratoire sont des entraînements corrigés sur l’appareil de l’élève ; les exercices et évaluations sont corrigés par la base.</p>
        </Section>
        <Section title="Devoirs rendus">
          {submissions.data?.length ? (
            <ul className="space-y-1 text-sm">
              {submissions.data.map((s) => (
                <li key={s.id}>
                  <a href={`/espace/formateur/devoirs/${s.assignment_id}`} className="font-medium text-electric-700 hover:underline">
                    {formatDate(s.submitted_at, false)}
                  </a>{' '}
                  · {s.status === 'reviewed' ? `corrigé${s.score != null ? ` (${s.score}/100)` : ''}` : s.status === 'returned' ? 'à reprendre' : 'à corriger'}
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Aucun devoir rendu.</Empty>
          )}
        </Section>
        <Section title="Historique" className="lg:col-span-2">
          {attempts.data?.length ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {attempts.data.slice(0, 15).map((a) => (
                <li key={a.id} className="flex justify-between py-1.5">
                  <span>
                    {a.source === 'exercise' ? 'Exercice' : a.source === 'placement' ? 'Positionnement' : `Labo ${a.lab_id}`} · {a.mode === 'evaluation' ? 'évaluation' : 'entraînement'}
                    <span className="block text-xs text-slate-500">{formatDate(a.created_at)}</span>
                  </span>
                  <span className="font-semibold">
                    {a.score}/{a.max_score}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Aucune séance enregistrée.</Empty>
          )}
        </Section>
        <Section title="Commentaires pédagogiques">
          <CommentForm studentId={student.id} />
          <ul className="mt-4 space-y-2 text-sm">
            {(comments.data ?? []).map((c) => (
              <li key={c.id} className="rounded-xl bg-mist p-2.5">
                <p className="text-xs text-slate-500">
                  {formatDate(c.created_at, false)}
                  {c.context ? ` · ${c.context}` : ''}
                </p>
                <p className="whitespace-pre-line">{c.body}</p>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </EspaceShell>
  );
}
