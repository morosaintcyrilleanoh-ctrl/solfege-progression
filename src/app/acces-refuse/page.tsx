import Link from 'next/link';
import { buttonClasses } from '@/components/ui/primitives';

export default function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-xl font-bold text-night-800">Accès refusé</h1>
      <p className="mt-2 text-slate-600">Cette page est réservée à un autre rôle. Si tu penses que c’est une erreur, contacte l’administrateur.</p>
      <Link href="/espace" className={`${buttonClasses('primary')} mt-6`}>
        Retour à mon espace
      </Link>
    </div>
  );
}
