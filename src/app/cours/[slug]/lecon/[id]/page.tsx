import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EspaceShell, Section } from '@/components/espace/EspaceShell';
import { LessonProgress, VideoPlayer } from '@/components/student/LessonTools';
import { Badge, buttonClasses } from '@/components/ui/primitives';
import { requireUser } from '@/lib/auth/session';
import { formatSize } from '@/lib/content/files';
import { LessonContent } from '@/lib/content/markdown';
import { embedUrl } from '@/lib/content/video';

const KIND = { pdf: 'PDF', audio: 'Audio', video: 'Vidéo', image: 'Image', document: 'Document', link: 'Lien' } as const;

export default async function LessonPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const { profile, supabase, userId } = await requireUser(`/cours/${slug}/lecon/${id}`);
  // Le RLS ne renvoie la leçon que si l'élève y a accès (publiée, inscrit, niveau ou déblocage).
  const { data: lesson } = await supabase.from('lessons').select('*').eq('id', id).maybeSingle();
  if (!lesson) notFound();
  const { data: course } = await supabase.from('courses').select('id, title, slug').eq('slug', slug).maybeSingle();
  if (!course) notFound();
  const [resources, progress, exercises, siblings] = await Promise.all([
    supabase.from('lesson_resources').select('*').eq('lesson_id', id).order('position'),
    supabase.from('learning_progress').select('status, last_position').eq('user_id', userId).eq('lesson_id', id).maybeSingle(),
    supabase.from('exercises').select('id, title, kind').eq('lesson_id', id).eq('status', 'published'),
    supabase.from('lessons').select('id, position, title').eq('module_id', lesson.module_id).order('position'),
  ]);
  const list = siblings.data ?? [];
  const idx = list.findIndex((l) => l.id === id);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
  const scroll = (progress.data?.last_position as { scroll?: number } | null)?.scroll ?? 0;

  return (
    <EspaceShell profile={profile} title={lesson.title} subtitle={course.title}>
      <p className="text-sm">
        <Link href={`/cours/${course.slug}`} className="font-semibold text-electric-600 hover:underline">
          ← Programme du cours
        </Link>
        {lesson.status === 'draft' && <Badge>Brouillon (aperçu formateur)</Badge>}
      </p>
      {lesson.video_url && <VideoPlayer embed={embedUrl(lesson.video_url)} url={lesson.video_url} />}
      <Section title="Leçon">
        {lesson.summary && <p className="mb-3 font-medium text-slate-700">{lesson.summary}</p>}
        {lesson.content ? <LessonContent source={lesson.content} /> : <p className="text-sm text-slate-500">Pas de contenu écrit.</p>}
      </Section>
      {(resources.data?.length ?? 0) > 0 && (
        <Section title="Ressources">
          <ul className="divide-y divide-slate-100">
            {resources.data!.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <span className="font-medium text-ink">{r.title}</span>
                  <span className="block text-xs text-slate-500">
                    {KIND[r.kind]} {formatSize(r.size_bytes)}
                  </span>
                </span>
                <a href={`/api/fichiers/ressource/${r.id}`} className={buttonClasses('secondary')} target={r.external_url ? '_blank' : undefined} rel="noopener noreferrer">
                  {r.external_url ? 'Ouvrir' : r.downloadable ? 'Télécharger' : 'Consulter'}
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {(exercises.data?.length ?? 0) > 0 && (
        <Section title="Exercices">
          <ul className="space-y-2 text-sm">
            {exercises.data!.map((e) => (
              <li key={e.id}>
                <Link href={`/espace/eleve/exercices/${e.id}?retour=${encodeURIComponent(`/cours/${course.slug}/lecon/${id}`)}`} className="font-semibold text-electric-700 hover:underline">
                  {e.title}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Section title="Ma progression">
        <LessonProgress lessonId={lesson.id} initialStatus={progress.data?.status ?? null} initialScroll={scroll} />
      </Section>
      <div className="flex justify-between gap-2">
        {prev ? (
          <Link href={`/cours/${course.slug}/lecon/${prev.id}`} className={buttonClasses('secondary')}>
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/cours/${course.slug}/lecon/${next.id}`} className={buttonClasses('primary')}>
            {next.title} →
          </Link>
        )}
      </div>
    </EspaceShell>
  );
}
