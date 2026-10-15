import type { Metadata } from 'next';
import Link from 'next/link';
import { Empty, EspaceShell, QueryError, Section } from '@/components/espace/EspaceShell';
import { LocalImport } from '@/components/espace/LocalImport';
import { Badge, ProgressBar, buttonClasses } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { requireRole } from '@/lib/auth/session';
import { answersThisWeek, courseProgress, recommendations } from '@/lib/dashboard/stats';
import { LEVEL_LABELS_DB, formatDate } from '@/lib/data/names';
import { loadStudentDashboard } from '@/lib/data/student';

export const metadata: Metadata = { title: 'Mon espace élève' };

const LAB_NAMES: Record<string, string> = {
  'lecture-des-notes': 'Lecture des notes',
  rythme: 'Rythme',
  tonalites: 'Tonalités et gammes',
  intervalles: 'Intervalles et théorie',
  positionnement: 'Test de positionnement',
};

export default async function StudentHome() {
  const { profile, supabase, userId } = await requireRole(['student', 'trainer', 'admin'], '/espace/eleve');
  const d = await loadStudentDashboard(supabase, userId);
  const week = answersThisWeek(d.attempts);
  const progress = courseProgress(d.lessonsByCourse, d.progress);
  const recos = recommendations(d.attempts);
  const nextLive = d.lives[0];

  return (
    <EspaceShell profile={profile} title={profile.first_name ? `Bonjour ${profile.first_name} !` : 'Bonjour !'} subtitle={`Niveau actuel : ${LEVEL_LABELS_DB[profile.level]}`}>
      {d.error && <QueryError what="certaines informations" />}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl bg-night-800 p-5 text-white lg:col-span-2">
          <p className="text-sm text-accent-300">Dernière leçon suivie</p>
          {d.lastLesson ? (
            <>
              <p className="mt-1 text-xl font-bold">{d.lastLesson.title}</p>
              {d.lastLesson.course && <p className="text-sm text-white/70">{d.lastLesson.course.title}</p>}
              <Link
                href={d.lastLesson.course ? `/cours/${d.lastLesson.course.slug}/lecon/${d.lastLesson.id}` : '/cours'}
                className={`${buttonClasses('primary', 'lg')} mt-4`}
              >
                <Icon name="play" /> Reprendre mon apprentissage
              </Link>
            </>
          ) : (
            <>
              <p className="mt-1 text-lg font-semibold">Aucune leçon commencée pour l’instant.</p>
              <Link href={d.courses.length ? '/cours' : '/laboratoires'} className={`${buttonClasses('primary', 'lg')} mt-4`}>
                <Icon name="play" /> {d.courses.length ? 'Commencer un cours' : 'Aller aux laboratoires'}
              </Link>
            </>
          )}
        </section>

        <Section title="Objectif de la semaine">
          <p className="text-2xl font-extrabold text-ink">
            {Math.min(week, profile.weekly_goal)}
            <span className="text-base font-medium text-slate-500"> / {profile.weekly_goal} réponses</span>
          </p>
          <div className="mt-2">
            <ProgressBar value={Math.min(week, profile.weekly_goal)} max={profile.weekly_goal} label="Objectif de la semaine" tone="success" />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Compte les réponses enregistrées sur ton compte depuis lundi.{' '}
            <Link href="/profil" className="font-semibold text-electric-600 hover:underline">
              Modifier l’objectif
            </Link>
          </p>
        </Section>

        <Section title="Progression des cours" className="lg:col-span-2">
          {progress.length ? (
            <ul className="space-y-3">
              {progress.map((p) => {
                const c = d.courseById.get(p.courseId);
                return (
                  <li key={p.courseId}>
                    <div className="mb-1 flex justify-between gap-2 text-sm">
                      <Link href={c ? `/cours/${c.slug}` : '/cours'} className="font-semibold text-electric-700 hover:underline">
                        {c?.title ?? 'Cours'}
                      </Link>
                      <span className="text-slate-500">
                        {p.completed}/{p.total} leçon{p.total > 1 ? 's' : ''} terminée{p.completed > 1 ? 's' : ''}
                      </span>
                    </div>
                    <ProgressBar value={p.completed} max={p.total || 1} label={c?.title ?? 'Cours'} tone={p.percent === 100 ? 'success' : 'electric'} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty>Tu n’es inscrit à aucun cours. Ton formateur peut t’inscrire, ou choisis un cours ouvert dans le catalogue.</Empty>
          )}
        </Section>

        <Section title="Prochain cours en direct">
          {nextLive ? (
            <div>
              <p className="font-semibold text-ink">{nextLive.title}</p>
              <p className="text-sm text-slate-600">{formatDate(nextLive.starts_at)}</p>
              <Link href={`/espace/lives/${nextLive.id}`} className="mt-2 inline-block text-sm font-semibold text-electric-600 hover:underline">
                Voir la séance
              </Link>
            </div>
          ) : (
            <Empty>Aucune séance programmée.</Empty>
          )}
        </Section>

        <Section title="Exercices recommandés">
          {recos.length ? (
            <ul className="space-y-2 text-sm">
              {recos.map((r) => (
                <li key={r.skill}>
                  <Link href={r.href} className="font-semibold text-electric-700 hover:underline">
                    {r.label}
                  </Link>
                  <span className="text-slate-500">
                    {' '}
                    · {r.correct}/{r.total} réussies ce mois-ci
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>
              Pas encore assez de résultats sur ton compte pour une recommandation fiable.{' '}
              {!profile.placement && (
                <Link href="/test-de-positionnement" className="font-semibold text-electric-600 hover:underline">
                  Passe le test de positionnement.
                </Link>
              )}
            </Empty>
          )}
        </Section>

        <Section title="Résultats récents" className="lg:col-span-2">
          {d.attempts.length ? (
            <ul className="divide-y divide-slate-100">
              {d.attempts.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span>
                    <span className="font-medium text-ink">{a.source === 'exercise' ? 'Exercice du formateur' : LAB_NAMES[a.lab_id ?? ''] ?? 'Laboratoire'}</span>{' '}
                    <Badge tone={a.mode === 'evaluation' ? 'accent' : 'electric'}>{a.mode === 'evaluation' ? 'Évaluation' : 'Entraînement'}</Badge>
                    <span className="block text-xs text-slate-500">{formatDate(a.created_at)}</span>
                  </span>
                  <span className="font-bold">
                    {a.score}/{a.max_score}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Aucun résultat enregistré sur ton compte ce mois-ci.</Empty>
          )}
        </Section>

        <Section title="Devoirs à rendre">
          {d.pendingAssignments.length ? (
            <ul className="space-y-2 text-sm">
              {d.pendingAssignments.slice(0, 4).map((a) => (
                <li key={a.id}>
                  <Link href={`/espace/eleve/devoirs/${a.id}`} className="font-semibold text-electric-700 hover:underline">
                    {a.title}
                  </Link>
                  {a.due_at && <span className="block text-xs text-slate-500">À rendre le {formatDate(a.due_at)}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Aucun devoir en attente.</Empty>
          )}
        </Section>

        {(d.comments.length > 0 || d.announcements.length > 0) && (
          <Section title="Messages" className="lg:col-span-3">
            <ul className="space-y-3 text-sm">
              {d.comments.map((c) => (
                <li key={c.id} className="rounded-xl bg-accent-600/5 p-3">
                  <p className="text-xs font-semibold text-accent-700">Commentaire de ton formateur · {formatDate(c.created_at, false)}</p>
                  <p className="whitespace-pre-line text-slate-800">{c.body}</p>
                </li>
              ))}
              {d.announcements.map((a) => (
                <li key={a.id} className="rounded-xl bg-mist p-3">
                  <p className="text-xs font-semibold text-slate-500">Annonce · {formatDate(a.published_at, false)}</p>
                  <p className="font-semibold text-ink">{a.title}</p>
                  <p className="line-clamp-3 whitespace-pre-line text-slate-700">{a.body}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}
        <div className="lg:col-span-3">
          <LocalImport />
        </div>
      </div>
    </EspaceShell>
  );
}
