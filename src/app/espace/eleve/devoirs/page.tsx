import type { Metadata } from 'next';
import Link from 'next/link';
import { Empty, EspaceShell, QueryError, Section } from '@/components/espace/EspaceShell';
import { Badge } from '@/components/ui/primitives';
import { LocalTime } from '@/components/ui/LocalTime';
import { requireUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Mes devoirs' };

const STATUS = { submitted: ['Rendu', 'electric'], reviewed: ['Corrigé', 'success'], returned: ['À reprendre', 'danger'] } as const;

export default async function StudentAssignments() {
  const { profile, supabase, userId } = await requireUser('/espace/eleve/devoirs');
  const [assignments, subs] = await Promise.all([
    supabase.from('assignments').select('*').eq('status', 'published').order('due_at', { ascending: true, nullsFirst: false }),
    supabase.from('assignment_submissions').select('assignment_id, status, score').eq('student_id', userId),
  ]);
  const sub = new Map((subs.data ?? []).map((s) => [s.assignment_id, s]));
  return (
    <EspaceShell profile={profile} title="Mes devoirs">
      {assignments.error && <QueryError what="les devoirs" />}
      <Section title={`${assignments.data?.length ?? 0} devoir(s)`}>
        {assignments.data?.length ? (
          <ul className="divide-y divide-slate-100">
            {assignments.data.map((a) => {
              const s = sub.get(a.id);
              return (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <Link href={`/espace/eleve/devoirs/${a.id}`} className="font-semibold text-electric-700 hover:underline">
                      {a.title}
                    </Link>
                    <p className="text-xs text-slate-500">{a.due_at ? <>À rendre le <LocalTime iso={a.due_at} /></> : 'Sans date limite'}</p>
                  </div>
                  {s ? <Badge tone={STATUS[s.status][1]}>{STATUS[s.status][0]}{s.status === 'reviewed' && s.score != null ? ` · ${s.score}/100` : ''}</Badge> : <Badge>À faire</Badge>}
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>Aucun devoir pour le moment.</Empty>
        )}
      </Section>
    </EspaceShell>
  );
}
