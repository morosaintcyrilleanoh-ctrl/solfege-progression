'use client';

import { useEffect } from 'react';

/** Enregistre le service worker (production uniquement) pour l'usage hors connexion des laboratoires. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  }, []);
  return null;
}
