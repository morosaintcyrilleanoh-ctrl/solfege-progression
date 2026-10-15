import type { Metadata } from 'next';
import Link from 'next/link';
import { Empty, EspaceShell, QueryError, Section } from '@/components/espace/EspaceShell';
import { Badge, buttonClasses } from '@/components/ui/primitives';
import { requireRole } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Exercices' };

export default async function TrainerExercises() {
  const { profile, supabase, userId } = await requireRole(['trainer', 'admin'], '/espace/formateur/exercices');
  let q = supabase.from('exercises').select('*').order('updated_at', { ascending: false });
  if (profile.role !== 'admin') q = q.eq('owner_id', userId);
  const { data, error } = await q;
  return (
    <EspaceShell
      profile={profile}
      title="Exercices et évaluations"
      subtitle="QCM, réponses courtes, associations, et questions générées par les laboratoires. Corrigés gardés dans la base."
      actions={
        <Link href="/espace/formateur/exercices/nouveau" className={buttonClasses('primary')}>
          Nouvel exercice
        </Link>
      }
    >
      {error && <QueryError what="les exercices" />}
      <Section title={`${data?.length ?? 0} exercice(s)`}>
        {data?.length ? (
          <ul className="divide-y divide-slate-100">
            {data.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 py-3">
                <Link href={`/espace/formateur/exercices/${e.id}`} className="font-semibold text-electric-700 hover:underline">
                  {e.title}
                </Link>
                <span className="flex gap-1.5">
                  <Badge tone={e.kind === 'assessment' ? 'accent' : 'electric'}>{e.kind === 'assessment' ? 'Évaluation' : 'Entraînement'}</Badge>
                  <Badge tone={e.status === 'published' ? 'success' : 'neutral'}>{e.status === 'published' ? 'Publié' : 'Brouillon'}</Badge>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Aucun exercice.</Empty>
        )}
      </Section>
    </EspaceShell>
  );
}
