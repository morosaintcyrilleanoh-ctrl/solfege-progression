import { etatMasterclass, masterclass, offreParticipantsActive } from '../config/masterclass';
import { BoutonAction } from '../components/BoutonAction';
import { CompteARebours } from '../components/CompteARebours';
import styles from './BandeauMasterclass.module.css';

/**
 * Encart de la masterclass gratuite sur l'accueil.
 * Avant / pendant : réservation. Après : rediffusion + cadeau offert aux participants
 * jusqu'à la fin de l'offre, puis l'encart disparaît.
 */
export function BandeauMasterclass() {
  const etat = etatMasterclass();
  if (!masterclass.actif) return null;

  if (etat === 'termine') {
    if (!offreParticipantsActive()) return null;
    const offre = masterclass.offreParticipants;
    return (
      <section className={styles.section} aria-labelledby="titre-bandeau-masterclass">
        <div className="conteneur">
          <div className={styles.carte}>
            <img className={styles.affiche} src={offre.image} alt="" width={900} height={899} loading="lazy" />
            <div className={styles.texte}>
              <span className={styles.badge}>Rediffusion + cadeau</span>
              <h2 id="titre-bandeau-masterclass">Revoyez la masterclass « {masterclass.titre} »</h2>
              <p>
                Et recevez l’ebook « {offre.cadeau} » en vous inscrivant au programme 60 jours avant le {offre.finTexte}.
              </p>
              <CompteARebours jusqua={offre.finLe} compact />
              <BoutonAction bouton={{ libelle: 'Voir la rediffusion et l’offre', action: { type: 'page', chemin: '/masterclass' } }} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section} aria-labelledby="titre-bandeau-masterclass">
      <div className="conteneur">
        <div className={styles.carte}>
          <img className={styles.affiche} src={masterclass.affiche} alt="" width={800} height={800} loading="lazy" />
          <div className={styles.texte}>
            <span className={styles.badge}>{etat === 'en-direct' ? '● En direct maintenant' : 'Masterclass 100 % gratuite'}</span>
            <h2 id="titre-bandeau-masterclass">{masterclass.titre}</h2>
            <p>
              {masterclass.dateTexte} · 20 h 30 – 22 h · {masterclass.plateforme}
            </p>
            {etat === 'a-venir' && <CompteARebours jusqua={masterclass.debut} compact />}
            <BoutonAction
              bouton={{
                libelle: etat === 'en-direct' ? 'Rejoindre le direct' : 'Réserver ma place gratuite',
                action: { type: 'page', chemin: '/masterclass' },
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
