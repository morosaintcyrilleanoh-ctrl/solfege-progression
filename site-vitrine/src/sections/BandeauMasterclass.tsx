import { etatMasterclass, masterclass } from '../config/masterclass';
import { BoutonAction } from '../components/BoutonAction';
import { CompteARebours } from '../components/CompteARebours';
import styles from './BandeauMasterclass.module.css';

/** Encart de la masterclass gratuite sur l'accueil (masqué une fois l'événement terminé). */
export function BandeauMasterclass() {
  const etat = etatMasterclass();
  if (!masterclass.actif || etat === 'termine') return null;

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
