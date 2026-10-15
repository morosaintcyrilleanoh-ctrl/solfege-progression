import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { LoginForm } from '@/components/auth/AuthForms';
import { safeNextPath } from '@/lib/auth/redirects';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Connexion' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ suivant?: string; erreur?: string }> }) {
  const { suivant, erreur } = await searchParams;
  const next = safeNextPath(suivant);
  const session = await getSession();
  if (session.status === 'authenticated') redirect(next);
  return (
    <AuthShell
      title="Connexion"
      subtitle="Retrouve tes cours, tes devoirs et ta progression."
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link href="/inscription" className="font-semibold text-electric-600 hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      {erreur === 'lien' && (
        <p role="alert" className="mb-4 rounded-xl bg-danger-50 p-3 text-sm text-danger-700">
          Ce lien n’est plus valide (il a peut-être déjà servi ou expiré). Connecte-toi ou demande un nouveau lien.
        </p>
      )}
      <LoginForm next={next} />
    </AuthShell>
  );
}
