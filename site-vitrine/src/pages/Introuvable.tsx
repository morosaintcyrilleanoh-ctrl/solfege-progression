import { BoutonAction } from '../components/BoutonAction';

export function Introuvable() {
  return (
    <section className="section" style={{ paddingTop: 'calc(var(--hauteur-entete) + 64px)' }} aria-labelledby="titre-introuvable">
      <div className="conteneur" style={{ display: 'grid', gap: 18, justifyItems: 'start' }}>
        <span className="surtitre">Erreur 404</span>
        <h1 className="titre-section" id="titre-introuvable">
          Cette page n’existe pas
        </h1>
        <p className="intro-section">Le lien est peut-être incomplet. Revenez à l’accueil pour découvrir les formations.</p>
        <BoutonAction bouton={{ libelle: 'Découvrir les formations', action: { type: 'section', id: 'formations' } }} />
      </div>
    </section>
  );
}
