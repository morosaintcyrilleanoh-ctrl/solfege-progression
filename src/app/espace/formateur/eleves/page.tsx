import type { Metadata } from 'next';
import Link from 'next/link';
import { Empty, EspaceShell, Section } from '@/components/espace/EspaceShell';
import { requireRole } from '@/lib/auth/session';
import { LEVEL_LABELS_DB, displayName } from '@/lib/data/names';
import { trainerStudentIds } from '@/lib/data/trainer';

export const metadata: Metadata = { title: 'Élèves' };

export default async function StudentsPage() {
  const { profile, supabase, userId } = await requireRole(['trainer', 'admin'], '/espace/formateur/eleves');
  const ids = await trainerStudentIds(supabase, userId, profile.role === 'admin');
  const { data: people } = ids.length ? await supabase.from('profiles').select('id, first_name, last_name, level, instrument').in('id', ids).order('first_name') : { data: [] };
  return (
    <EspaceShell profile={profile} title="Mes élèves" subtitle="Élèves de vos groupes et de vos cours.">
      <Section title={`${people?.length ?? 0} élève(s)`}>
        {people?.length ? (
          <ul className="divide-y divide-slate-100">
            {people.map((p) => (
              <li key={p.id} className="flex justify-between gap-2 py-2.5 text-sm">
                <Link href={`/espace/formateur/eleves/${p.id}`} className="font-semibold text-electric-700 hover:underline">
                  {displayName(p)}
                </Link>
                <span className="text-slate-500">
                  {LEVEL_LABELS_DB[p.level]}
                  {p.instrument ? ` · ${p.instrument}` : ''}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Ajoutez des élèves à un groupe ou inscrivez-les à un cours.</Empty>
        )}
      </Section>
    </EspaceShell>
  );
}
