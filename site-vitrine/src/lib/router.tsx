import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Routeur minimal (aucune dépendance) pour les quelques pages du site :
 *   /               accueil
 *   /inscription    formulaire d'inscription
 *   /confirmation   page de confirmation (inscription ou retour de paiement)
 *
 * Deux modes :
 *  - « chemin » (par défaut, production Vercel) : vraies adresses /inscription…
 *    vercel.json renvoie toutes ces adresses vers index.html.
 *  - « memoire » (aperçu intégré) : la navigation se fait sans changer l'adresse.
 *    Activé par la variable de compilation VITE_ROUTEUR=memoire.
 */
type Emplacement = { chemin: string; recherche: URLSearchParams };

type Routeur = Emplacement & {
  naviguer: (cible: string) => void;
};

const ModeMemoire = import.meta.env.VITE_ROUTEUR === 'memoire';
const ContexteRouteur = createContext<Routeur | null>(null);

/** Partie de l'adresse correspondant au dossier du site (base relative de Vite). */
function racine() {
  const base = import.meta.env.BASE_URL;
  return base === './' || base === '/' ? '' : base.replace(/\/$/, '');
}

function lire(cible: string): Emplacement {
  const url = new URL(cible, 'https://site.local');
  return { chemin: normaliser(url.pathname), recherche: url.searchParams };
}

function normaliser(chemin: string) {
  const sansRacine = racine() && chemin.startsWith(racine()) ? chemin.slice(racine().length) : chemin;
  const propre = sansRacine.replace(/\/index\.html$/, '/').replace(/\/+$/, '');
  return propre === '' ? '/' : propre;
}

function emplacementInitial(): Emplacement {
  if (ModeMemoire) return lire('/');
  return lire(window.location.pathname + window.location.search);
}

export function FournisseurRouteur({ children }: { children: ReactNode }) {
  const [emplacement, setEmplacement] = useState<Emplacement>(emplacementInitial);

  useEffect(() => {
    if (ModeMemoire) return;
    const surRetour = () => setEmplacement(lire(window.location.pathname + window.location.search));
    window.addEventListener('popstate', surRetour);
    return () => window.removeEventListener('popstate', surRetour);
  }, []);

  const naviguer = useCallback((cible: string) => {
    const [avantAncre, ancre] = cible.split('#');
    const suivant = lire(avantAncre || '/');
    if (!ModeMemoire) {
      const query = suivant.recherche.toString();
      window.history.pushState({}, '', racine() + suivant.chemin + (query ? `?${query}` : ''));
    }
    setEmplacement(suivant);
    // Défilement : vers l'ancre demandée, sinon en haut de la nouvelle page.
    requestAnimationFrame(() => {
      const element = ancre ? document.getElementById(ancre) : null;
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: 0 });
    });
  }, []);

  const valeur = useMemo(() => ({ ...emplacement, naviguer }), [emplacement, naviguer]);
  return <ContexteRouteur.Provider value={valeur}>{children}</ContexteRouteur.Provider>;
}

export function useRouteur() {
  const routeur = useContext(ContexteRouteur);
  if (!routeur) throw new Error('useRouteur doit être utilisé dans <FournisseurRouteur>.');
  return routeur;
}

/** Adresse à placer dans un href (pour l'ouverture dans un nouvel onglet, le référencement…). */
export function href(cible: string) {
  if (ModeMemoire) return '#';
  return racine() + cible;
}
