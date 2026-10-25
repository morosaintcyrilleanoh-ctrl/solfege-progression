import { site } from '../config/site';
import { formaterPrix, offres, tarifs, type Offre } from '../config/offres';
import type { Bouton } from '../config/types';
import { BoutonAction, messagePour } from '../components/BoutonAction';
import { EnteteSection } from '../components/EnteteSection';
import { Icone } from '../components/Icone';
import { paiementEnLigneDisponible } from '../services/paiement';
import styles from './Tarifs.module.css';

function avecMessage(bouton: Bouton, offre: Offre): Bouton {
  if (bouton.action.type === 'whatsapp' && !bouton.action.message) {
    return { ...bouton, action: { type: 'whatsapp', message: messagePour(undefined, offre.id) } };
  }
  return bouton;
}

export function Tarifs() {
  return (
    <section id="tarifs" className="section section--grise" aria-labelledby="titre-tarifs">
      <div className="conteneur">
        <EnteteSection id="titre-tarifs" surtitre="Tarifs" titre={tarifs.titre} introduction={tarifs.introduction} />

        <ul className={styles.grille}>
          {offres.map((offre) => (
            <li key={offre.id} className={`${styles.offre} ${offre.recommandee ? styles.recommandee : ''}`}>
              {offre.recommandee && <span className={styles.etiquette}>Recommandée</span>}
              <h3 className={styles.nom}>{offre.nom}</h3>
              <p className={styles.description}>{offre.description}</p>
              <div className={styles.prix}>
                {offre.prix ? (
                  <>
                    <span className={styles.montant}>{formaterPrix(offre.prix)}</span>
                    {offre.prix.mention && <span className={styles.mention}>{offre.prix.mention}</span>}
                  </>
                ) : (
                  <>
                    <span className={styles.surDemande}>Tarif sur demande</span>
                    {site.afficherEmplacements && <span className="badge-apercu">Prix à définir · src/config/offres.ts</span>}
                  </>
                )}
              </div>
              <ul className={styles.inclus}>
                {offre.inclus.map((ligne) => (
                  <li key={ligne}>
                    <Icone nom="coche" taille={16} />
                    {ligne}
                  </li>
                ))}
              </ul>
              <BoutonAction bouton={avecMessage(offre.bouton, offre)} large variante={offre.recommandee ? 'plein' : 'contour'} />
            </li>
          ))}
        </ul>

        <div className={styles.paiement}>
          <span className={styles.paiementTitre}>Moyens de paiement</span>
          <ul>
            {tarifs.moyensPaiement.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          {!paiementEnLigneDisponible() && <p>{tarifs.mention}</p>}
        </div>
      </div>
    </section>
  );
}
