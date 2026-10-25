import { useEffect } from 'react';
import { BarreAction } from './components/BarreAction';
import { Entete } from './components/Entete';
import { PiedDePage } from './components/PiedDePage';
import { site } from './config/site';
import { FournisseurRouteur, useRouteur } from './lib/router';
import { Accueil } from './pages/Accueil';
import { Confirmation } from './pages/Confirmation';
import { Formation } from './pages/Formation';
import { trouverFormation } from './config/formations';
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
  // Pages des formations : /formations/<id>
  const formation = chemin.startsWith('/formations/') ? trouverFormation(chemin.slice('/formations/'.length)) : undefined;
  const Composant = page?.composant ?? Introuvable;

  useEffect(() => {
    document.title = formation
      ? `Formation ${formation.titre} · ${site.nom}`
      : page?.titre
        ? `${page.titre} · ${site.nom}`
        : page
          ? site.seo.titre
          : `Page introuvable · ${site.nom}`;
  }, [page, formation]);

  if (formation) return <Formation key={formation.id} formation={formation} />;
  return <Composant />;
}

/** Le parcours d'inscription s'affiche en plein écran, sans en-tête ni pied de page. */
function Gabarit() {
  const { chemin } = useRouteur();
  const pleinEcran = chemin === '/inscription';
  return (
    <>
      <a className="visuellement-cache" href="#contenu">
        Aller au contenu
      </a>
      {!pleinEcran && <Entete />}
      <main id="contenu">
        <Page />
      </main>
      {!pleinEcran && <PiedDePage />}
      <BarreAction />
    </>
  );
}

export function App() {
  return (
    <FournisseurRouteur>
      <Gabarit />
    </FournisseurRouteur>
  );
}
