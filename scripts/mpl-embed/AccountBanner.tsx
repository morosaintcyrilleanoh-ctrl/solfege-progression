'use client';

import { useSyncExternalStore } from 'react';
import { mplUserId } from './mpl-owner';

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

/** Version intégrée : indique si les séances partent dans le compte Music Progression Lab. */
export function AccountBanner() {
  const signedIn = useSyncExternalStore(subscribe, () => mplUserId() !== null, () => null);
  if (signedIn === null) return null;
  return signedIn ? (
    <p className="mb-4 rounded-xl border border-electric-300 bg-electric-500/5 p-3 text-sm text-slate-700" data-mpl-account="connecte">
      Tu es connecté à ton compte Music Progression Lab : tes séances de solfège y sont enregistrées et{' '}
      <strong>ton formateur voit tes résultats</strong>. Elles restent aussi disponibles sur cet appareil, même sans Internet.
    </p>
  ) : (
    <p className="mb-4 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700" data-mpl-account="invite">
      Tes résultats restent <strong>sur cet appareil</strong>.{' '}
      {/* Page du Lab, hors du volet Solfège : lien ordinaire. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/#/connexion" className="font-semibold text-electric-600 hover:underline">
        Connecte-toi au Lab
      </a>{' '}
      pour les enregistrer dans ton compte et les partager avec ton formateur.
    </p>
  );
}
