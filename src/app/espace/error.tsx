'use client';

import { buttonClasses } from '@/components/ui/primitives';

/** Erreur dans l'espace connecté : message réel, jamais de faux succès. */
export default function EspaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center" role="alert">
      <h1 className="text-xl font-bold text-night-800">L’action n’a pas abouti</h1>
      <p className="mt-2 text-slate-600">
        {error.message && !error.digest ? error.message : 'Une erreur est survenue : rien n’a été enregistré. Vérifie ta connexion et réessaie.'}
      </p>
      <button type="button" onClick={reset} className={`${buttonClasses('primary')} mt-6`}>
        Réessayer
      </button>
    </div>
  );
}
