import type { Metadata } from 'next';
import Link from 'next/link';
import { Empty, EspaceShell, QueryError, Section } from '@/components/espace/EspaceShell';
import { Badge } from '@/components/ui/primitives';
import { requireUser } from '@/lib/auth/session';
import { LEVEL_LABELS_DB } from '@/lib/data/names';

export const metadata: Metadata = { title: 'Cours' };

export default async function CoursesPage() {
  const { profile, supabase, userId } = await requireUser('/cours');
  const [courses, enrollments] = await Promise.all([
    supabase.from('courses').select('*').eq('status', 'published').order('position').order('title'),
    supabase.from('enrollments').select('course_id').eq('user_id', userId),
  ]);
  const mine = new Set((enrollments.data ?? []).map((e) => e.course_id));
  const list = courses.data ?? [];
  const card = (c: (typeof list)[number]) => (
    <li key={c.id}>
      <Link href={`/cours/${c.slug}`} className="block h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-electric-400">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="accent">{LEVEL_LABELS_DB[c.level]}</Badge>
          {mine.has(c.id) ? <Badge tone="success">Inscrit</Badge> : c.is_open ? <Badge tone="electric">Inscription libre</Badge> : <Badge>Sur inscription du formateur</Badge>}
        </div>
        <p className="mt-2 font-bold text-night-800">{c.title}</p>
        <p className="mt-1 line-clamp-3 text-sm text-slate-600">{c.description}</p>
      </Link>
    </li>
  );
  return (
    <EspaceShell profile={profile} title="Cours" subtitle="Tes cours et le catalogue de l’académie.">
      {courses.error && <QueryError what="les cours" />}
      <Section title="Mes cours">
        {list.some((c) => mine.has(c.id)) ? <ul className="grid gap-3 sm:grid-cols-2">{list.filter((c) => mine.has(c.id)).map(card)}</ul> : <Empty>Tu n’es inscrit à aucun cours pour l’instant.</Empty>}
      </Section>
      <Section title="Catalogue">
        {list.some((c) => !mine.has(c.id)) ? <ul className="grid gap-3 sm:grid-cols-2">{list.filter((c) => !mine.has(c.id)).map(card)}</ul> : <Empty>Aucun autre cours publié.</Empty>}
      </Section>
    </EspaceShell>
  );
}
