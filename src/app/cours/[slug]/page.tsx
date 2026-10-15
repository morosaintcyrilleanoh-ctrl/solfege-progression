import Link from 'next/link';
import { notFound } from 'next/navigation';
import { enrollSelfAction } from '@/app/cours/actions';
import { Empty, EspaceShell, Section } from '@/components/espace/EspaceShell';
import { ConfirmButton } from '@/components/forms/Controls';
import { Badge } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { requireUser } from '@/lib/auth/session';
import { LessonContent } from '@/lib/content/markdown';
import { LEVEL_LABELS_DB } from '@/lib/data/names';

const RANK = { debutant: 0, intermediaire: 1, avance: 2 } as const;

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { profile, supabase, userId } = await requireUser(`/cours/${slug}`);
  const { data: course } = await supabase.from('courses').select('*').eq('slug', slug).maybeSingle();
  if (!course) notFound();
  const [modules, enrollment, exercises] = await Promise.all([
    supabase.from('modules').select('*').eq('course_id', course.id).order('position').order('created_at'),
    supabase.from('enrollments').select('status').eq('course_id', course.id).eq('user_id', userId).maybeSingle(),
    supabase.from('exercises').select('id, title, kind').eq('course_id', course.id).eq('status', 'published').is('lesson_id', null),
  ]);
  const moduleIds = (modules.data ?? []).map((m) => m.id);
  // Le RLS ne renvoie que les leçons auxquelles l'élève a accès.
  const lessons = moduleIds.length ? await supabase.from('lessons').select('id, module_id, title, duration_minutes, position').in('module_id', moduleIds).order('position') : { data: [] };
  const lessonIds = (lessons.data ?? []).map((l) => l.id);
  const progress = lessonIds.length ? await supabase.from('learning_progress').select('lesson_id, status').eq('user_id', userId).in('lesson_id', lessonIds) : { data: [] };
  const status = new Map((progress.data ?? []).map((p) => [p.lesson_id, p.status]));
  const enrolled = !!enrollment.data;
  const staffView = course.owner_id === userId || profile.role === 'admin';

  return (
    <EspaceShell profile={profile} title={course.title} subtitle={`Niveau ${LEVEL_LABELS_DB[course.level].toLowerCase()}`}>
      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Présentation" className="lg:col-span-2">
          {course.description ? <LessonContent source={course.description} /> : <Empty>Pas de présentation.</Empty>}
        </Section>
        <Section title="Inscription">
          {enrolled || staffView ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-success-700">
              <Icon name="check" /> {staffView && !enrolled ? 'Vue formateur' : 'Tu es inscrit à ce cours.'}
            </p>
          ) : course.is_open ? (
            <ConfirmButton action={enrollSelfAction.bind(null, course.id, course.slug)} label="M’inscrire à ce cours" variant="primary" />
          ) : (
            <p className="text-sm text-slate-600">Ce cours est ouvert sur inscription par le formateur. Demande-lui de t’ajouter.</p>
          )}
        </Section>
      </div>
      <Section title="Programme">
        <ol className="space-y-4">
          {(modules.data ?? []).map((m) => {
            const ls = (lessons.data ?? []).filter((l) => l.module_id === m.id);
            const locked = !staffView && RANK[m.required_level] > RANK[profile.level];
            return (
              <li key={m.id}>
                <p className="flex flex-wrap items-center gap-2 font-semibold text-night-800">
                  {m.title}
                  {m.required_level !== 'debutant' && <Badge tone="accent">Niveau {LEVEL_LABELS_DB[m.required_level].toLowerCase()}</Badge>}
                </p>
                {m.description && <p className="text-sm text-slate-600">{m.description}</p>}
                {ls.length ? (
                  <ul className="mt-2 divide-y divide-slate-100 rounded-xl bg-mist px-3">
                    {ls.map((l) => {
                      const st = status.get(l.id);
                      return (
                        <li key={l.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                          <Link href={`/cours/${course.slug}/lecon/${l.id}`} className="font-medium text-electric-700 hover:underline">
                            {l.title}
                          </Link>
                          <span className="shrink-0 text-xs">
                            {st === 'completed' ? (
                              <Badge tone="success">Terminée</Badge>
                            ) : st === 'in_progress' ? (
                              <Badge tone="electric">En cours</Badge>
                            ) : (
                              <span className="text-slate-500">Non commencée{l.duration_minutes ? ` · ${l.duration_minutes} min` : ''}</span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-2 flex items-center gap-2 rounded-xl bg-mist p-3 text-sm text-slate-600">
                    {locked ? (
                      <>
                        <Icon name="lock" className="size-4" /> Module prévu pour le niveau {LEVEL_LABELS_DB[m.required_level].toLowerCase()}. Ton formateur peut l’ouvrir pour toi.
                      </>
                    ) : enrolled ? (
                      'Leçons bientôt disponibles.'
                    ) : (
                      'Leçons réservées aux élèves inscrits.'
                    )}
                  </p>
                )}
              </li>
            );
          })}
          {!modules.data?.length && <Empty>Programme en préparation.</Empty>}
        </ol>
      </Section>
      {(exercises.data?.length ?? 0) > 0 && (
        <Section title="Exercices du cours">
          <ul className="space-y-2 text-sm">
            {exercises.data!.map((e) => (
              <li key={e.id}>
                <Link href={`/espace/eleve/exercices/${e.id}`} className="font-semibold text-electric-700 hover:underline">
                  {e.title}
                </Link>{' '}
                <Badge tone={e.kind === 'assessment' ? 'accent' : 'electric'}>{e.kind === 'assessment' ? 'Évaluation' : 'Entraînement'}</Badge>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </EspaceShell>
  );
}
