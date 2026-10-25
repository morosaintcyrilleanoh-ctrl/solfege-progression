import { site } from '../config/site';
import { Icone } from './Icone';
import styles from './Logo.module.css';

/** Logo : emblème (site.images.logo) + nom. Sans emblème, une clé de sol jaune sur noir. */
export function Logo({ sousTitre = true }: { sousTitre?: boolean }) {
  return (
    <span className={styles.logo} aria-label={site.nom}>
      {site.images.logo ? (
        <span className={styles.tuile}>
          <img className={styles.image} src={site.images.logo} alt="" width={240} height={169} />
        </span>
      ) : (
        <span className={styles.embleme} aria-hidden="true">
          <Icone nom="cle-sol" taille={22} />
        </span>
      )}
      <span className={styles.nom}>
        {/* Même découpage que le logo : « apprendre la » + « musique » en jaune */}
        <span className={styles.marque}>
          apprendre la <span>musique</span>
        </span>
        {sousTitre && <small>{site.titreFormateur}</small>}
      </span>
    </span>
  );
}
