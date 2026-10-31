import { accueil, site } from '../config/site';
import { temoignages } from '../config/temoignages';
import { BoutonAction } from '../components/BoutonAction';
import { Emplacement } from '../components/Emplacement';
import { Icone } from '../components/Icone';
import { Portee } from '../components/Portee';
import { href, useRouteur } from '../lib/router';
import styles from './Hero.module.css';

export function Hero() {
  const { naviguer } = useRouteur();
  const photo = site.images.formateurAccueil;

  return (
    <section className={`sombre ${styles.hero}`} aria-labelledby="titre-accueil">
      <div className={styles.halo} aria-hidden="true" />
      <Portee className={styles.portee} />
      <div className={`conteneur ${styles.grille}`}>
        <div className={styles.texte}>
          {accueil.annonce.texte && (
            <a
              className={`${styles.annonce} apparition`}
              href={href(accueil.annonce.chemin)}
              onClick={(e) => {
                e.preventDefault();
                naviguer(accueil.annonce.chemin);
              }}
            >
              <span className={styles.annonceBadge}>Inscriptions ouvertes</span>
              {accueil.annonce.texte}
              <Icone nom="fleche" taille={16} />
            </a>
          )}
          <span className="surtitre apparition">{accueil.surtitre}</span>
          <h1 id="titre-accueil" className={`${styles.titre} apparition apparition--2`}>
            {accueil.titre}
          </h1>
          <p className={`${styles.sousTitre} apparition apparition--3`}>{accueil.sousTitre}</p>
          <div className={`${styles.actions} apparition apparition--4`}>
            <BoutonAction bouton={accueil.boutonPrincipal} icone={<Icone nom="fleche" />} />
            <BoutonAction bouton={accueil.boutonSecondaire} variante="contour" />
          </div>
          {accueil.preuve && temoignages.length > 0 && (
            <a className={`${styles.preuve} apparition apparition--4`} href="#temoignages">
              <span className={styles.avatars} aria-hidden="true">
                {temoignages.slice(0, 4).map((t) => (
                  <span key={t.nom}>{t.nom.charAt(0)}</span>
                ))}
              </span>
              <span>
                <strong>{accueil.preuve}</strong>
                <small>{accueil.lienPreuve} →</small>
              </span>
            </a>
          )}
        </div>

        <figure className={`${styles.portrait} apparition apparition--3`}>
          <div className={styles.cadre}>
            {photo ? (
              <img src={photo} alt={site.titreFormateur} width={900} height={1100} fetchPriority="high" />
            ) : (
              <Emplacement
                className={styles.emplacement}
                titre="Photo du formateur"
                indication="Portrait, environ 900 × 1100 px"
                fichier="site.images.formateurAccueil"
              />
            )}
            {!photo && !site.afficherEmplacements && (
              <div className={styles.monogramme} aria-hidden="true">
                <Icone nom="cle-sol" taille={150} />
              </div>
            )}
          </div>
          <figcaption className={styles.etiquette}>
            <span className={styles.etiquetteIcone} aria-hidden="true">
              <Icone nom="cle-sol" taille={18} />
            </span>
            <span>
              <strong>{site.titreFormateur}</strong>
              <small>{accueil.etiquettePhoto}</small>
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
