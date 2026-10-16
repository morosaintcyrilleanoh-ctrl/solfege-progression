import type { Metadata } from 'next';
import { InviteCodeForm, SettingsForm } from '@/components/espace/AdminForms';
import { EspaceShell, Section } from '@/components/espace/EspaceShell';
import { requireRole } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Paramètres' };

export default async function SettingsPage() {
  const { profile, supabase } = await requireRole(['admin'], '/espace/admin/parametres');
  const [{ data }, { data: inviteCode, error: inviteError }] = await Promise.all([
    supabase.from('platform_settings').select('key, value'),
    supabase.rpc('get_invite_code'),
  ]);
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
      <Section title="Code d’invitation">
        <p className="mb-4 text-sm text-slate-600">
          Quand un code est défini, il faut le saisir pour créer un compte : seuls vos élèves peuvent s’inscrire. Les comptes existants ne sont
          pas concernés. La vérification est faite par la base de données.
        </p>
        {inviteError ? (
          <p className="text-sm text-danger-700">
            Cette fonction n’est pas encore installée dans la base : exécutez la migration « invitation » dans Supabase (voir docs/SUPABASE.md).
          </p>
        ) : (
          <InviteCodeForm code={inviteCode ?? null} />
        )}
      </Section>
    </EspaceShell>
  );
}
