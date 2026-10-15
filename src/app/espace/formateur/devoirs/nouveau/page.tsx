import { AssignmentForm } from '@/components/academy/PeopleForms';
import { EspaceShell, Section } from '@/components/espace/EspaceShell';
import { requireRole } from '@/lib/auth/session';
import { displayName } from '@/lib/data/names';
import { trainerStudentIds } from '@/lib/data/trainer';
import { trainerOptions } from '@/lib/data/trainer-options';

export default async function NewAssignment() {
  const { profile, supabase, userId } = await requireRole(['trainer', 'admin'], '/espace/formateur/devoirs/nouveau');
  const opts = await trainerOptions(supabase, userId, profile.role === 'admin');
  const ids = await trainerStudentIds(supabase, userId, profile.role === 'admin');
  const { data: people } = ids.length ? await supabase.from('profiles').select('id, first_name, last_name').in('id', ids).order('first_name') : { data: [] };
  let eq = supabase.from('exercises').select('id, title').order('title');
  if (profile.role !== 'admin') eq = eq.eq('owner_id', userId);
  const { data: exercises } = await eq;
  return (
    <EspaceShell profile={profile} title="Nouveau devoir">
      <Section title="Devoir">
        <AssignmentForm groups={opts.groups} students={(people ?? []).map((p) => ({ id: p.id, name: displayName(p) }))} exercises={exercises ?? []} lessons={opts.lessons} />
      </Section>
    </EspaceShell>
  );
}
