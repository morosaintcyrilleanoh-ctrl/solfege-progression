import type { Metadata } from 'next';
import Link from 'next/link';
import { GroupForm } from '@/components/academy/PeopleForms';
import { Empty, EspaceShell, Section } from '@/components/espace/EspaceShell';
import { requireRole } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Groupes' };

export default async function GroupsPage() {
  const { profile, supabase, userId } = await requireRole(['trainer', 'admin'], '/espace/formateur/groupes');
  let q = supabase.from('groups').select('*').order('name');
  if (profile.role !== 'admin') q = q.eq('trainer_id', userId);
  const { data: groups } = await q;
  const ids = (groups ?? []).map((g) => g.id);
  const { data: members } = ids.length ? await supabase.from('group_members').select('group_id').in('group_id', ids) : { data: [] };
  const count = (id: string) => (members ?? []).filter((m) => m.group_id === id).length;
  return (
    <EspaceShell profile={profile} title="Groupes d’élèves">
      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Mes groupes" className="lg:col-span-2">
          {groups?.length ? (
            <ul className="divide-y divide-slate-100">
              {groups.map((g) => (
                <li key={g.id} className="flex justify-between py-3">
                  <Link href={`/espace/formateur/groupes/${g.id}`} className="font-semibold text-electric-700 hover:underline">
                    {g.name}
                  </Link>
                  <span className="text-sm text-slate-500">{count(g.id)} élève(s)</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Aucun groupe.</Empty>
          )}
        </Section>
        <Section title="Nouveau groupe">
          <GroupForm />
        </Section>
      </div>
    </EspaceShell>
  );
}
