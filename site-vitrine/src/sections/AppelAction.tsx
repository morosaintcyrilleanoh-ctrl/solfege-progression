import { appelAction, site } from '../config/site';
import { BoutonAction } from '../components/BoutonAction';
import { Icone } from '../components/Icone';
import { Portee } from '../components/Portee';
import { BoutonPartage } from '../components/BoutonPartage';
import { whatsappDisponible } from '../lib/whatsapp';
import styles from './AppelAction.module.css';

/** Bloc d'inscription et de contact (ancre #contact). */
export function AppelAction() {
  const { contact } = site;

  return (
    <section id="contact" className="section" aria-labelledby="titre-contact">
      <div className="conteneur">
      <div className={`sombre ${styles.carte}`}>
      <Portee className={styles.portee} />
      <div className={styles.contenu}>
        <span className="surtitre">Inscription & contact</span>
        <h2 className="titre-section" id="titre-contact">
          {appelAction.titre}
        </h2>
        <p className="intro-section">{appelAction.texte}</p>
        <div className={styles.actions}>
          <BoutonAction bouton={appelAction.boutonInscription} icone={<Icone nom="fleche" />} />
          {whatsappDisponible() && <BoutonAction bouton={appelAction.boutonContact} variante="contour" />}
          {!whatsappDisponible() && site.afficherEmplacements && (
            <span className="btn btn--contour" aria-disabled="true">
              <Icone nom="whatsapp" /> WhatsApp · numéro à configurer
            </span>
          )}
        </div>

        <BoutonPartage variante="texte" libelle="Partager à un ami qui veut apprendre la musique" />

        <ul className={styles.coordonnees}>
          {contact.telephone && (
            <li>
              <Icone nom="telephone" taille={18} />
              <a href={`tel:${contact.telephone.replace(/[^\d+]/g, '')}`}>{contact.telephone}</a>
            </li>
          )}
          {contact.email && (
            <li>
              <Icone nom="email" taille={18} />
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </li>
          )}
          {contact.localisation && (
            <li>
              <Icone nom="lieu" taille={18} />
              <span>{contact.localisation}</span>
            </li>
          )}
        </ul>

        {!whatsappDisponible() && site.afficherEmplacements && (
          <p className={styles.note}>
            <span className="badge-apercu">À configurer</span> Renseignez votre numéro WhatsApp (<code>contact.whatsapp</code> dans{' '}
            <code>src/config/site.ts</code>) pour activer tous les boutons « WhatsApp » du site.
          </p>
        )}
      </div>
      </div>
      </div>
    </section>
  );
}
