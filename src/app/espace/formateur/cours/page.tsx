import type { Metadata } from 'next';
import Link from 'next/link';
import { Empty, EspaceShell, QueryError, Section } from '@/components/espace/EspaceShell';
import { Badge, buttonClasses } from '@/components/ui/primitives';
import { requireRole } from '@/lib/auth/session';
import { LEVEL_LABELS_DB, formatDate } from '@/lib/data/names';

export const metadata: Metadata = { title: 'Cours' };

export default async function TrainerCourses() {
  const { profile, supabase, userId } = await requireRole(['trainer', 'admin'], '/espace/formateur/cours');
  let query = supabase.from('courses').select('*').order('position').order('created_at', { ascending: false });
  if (profile.role !== 'admin') query = query.eq('owner_id', userId);
  const { data, error } = await query;
  return (
    <EspaceShell
      profile={profile}
      title="Cours"
      subtitle={profile.role === 'admin' ? 'Tous les cours de la plateforme.' : 'Vos cours, modules et leçons.'}
      actions={
        <Link href="/espace/formateur/cours/nouveau" className={buttonClasses('primary')}>
          Nouveau cours
        </Link>
      }
    >
      {error && <QueryError what="les cours" />}
      <Section title={`${data?.length ?? 0} cours`}>
        {data?.length ? (
          <ul className="divide-y divide-slate-100">
            {data.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <Link href={`/espace/formateur/cours/${c.id}`} className="font-semibold text-electric-700 hover:underline">
                    {c.title}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {LEVEL_LABELS_DB[c.level]} · modifié le {formatDate(c.updated_at, false)}
                    {c.is_open ? ' · ouvert à l’inscription' : ''}
                  </p>
                </div>
                <Badge tone={c.status === 'published' ? 'success' : 'neutral'}>{c.status === 'published' ? 'Publié' : 'Brouillon'}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Aucun cours pour le moment.</Empty>
        )}
      </Section>
    </EspaceShell>
  );
}
