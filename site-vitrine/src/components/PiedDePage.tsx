import { site } from '../config/site';
import { formations } from '../config/formations';
import { href, useRouteur } from '../lib/router';
import { lienWhatsApp } from '../lib/whatsapp';
import { Icone } from './Icone';
import styles from './PiedDePage.module.css';

const nomsReseaux: Record<keyof typeof site.reseaux, string> = {
  facebook: 'Facebook',
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
};

export function PiedDePage() {
  const { naviguer } = useRouteur();
  const { contact } = site;
  const whatsapp = lienWhatsApp();
  const reseaux = (Object.keys(site.reseaux) as (keyof typeof site.reseaux)[]).filter((cle) => site.reseaux[cle]);
  const aucuneCoordonnee = !whatsapp && !contact.telephone && !contact.email && !contact.localisation;

  return (
    <footer className={styles.pied}>
      <div className={`conteneur ${styles.grille}`}>
        <div className={styles.marque}>
          <span className={styles.nom}>{site.nom}</span>
          <p>Formations en solfège, lecture de partition, piano, harmonie et oreille musicale avec le {site.titreFormateur}.</p>
          {reseaux.length > 0 && (
            <ul className={styles.reseaux}>
              {reseaux.map((cle) => (
                <li key={cle}>
                  <a href={site.reseaux[cle]} target="_blank" rel="noopener noreferrer">
                    {nomsReseaux[cle]}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className={styles.titre}>Formations</h2>
          <ul className={styles.liste}>
            {formations.map((f) => (
              <li key={f.id}>
                <a
                  href={href(`/inscription?formation=${f.id}`)}
                  onClick={(e) => {
                    e.preventDefault();
                    naviguer(`/inscription?formation=${f.id}`);
                  }}
                >
                  {f.titre}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={styles.titre}>Contact</h2>
          <ul className={styles.liste}>
            {whatsapp && (
              <li>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                  <Icone nom="whatsapp" taille={18} /> WhatsApp
                </a>
              </li>
            )}
            {contact.telephone && (
              <li>
                <a href={`tel:${contact.telephone.replace(/[^\d+]/g, '')}`}>
                  <Icone nom="telephone" taille={18} /> {contact.telephone}
                </a>
              </li>
            )}
            {contact.email && (
              <li>
                <a href={`mailto:${contact.email}`}>
                  <Icone nom="email" taille={18} /> {contact.email}
                </a>
              </li>
            )}
            {contact.localisation && (
              <li>
                <span>
                  <Icone nom="lieu" taille={18} /> {contact.localisation}
                </span>
              </li>
            )}
            {contact.horaires && (
              <li>
                <span>
                  <Icone nom="horloge" taille={18} /> {contact.horaires}
                </span>
              </li>
            )}
            {aucuneCoordonnee && site.afficherEmplacements && (
              <li className={styles.aCompleter}>
                <span className="badge-apercu">À compléter</span> Coordonnées à renseigner dans <code>src/config/site.ts</code>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className={`conteneur ${styles.bas}`}>
        <span>
          © {new Date().getFullYear()} {site.nom} · {site.titreFormateur}
        </span>
        {site.afficherEmplacements && <span className="badge-apercu">Mode aperçu</span>}
      </div>
    </footer>
  );
}
