'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

/** Connecté ou non, lu localement (sans requête réseau) pour l'affichage du menu. */
export function useIsSignedIn(): boolean | null {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- pas de Supabase : visiteur non connecté
      setSignedIn(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session)).catch(() => setSignedIn(false));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => data.subscription.unsubscribe();
  }, []);
  return signedIn;
}
