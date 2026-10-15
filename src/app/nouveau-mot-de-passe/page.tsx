import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/AuthShell';
import { NewPasswordForm } from '@/components/auth/AuthForms';
import { requireUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Nouveau mot de passe' };

export default async function NewPasswordPage() {
  await requireUser('/nouveau-mot-de-passe');
  return (
    <AuthShell title="Nouveau mot de passe">
      <NewPasswordForm />
    </AuthShell>
  );
}
