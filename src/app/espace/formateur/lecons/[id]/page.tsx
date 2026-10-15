import Link from 'next/link';
import { notFound } from 'next/navigation';
import { deleteLessonAction, deleteResourceAction } from '@/app/espace/formateur/actions';
import { LessonForm, LinkResourceForm } from '@/components/academy/CourseForms';
import { ResourceUpload } from '@/components/academy/ResourceUpload';
import { Empty, EspaceShell, Section } from '@/components/espace/EspaceShell';
import { ConfirmButton } from '@/components/forms/Controls';
import { requireRole } from '@/lib/auth/session';
import { formatSize } from '@/lib/content/files';

export default async function LessonEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, supabase } = await requireRole(['trainer', 'admin'], `/espace/formateur/lecons/${id}`);
  const { data: lesson } = await supabase.from('lessons').select('*').eq('id', id).maybeSingle();
  if (!lesson) notFound();
  const { data: mod } = await supabase.from('modules').select('id, title, course_id').eq('id', lesson.module_id).maybeSingle();
  const { data: course } = mod ? await supabase.from('courses').select('id, title, slug').eq('id', mod.course_id).maybeSingle() : { data: null };
  if (!mod || !course) notFound();
  const { data: resources } = await supabase.from('lesson_resources').select('*').eq('lesson_id', id).order('position').order('created_at');

  return (
    <EspaceShell profile={profile} title={lesson.title} subtitle={`${course.title} · ${mod.title}`}>
      <p className="text-sm">
        <Link href={`/espace/formateur/cours/${course.id}`} className="font-semibold text-electric-600 hover:underline">
          ← Retour au cours
        </Link>
        {' · '}
        <Link href={`/cours/${course.slug}/lecon/${lesson.id}`} className="font-semibold text-electric-600 hover:underline">
          Voir comme un élève
        </Link>
      </p>
      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Contenu de la leçon" className="lg:col-span-2">
          <LessonForm lesson={lesson} />
        </Section>
        <div className="space-y-4">
          <Section title="Ressources">
            {resources?.length ? (
              <ul className="divide-y divide-slate-100 text-sm">
                {resources.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 py-2">
                    <span>
                      <span className="font-medium text-ink">{r.title}</span>
                      <span className="block text-xs text-slate-500">
                        {r.storage_path ? `Fichier privé ${formatSize(r.size_bytes)}` : 'Lien externe'} · {r.kind}
                      </span>
                    </span>
                    <ConfirmButton action={deleteResourceAction.bind(null, r.id)} label="Supprimer" confirm="Supprimer cette ressource ?" />
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Aucune ressource.</Empty>
            )}
          </Section>
          <Section title="Ajouter un fichier">
            <ResourceUpload courseId={course.id} lessonId={lesson.id} />
          </Section>
          <Section title="Ajouter un lien">
            <LinkResourceForm lessonId={lesson.id} />
          </Section>
          <ConfirmButton action={deleteLessonAction.bind(null, lesson.id, course.id)} label="Supprimer la leçon" confirm="Supprimer cette leçon et ses ressources ?" />
        </div>
      </div>
    </EspaceShell>
  );
}
