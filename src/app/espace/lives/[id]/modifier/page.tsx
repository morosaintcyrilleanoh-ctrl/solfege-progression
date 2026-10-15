import { notFound } from 'next/navigation';
import { LiveForm } from '@/components/academy/LiveForms';
import { EspaceShell, Section } from '@/components/espace/EspaceShell';
import { requireRole } from '@/lib/auth/session';
import { trainerOptions } from '@/lib/data/trainer-options';

export default async function EditLive({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, supabase, userId } = await requireRole(['trainer', 'admin'], `/espace/lives/${id}/modifier`);
  const { data: live } = await supabase.from('live_sessions').select('*').eq('id', id).maybeSingle();
  if (!live || (live.trainer_id !== userId && profile.role !== 'admin')) notFound();
  const opts = await trainerOptions(supabase, userId, profile.role === 'admin');
  return (
    <EspaceShell profile={profile} title="Modifier la séance">
      <Section title={live.title}>
        <LiveForm live={live} courses={opts.courses} groups={opts.groups} />
      </Section>
    </EspaceShell>
  );
}
