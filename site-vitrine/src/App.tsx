import { useEffect } from 'react';
import { Entete } from './components/Entete';
import { PiedDePage } from './components/PiedDePage';
import { site } from './config/site';
import { FournisseurRouteur, useRouteur } from './lib/router';
import { Accueil } from './pages/Accueil';
import { Confirmation } from './pages/Confirmation';
import { Inscription } from './pages/Inscription';
import { Introuvable } from './pages/Introuvable';

/** Table des pages : ajoutez ici une nouvelle page (ex. '/mentions-legales'). */
const pages: Record<string, { composant: () => React.JSX.Element; titre?: string }> = {
  '/': { composant: Accueil },
  '/inscription': { composant: Inscription, titre: 'Inscription' },
  '/confirmation': { composant: Confirmation, titre: 'Confirmation' },
};

function Page() {
  const { chemin } = useRouteur();
  const page = pages[chemin];
  const Composant = page?.composant ?? Introuvable;

  useEffect(() => {
    document.title = page?.titre ? `${page.titre} · ${site.nom}` : page ? site.seo.titre : `Page introuvable · ${site.nom}`;
  }, [page]);

  return <Composant />;
}

export function App() {
  return (
    <FournisseurRouteur>
      <a className="visuellement-cache" href="#contenu">
        Aller au contenu
      </a>
      <Entete />
      <main id="contenu">
        <Page />
      </main>
      <PiedDePage />
    </FournisseurRouteur>
  );
}
