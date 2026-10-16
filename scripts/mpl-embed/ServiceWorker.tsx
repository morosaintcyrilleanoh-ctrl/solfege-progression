'use client';

import { useEffect } from 'react';

/** Service worker limité au dossier /solfege : le solfège reste utilisable hors connexion. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/solfege/sw.js', { scope: '/solfege/' }).catch(() => undefined);
  }, []);
  return null;
}
