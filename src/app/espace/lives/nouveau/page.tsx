import { LiveForm } from '@/components/academy/LiveForms';
import { EspaceShell, Section } from '@/components/espace/EspaceShell';
import { requireRole } from '@/lib/auth/session';
import { trainerOptions } from '@/lib/data/trainer-options';

export default async function NewLive() {
  const { profile, supabase, userId } = await requireRole(['trainer', 'admin'], '/espace/lives/nouveau');
  const opts = await trainerOptions(supabase, userId, profile.role === 'admin');
  return (
    <EspaceShell profile={profile} title="Programmer une séance en direct">
      <Section title="Séance">
        <LiveForm courses={opts.courses} groups={opts.groups} />
      </Section>
    </EspaceShell>
  );
}
