import type { ReactNode } from 'react';
import { site } from '../config/site';
import { BoutonAction } from '../components/BoutonAction';
import { Icone } from '../components/Icone';
import { useRouteur } from '../lib/router';
import { relireDemande } from '../services/inscription';
import type { StatutConfirmation } from '../services/paiement';
import styles from './Confirmation.module.css';

type Contenu = { titre: string; texte: ReactNode; ton: 'succes' | 'attente' | 'erreur' | 'apercu' };

/**
 * Page affichée après une inscription ou au retour du prestataire de paiement :
 *   /confirmation?statut=<statut>&ref=<référence>
 *
 * IMPORTANT : cette page ne fait qu'AFFICHER un message. Elle ne valide rien :
 * n'importe qui peut ouvrir cette adresse. La confirmation réelle d'un paiement
 * vient de la notification serveur du prestataire (api/paiement/notification.js).
 */
const contenus: Record<StatutConfirmation, Contenu> = {
  'inscription-envoyee': {
    titre: 'Demande d’inscription envoyée',
    texte: 'Merci ! Votre demande a bien été transmise. Le formateur vous recontacte rapidement pour confirmer votre inscription.',
    ton: 'succes',
  },
  'inscription-whatsapp': {
    titre: 'Plus qu’une étape',
    texte:
      'Votre demande a été préparée dans WhatsApp. Vérifiez que le message a bien été envoyé : c’est lui qui confirme votre demande auprès du formateur.',
    ton: 'attente',
  },
  apercu: {
    titre: 'Aperçu de la confirmation',
    texte:
      'Mode aperçu : aucune adresse d’envoi ni numéro WhatsApp n’est configuré, la demande n’a été transmise à personne. Voici la page que verront vos élèves après leur inscription.',
    ton: 'apercu',
  },
  'paiement-en-attente': {
    titre: 'Paiement en cours de vérification',
    texte:
      'Merci ! Votre paiement est en cours de vérification auprès du prestataire. Vous recevrez une confirmation dès qu’il sera validé.',
    ton: 'attente',
  },
  'paiement-reussi': {
    titre: 'Merci pour votre paiement',
    texte: 'Votre paiement a été pris en compte. Votre inscription sera activée dès la confirmation définitive de la transaction.',
    ton: 'succes',
  },
  'paiement-echoue': {
    titre: 'Le paiement n’a pas abouti',
    texte: 'Aucun montant n’a été validé. Vous pouvez réessayer ou contacter le formateur pour une autre solution.',
    ton: 'erreur',
  },
  'paiement-annule': {
    titre: 'Paiement annulé',
    texte: 'Vous avez annulé le paiement. Votre demande reste possible à tout moment.',
    ton: 'erreur',
  },
};

function estStatut(valeur: string | null): valeur is StatutConfirmation {
  return valeur !== null && valeur in contenus;
}

export function Confirmation() {
  const { recherche } = useRouteur();
  const brut = recherche.get('statut');
  const statut: StatutConfirmation = estStatut(brut) ? brut : 'inscription-envoyee';
  const reference = (recherche.get('ref') ?? '').replace(/[^A-Z0-9-]/gi, '').slice(0, 40);
  const contenu = contenus[statut];
  const memoire = relireDemande();
  const demande = memoire && memoire.demande.reference === reference ? memoire.demande : null;
  const lienWhatsApp = demande && statut === 'inscription-whatsapp' ? memoire?.lien : undefined;
  const icone = contenu.ton === 'erreur' ? 'fermer' : contenu.ton === 'attente' ? 'horloge' : 'coche';

  return (
    <section className={`section ${styles.page}`} aria-labelledby="titre-confirmation">
      <div className={`conteneur ${styles.carte}`}>
        <span className={`${styles.pastille} ${styles[contenu.ton]}`}>
          <Icone nom={icone} taille={30} />
        </span>
        {contenu.ton === 'apercu' && <span className="badge-apercu">Mode aperçu</span>}
        <h1 className={styles.titre} id="titre-confirmation">
          {contenu.titre}
        </h1>
        <p className={styles.texte}>{contenu.texte}</p>

        {reference && (
          <p className={styles.reference}>
            Référence <strong>{reference}</strong>
            <small>Conservez-la : elle vous sera demandée en cas de question.</small>
          </p>
        )}

        {demande && (
          <dl className={styles.recap}>
            {demande.formation && (
              <>
                <dt>Formation</dt>
                <dd>{demande.formation}</dd>
              </>
            )}
            {demande.offre && (
              <>
                <dt>Offre</dt>
                <dd>{demande.offre}</dd>
              </>
            )}
            <dt>Nom</dt>
            <dd>{demande.nom}</dd>
            <dt>Téléphone</dt>
            <dd>{demande.telephone}</dd>
          </dl>
        )}

        <div className={styles.actions}>
          {lienWhatsApp && (
            <a className="btn" href={lienWhatsApp} target="_blank" rel="noopener noreferrer">
              <Icone nom="whatsapp" /> Ouvrir WhatsApp à nouveau
            </a>
          )}
          {(statut === 'paiement-echoue' || statut === 'paiement-annule') && (
            <BoutonAction bouton={{ libelle: 'Réessayer', action: { type: 'inscription' } }} />
          )}
          <BoutonAction bouton={{ libelle: 'Retour à l’accueil', action: { type: 'section', id: 'formations' } }} variante="contour" />
        </div>

        <p className={styles.signature}>{site.titreFormateur} · {site.nom}</p>
      </div>
    </section>
  );
}
