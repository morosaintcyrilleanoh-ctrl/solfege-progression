import Link from 'next/link';
import { buttonClasses } from '@/components/ui/primitives';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-5xl font-extrabold text-accent-600">404</p>
      <h1 className="mt-2 text-xl font-bold text-night-800">Cette page n’existe pas</h1>
      <p className="mt-1 text-slate-600">Le lien est peut-être incorrect ou la page a été déplacée.</p>
      <Link href="/" className={`${buttonClasses('primary')} mt-6`}>
        Retour à l’accueil
      </Link>
    </div>
  );
}
