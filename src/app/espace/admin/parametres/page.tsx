import type { Metadata } from 'next';
import { SettingsForm } from '@/components/espace/AdminForms';
import { EspaceShell, Section } from '@/components/espace/EspaceShell';
import { requireRole } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Paramètres' };

export default async function SettingsPage() {
  const { profile, supabase } = await requireRole(['admin'], '/espace/admin/parametres');
  const { data } = await supabase.from('platform_settings').select('key, value');
  const get = (k: string) => data?.find((r) => r.key === k)?.value;
  return (
    <EspaceShell profile={profile} title="Paramètres de la plateforme">
      <Section title="Général">
        <SettingsForm
          siteName={typeof get('site.name') === 'string' ? (get('site.name') as string) : 'Solfège Progression'}
          signupOpen={get('signup.open') !== false}
          weeklyGoal={typeof get('student.default_weekly_goal') === 'number' ? (get('student.default_weekly_goal') as number) : 100}
        />
      </Section>
    </EspaceShell>
  );
}
