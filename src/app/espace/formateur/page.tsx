import type { Metadata } from 'next';
import Link from 'next/link';
import { Empty, EspaceShell, QueryError, Section } from '@/components/espace/EspaceShell';
import { Badge, buttonClasses } from '@/components/ui/primitives';
import { requireRole } from '@/lib/auth/session';
import { exerciseStats, strugglingStudents } from '@/lib/dashboard/stats';
import { displayName, formatDate } from '@/lib/data/names';
import { loadTrainerDashboard } from '@/lib/data/trainer';

export const metadata: Metadata = { title: 'Espace formateur' };

export default async function TrainerHome() {
  const { profile, supabase, userId } = await requireRole(['trainer', 'admin'], '/espace/formateur');
  const d = await loadTrainerDashboard(supabase, userId, profile.role === 'admin');
  const struggling = strugglingStudents(d.attempts, { since: d.since30 });
  const exStats = exerciseStats(d.exerciseAttempts);
  const name = (id: string) => displayName(d.profiles.get(id));

  return (
    <EspaceShell
      profile={profile}
      title="Espace formateur"
      subtitle="Données réelles de vos élèves (groupes et cours)."
      actions={
        <>
          <Link href="/espace/formateur/cours/nouveau" className={buttonClasses('primary')}>
            Nouveau cours
          </Link>
          <Link href="/espace/formateur/devoirs/nouveau" className={buttonClasses('secondary')}>
            Nouveau devoir
          </Link>
          <Link href="/espace/lives/nouveau" className={buttonClasses('secondary')}>
            Programmer un live
          </Link>
        </>
      }
    >
      {d.error && <QueryError what="certaines données" />}
      <div className="grid gap-4 sm:grid-cols-3">
        <Section title="Élèves suivis">
          <p className="text-3xl font-extrabold text-ink">{d.studentIds.length}</p>
          <Link href="/espace/formateur/eleves" className="text-sm font-semibold text-electric-600 hover:underline">
            Voir les élèves
          </Link>
        </Section>
        <Section title="Devoirs à corriger">
          <p className="text-3xl font-extrabold text-ink">{d.submissions.length}</p>
          <Link href="/espace/formateur/devoirs" className="text-sm font-semibold text-electric-600 hover:underline">
            Corriger
          </Link>
        </Section>
        <Section title="Séances (30 derniers jours)">
          <p className="text-3xl font-extrabold text-ink">{d.attempts.length}</p>
          <p className="text-xs text-slate-500">exercices faits par vos élèves</p>
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Élèves en difficulté">
          {struggling.length ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {struggling.map((s) => (
                <li key={s.userId} className="flex justify-between py-2">
                  <Link href={`/espace/formateur/eleves/${s.userId}`} className="font-semibold text-electric-700 hover:underline">
                    {name(s.userId)}
                  </Link>
                  <span className="text-danger-700">
                    {Math.round(s.accuracy * 100)} % sur {s.attempts} séances
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Aucun élève sous 60 % de réussite (au moins 3 séances sur 30 jours).</Empty>
          )}
          <p className="mt-2 text-xs text-slate-500">Critère : moins de 60 % de bonnes réponses sur au moins 3 séances en 30 jours.</p>
        </Section>

        <Section title="Devoirs à corriger">
          {d.submissions.length ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {d.submissions.slice(0, 6).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                  <span>
                    <span className="font-semibold text-ink">{d.assignmentTitles.get(s.assignment_id) ?? 'Devoir'}</span>
                    <span className="block text-xs text-slate-500">
                      {name(s.student_id)} · {formatDate(s.submitted_at)}
                    </span>
                  </span>
                  <Link href={`/espace/formateur/devoirs/${s.assignment_id}`} className="text-sm font-semibold text-electric-600 hover:underline">
                    Corriger
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Rien à corriger pour le moment.</Empty>
          )}
        </Section>

        <Section title="Activité récente">
          {d.attempts.length ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {d.attempts.slice(0, 8).map((a) => (
                <li key={a.id} className="flex justify-between gap-2 py-2">
                  <span>
                    <span className="font-medium text-ink">{name(a.user_id)}</span>
                    <span className="block text-xs text-slate-500">
                      {a.source === 'exercise' ? 'Exercice' : a.source === 'placement' ? 'Test de positionnement' : `Laboratoire ${a.lab_id ?? ''}`} ·{' '}
                      {formatDate(a.created_at)}
                    </span>
                  </span>
                  <span className="font-semibold">
                    {a.score}/{a.max_score}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Aucune activité de vos élèves ces 30 derniers jours.</Empty>
          )}
        </Section>

        <Section title="Prochaines séances en direct">
          {d.lives.length ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {d.lives.map((l) => (
                <li key={l.id} className="py-2">
                  <Link href={`/espace/lives/${l.id}`} className="font-semibold text-electric-700 hover:underline">
                    {l.title}
                  </Link>
                  <span className="block text-xs text-slate-500">{formatDate(l.starts_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Aucune séance programmée.</Empty>
          )}
        </Section>

        <Section title="Cours récents">
          {d.courses.length ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {d.courses.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2">
                  <Link href={`/espace/formateur/cours/${c.id}`} className="font-semibold text-electric-700 hover:underline">
                    {c.title}
                  </Link>
                  <Badge tone={c.status === 'published' ? 'success' : 'neutral'}>{c.status === 'published' ? 'Publié' : 'Brouillon'}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Vous n’avez pas encore créé de cours.</Empty>
          )}
        </Section>

        <Section title="Statistiques des exercices">
          {d.exercises.length ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {d.exercises.map((e) => {
                const s = exStats.get(e.id);
                return (
                  <li key={e.id} className="flex justify-between gap-2 py-2">
                    <Link href={`/espace/formateur/exercices/${e.id}`} className="font-semibold text-electric-700 hover:underline">
                      {e.title}
                    </Link>
                    <span className="text-slate-600">{s ? `${s.attempts} tentative(s), ${s.averagePercent} % en moyenne` : 'aucune tentative'}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty>Aucun exercice créé.</Empty>
          )}
        </Section>
      </div>
    </EspaceShell>
  );
}
