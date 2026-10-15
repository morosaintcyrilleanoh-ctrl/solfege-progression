import Link from 'next/link';
import { notFound } from 'next/navigation';
import { deleteGroupAction, removeMemberAction } from '@/app/espace/formateur/actions';
import { AddMemberForm } from '@/components/academy/PeopleForms';
import { Empty, EspaceShell, Section } from '@/components/espace/EspaceShell';
import { ConfirmButton } from '@/components/forms/Controls';
import { requireRole } from '@/lib/auth/session';
import { LEVEL_LABELS_DB, displayName } from '@/lib/data/names';

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, supabase, userId } = await requireRole(['trainer', 'admin'], `/espace/formateur/groupes/${id}`);
  const { data: group } = await supabase.from('groups').select('*').eq('id', id).maybeSingle();
  if (!group || (group.trainer_id !== userId && profile.role !== 'admin')) notFound();
  const { data: members } = await supabase.from('group_members').select('user_id, added_at').eq('group_id', id);
  const ids = (members ?? []).map((m) => m.user_id);
  const { data: people } = ids.length ? await supabase.from('profiles').select('id, first_name, last_name, level').in('id', ids).order('first_name') : { data: [] };
  return (
    <EspaceShell profile={profile} title={group.name} subtitle={group.description || undefined}>
      <div className="grid gap-4 lg:grid-cols-3">
        <Section title={`Élèves (${people?.length ?? 0})`} className="lg:col-span-2">
          {people?.length ? (
            <ul className="divide-y divide-slate-100">
              {people.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span>
                    <Link href={`/espace/formateur/eleves/${p.id}`} className="font-semibold text-electric-700 hover:underline">
                      {displayName(p)}
                    </Link>
                    <span className="text-slate-500"> · {LEVEL_LABELS_DB[p.level]}</span>
                  </span>
                  <ConfirmButton action={removeMemberAction.bind(null, group.id, p.id)} label="Retirer" confirm="Retirer cet élève du groupe ?" />
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Aucun élève dans ce groupe.</Empty>
          )}
        </Section>
        <div className="space-y-4">
          <Section title="Ajouter un élève">
            <AddMemberForm groupId={group.id} />
          </Section>
          <ConfirmButton action={deleteGroupAction.bind(null, group.id)} label="Supprimer le groupe" confirm="Supprimer ce groupe ? Les élèves gardent leur compte." />
        </div>
      </div>
    </EspaceShell>
  );
}
