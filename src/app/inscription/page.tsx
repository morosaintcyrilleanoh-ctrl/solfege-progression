import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';
import { SignUpForm } from '@/components/auth/AuthForms';

export const metadata: Metadata = { title: 'Créer un compte' };

export default function SignUpPage() {
  return (
    <AuthShell
      title="Créer un compte élève"
      subtitle="Gratuit. Ton formateur pourra ensuite t’inscrire à ses cours et à son groupe."
      footer={
        <>
          Déjà inscrit ?{' '}
          <Link href="/connexion" className="font-semibold text-electric-600 hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
