import Link from 'next/link';
import { notFound } from 'next/navigation';
import { deleteCourseAction, removeEnrollmentAction } from '@/app/espace/formateur/actions';
import { CourseForm, EnrollForms, ModuleForm, NewLessonForm } from '@/components/academy/CourseForms';
import { Empty, EspaceShell, Section } from '@/components/espace/EspaceShell';
import { ConfirmButton } from '@/components/forms/Controls';
import { Badge } from '@/components/ui/primitives';
import { requireRole } from '@/lib/auth/session';
import { LEVEL_LABELS_DB, displayName } from '@/lib/data/names';

export default async function CourseEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, supabase, userId } = await requireRole(['trainer', 'admin'], `/espace/formateur/cours/${id}`);
  const { data: course } = await supabase.from('courses').select('*').eq('id', id).maybeSingle();
  if (!course || (course.owner_id !== userId && profile.role !== 'admin')) notFound();

  const [modules, enrollments, groups] = await Promise.all([
    supabase.from('modules').select('*').eq('course_id', id).order('position').order('created_at'),
    supabase.from('enrollments').select('*').eq('course_id', id).order('enrolled_at', { ascending: false }),
    supabase.from('groups').select('id, name').eq('trainer_id', userId).order('name'),
  ]);
  const moduleIds = (modules.data ?? []).map((m) => m.id);
  const lessons = moduleIds.length ? await supabase.from('lessons').select('id, module_id, title, status, position').in('module_id', moduleIds).order('position') : { data: [] };
  const studentIds = (enrollments.data ?? []).map((e) => e.user_id);
  const students = studentIds.length ? await supabase.from('profiles').select('id, first_name, last_name').in('id', studentIds) : { data: [] };
  const studentName = new Map((students.data ?? []).map((s) => [s.id, displayName(s)]));

  return (
    <EspaceShell profile={profile} title={course.title} subtitle={course.status === 'published' ? 'Publié' : 'Brouillon : invisible pour les élèves'}>
      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Informations du cours" className="lg:col-span-2">
          <CourseForm course={course} />
        </Section>
        <Section title="Aperçu">
          <p className="text-sm text-slate-600">Ce que voient les élèves inscrits :</p>
          <Link href={`/cours/${course.slug}`} className="mt-2 inline-block text-sm font-semibold text-electric-600 hover:underline">
            Ouvrir la page du cours
          </Link>
          <div className="mt-6 border-t border-slate-100 pt-4">
            <ConfirmButton action={deleteCourseAction.bind(null, course.id)} label="Supprimer le cours" confirm="Supprimer ce cours, ses modules, ses leçons et ses inscriptions ? Cette action est définitive." />
          </div>
        </Section>
      </div>

      <Section title="Modules et leçons">
        <div className="space-y-4">
          {(modules.data ?? []).map((m) => (
            <details key={m.id} className="rounded-xl border border-slate-200 p-3" open={(modules.data?.length ?? 0) <= 2}>
              <summary className="flex cursor-pointer flex-wrap items-center gap-2 font-semibold text-night-800">
                {m.title}
                <Badge tone={m.status === 'published' ? 'success' : 'neutral'}>{m.status === 'published' ? 'Publié' : 'Brouillon'}</Badge>
                <Badge tone="accent">{LEVEL_LABELS_DB[m.required_level]}</Badge>
              </summary>
              <div className="mt-3 space-y-4">
                <ul className="divide-y divide-slate-100 rounded-lg bg-mist px-3">
                  {(lessons.data ?? [])
                    .filter((l) => l.module_id === m.id)
                    .map((l) => (
                      <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                        <Link href={`/espace/formateur/lecons/${l.id}`} className="font-medium text-electric-700 hover:underline">
                          {l.position}. {l.title}
                        </Link>
                        <Badge tone={l.status === 'published' ? 'success' : 'neutral'}>{l.status === 'published' ? 'Publiée' : 'Brouillon'}</Badge>
                      </li>
                    ))}
                  {!(lessons.data ?? []).some((l) => l.module_id === m.id) && <li className="py-2 text-sm text-slate-500">Aucune leçon.</li>}
                </ul>
                <NewLessonForm moduleId={m.id} />
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-slate-600">Modifier le module</summary>
                  <div className="mt-3">
                    <ModuleForm courseId={course.id} module={m} />
                  </div>
                </details>
              </div>
            </details>
          ))}
          {!modules.data?.length && <Empty>Aucun module. Commence par en ajouter un.</Empty>}
          <details className="rounded-xl border border-dashed border-slate-300 p-3" open={!modules.data?.length}>
            <summary className="cursor-pointer font-semibold text-electric-700">+ Ajouter un module</summary>
            <div className="mt-3">
              <ModuleForm courseId={course.id} />
            </div>
          </details>
        </div>
      </Section>

      <Section title={`Élèves inscrits (${enrollments.data?.length ?? 0})`}>
        <EnrollForms courseId={course.id} groups={groups.data ?? []} />
        {enrollments.data?.length ? (
          <ul className="mt-4 divide-y divide-slate-100">
            {enrollments.data.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                <Link href={`/espace/formateur/eleves/${e.user_id}`} className="font-medium text-electric-700 hover:underline">
                  {studentName.get(e.user_id) ?? 'Élève'}
                </Link>
                <ConfirmButton action={removeEnrollmentAction.bind(null, e.id, course.id)} label="Retirer" confirm="Retirer cet élève du cours ?" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Aucun élève inscrit.</p>
        )}
      </Section>
    </EspaceShell>
  );
}
