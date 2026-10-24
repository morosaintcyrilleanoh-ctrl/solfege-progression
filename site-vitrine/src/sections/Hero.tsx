import { accueil, site } from '../config/site';
import { BoutonAction } from '../components/BoutonAction';
import { Emplacement } from '../components/Emplacement';
import { Icone } from '../components/Icone';
import { Portee } from '../components/Portee';
import styles from './Hero.module.css';

export function Hero() {
  const photo = site.images.formateurAccueil;

  return (
    <section className={styles.hero} aria-labelledby="titre-accueil">
      <Portee className={styles.portee} />
      <div className={`conteneur ${styles.grille}`}>
        <div className={styles.texte}>
          <span className="surtitre apparition">{accueil.surtitre}</span>
          <h1 id="titre-accueil" className={`${styles.titre} apparition apparition--2`}>
            {accueil.titre}
          </h1>
          <p className={`${styles.sousTitre} apparition apparition--3`}>{accueil.sousTitre}</p>
          <div className={`${styles.actions} apparition apparition--4`}>
            <BoutonAction bouton={accueil.boutonPrincipal} icone={<Icone nom="fleche" />} />
            <BoutonAction bouton={accueil.boutonSecondaire} variante="contour" />
          </div>
          <ul className={styles.disciplines} aria-label="Disciplines enseignées">
            {accueil.disciplines.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>

        <figure className={`${styles.portrait} apparition apparition--3`}>
          <div className={styles.cadre}>
            {photo ? (
              <img src={photo} alt={`${site.titreFormateur}`} width={900} height={1100} fetchPriority="high" />
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
                <Icone nom="cle-sol" taille={140} />
              </div>
            )}
          </div>
          <figcaption className={styles.legende}>
            <span>{site.titreFormateur}</span>
            <small>Solfège · Piano · Harmonie</small>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
