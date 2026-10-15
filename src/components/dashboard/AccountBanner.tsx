'use client';

import Link from 'next/link';
import { useIsSignedIn } from '@/components/layout/useAccount';

/** Sur le tableau de bord local : renvoie vers l'espace en ligne si l'élève est connecté. */
export function AccountBanner() {
  const signedIn = useIsSignedIn();
  if (signedIn) {
    return (
      <p className="mb-4 rounded-xl border border-success-500/40 bg-success-50 p-3 text-sm text-success-700">
        Tu es connecté.{' '}
        <Link href="/espace" className="font-semibold underline">
          Ouvrir mon espace en ligne
        </Link>{' '}
        (cours, devoirs, lives) — tu pourras y importer les résultats ci-dessous.
      </p>
    );
  }
  return (
    <p className="mb-4 rounded-xl border border-electric-300 bg-electric-500/5 p-3 text-sm text-slate-700">
      <strong>Sans compte :</strong> les chiffres ci-dessous proviennent de tes exercices sur cet appareil.{' '}
      <Link href="/connexion" className="font-semibold text-electric-600 underline">
        Connecte-toi
      </Link>{' '}
      pour retrouver tes cours, tes devoirs et ton formateur.
    </p>
  );
}
