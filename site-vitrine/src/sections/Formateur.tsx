import { useState } from 'react';
import { formateur, site } from '../config/site';
import { BoutonAction } from '../components/BoutonAction';
import { Emplacement } from '../components/Emplacement';
import { Icone } from '../components/Icone';
import styles from './Formateur.module.css';

export function Formateur() {
  const photo = site.images.formateurPresentation;
  const [onglet, setOnglet] = useState(0);
  const actif = formateur.onglets[onglet];

  return (
    <section id="formateur" className="section" aria-labelledby="titre-formateur">
      <div className={`conteneur ${styles.grille}`}>
        <div className={styles.visuel}>
          {photo ? (
            <img className={styles.photo} src={photo} alt={site.titreFormateur} loading="lazy" width={800} height={1000} />
          ) : (
            <Emplacement
              className={styles.photo}
              titre="Photo de présentation"
              indication="Le formateur en situation (cours, piano…)"
              fichier="site.images.formateurPresentation"
            />
          )}
          {!photo && !site.afficherEmplacements && (
            <div className={`${styles.photo} ${styles.sansPhoto}`} aria-hidden="true">
              <Icone nom="cle-sol" taille={120} />
            </div>
          )}
        </div>

        <div className={styles.contenu}>
          <span className="surtitre">{formateur.titre}</span>
          <h2 className="titre-section" id="titre-formateur">
            {formateur.nom}
          </h2>
          <p className={styles.role}>{formateur.role}</p>
          {formateur.presentation.map((paragraphe, i) => (
            <p key={i} className={styles.paragraphe}>
              {paragraphe}
            </p>
          ))}

          {formateur.parcours.length > 0 ? (
            <ul className={styles.parcours}>
              {formateur.parcours.map((ligne) => (
                <li key={ligne}>
                  <Icone nom="coche" taille={18} />
                  {ligne}
                </li>
              ))}
            </ul>
          ) : (
            site.afficherEmplacements && (
              <p className={styles.aCompleter}>
                <span className="badge-apercu">À compléter</span> Parcours, diplômes et expériences : liste{' '}
                <code>formateur.parcours</code> dans <code>src/config/site.ts</code>.
              </p>
            )
          )}

          <ul className={styles.specialites} aria-label="Spécialités">
            {formateur.specialites.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <div>
            <BoutonAction bouton={formateur.bouton} />
          </div>
        </div>
      </div>

      {actif && (
        <div className={`conteneur ${styles.onglets}`}>
          <div className={styles.listeOnglets} role="tablist" aria-label="Mission et méthode">
            {formateur.onglets.map((o, i) => (
              <button
                key={o.libelle}
                type="button"
                role="tab"
                id={`onglet-${i}`}
                aria-selected={i === onglet}
                aria-controls="panneau-onglet"
                className={styles.onglet}
                onClick={() => setOnglet(i)}
              >
                {o.libelle}
              </button>
            ))}
          </div>
          <p className={styles.declaration} role="tabpanel" id="panneau-onglet" aria-labelledby={`onglet-${onglet}`} key={onglet}>
            {actif.fort} <span>{actif.suite}</span>
          </p>
        </div>
      )}
    </section>
  );
}
