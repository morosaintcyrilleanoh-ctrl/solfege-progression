import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/AuthShell';
import { ResetRequestForm } from '@/components/auth/AuthForms';

export const metadata: Metadata = { title: 'Mot de passe oublié' };

export default function ResetPage() {
  return (
    <AuthShell title="Mot de passe oublié" subtitle="Indique ton adresse : tu recevras un lien pour choisir un nouveau mot de passe.">
      <ResetRequestForm />
    </AuthShell>
  );
}
