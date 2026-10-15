import type { Metadata } from 'next';
import Link from 'next/link';
import { Empty, EspaceShell, Section } from '@/components/espace/EspaceShell';
import { Badge, buttonClasses } from '@/components/ui/primitives';
import { requireRole } from '@/lib/auth/session';
import { LocalTime } from '@/components/ui/LocalTime';

export const metadata: Metadata = { title: 'Devoirs' };

export default async function AssignmentsPage() {
  const { profile, supabase, userId } = await requireRole(['trainer', 'admin'], '/espace/formateur/devoirs');
  let q = supabase.from('assignments').select('*').order('created_at', { ascending: false });
  if (profile.role !== 'admin') q = q.eq('created_by', userId);
  const { data: assignments } = await q;
  const ids = (assignments ?? []).map((a) => a.id);
  const { data: subs } = ids.length ? await supabase.from('assignment_submissions').select('assignment_id, status').in('assignment_id', ids) : { data: [] };
  const pending = (id: string) => (subs ?? []).filter((s) => s.assignment_id === id && s.status === 'submitted').length;
  const total = (id: string) => (subs ?? []).filter((s) => s.assignment_id === id).length;
  return (
    <EspaceShell
      profile={profile}
      title="Devoirs"
      actions={
        <Link href="/espace/formateur/devoirs/nouveau" className={buttonClasses('primary')}>
          Nouveau devoir
        </Link>
      }
    >
      <Section title={`${assignments?.length ?? 0} devoir(s)`}>
        {assignments?.length ? (
          <ul className="divide-y divide-slate-100">
            {assignments.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <Link href={`/espace/formateur/devoirs/${a.id}`} className="font-semibold text-electric-700 hover:underline">
                    {a.title}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {a.due_at ? <>À rendre le <LocalTime iso={a.due_at} /></> : 'Sans date limite'} · {total(a.id)} rendu(s)
                  </p>
                </div>
                <span className="flex gap-1.5">
                  {pending(a.id) > 0 && <Badge tone="danger">{pending(a.id)} à corriger</Badge>}
                  <Badge tone={a.status === 'published' ? 'success' : 'neutral'}>{a.status === 'published' ? 'Publié' : 'Brouillon'}</Badge>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Aucun devoir.</Empty>
        )}
      </Section>
    </EspaceShell>
  );
}
