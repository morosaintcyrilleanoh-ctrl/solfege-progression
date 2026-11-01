import { site } from '../config/site';
import { formations } from '../config/formations';
import { href, useRouteur } from '../lib/router';
import { lienWhatsApp } from '../lib/whatsapp';
import { Icone } from './Icone';
import { Logo } from './Logo';
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
    <footer className={`sombre ${styles.pied}`}>
      <div className={`conteneur ${styles.grille}`}>
        <div className={styles.marque}>
          <Logo sousTitre={false} />
          <p className={styles.slogan}>{site.slogan}</p>
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

        {(site.plateforme.url || site.ecole.url) && (
          <div>
            <h2 className={styles.titre}>Nos plateformes</h2>
            <ul className={styles.liste}>
              {site.ecole.url && (
                <li>
                  <a href={site.ecole.url} target="_blank" rel="noopener noreferrer">
                    <span className={styles.plateforme}>
                      <strong>{site.ecole.libelle}</strong>
                      <small>Votre espace élève</small>
                    </span>
                  </a>
                </li>
              )}
              {site.plateforme.url && (
                <li>
                  <a href={site.plateforme.url} target="_blank" rel="noopener noreferrer">
                    <span className={styles.plateforme}>
                      <strong>{site.plateforme.libelle}</strong>
                      <small>Exercices et laboratoires en ligne</small>
                    </span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        )}

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
