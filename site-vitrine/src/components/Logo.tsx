import { site } from '../config/site';
import { Icone } from './Icone';
import styles from './Logo.module.css';

/** Logo : image de site.images.logo si renseignée, sinon clé de sol jaune sur noir. */
export function Logo({ sousTitre = true }: { sousTitre?: boolean }) {
  return (
    <span className={styles.logo}>
      {site.images.logo ? (
        <img className={styles.image} src={site.images.logo} alt="" width={40} height={40} />
      ) : (
        <span className={styles.embleme} aria-hidden="true">
          <Icone nom="cle-sol" taille={22} />
        </span>
      )}
      <span className={styles.nom}>
        {site.nom}
        {sousTitre && <small>{site.titreFormateur}</small>}
      </span>
    </span>
  );
}
