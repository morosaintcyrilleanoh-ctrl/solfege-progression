/**
 * Types du paiement en ligne. Aucun paiement réel n'est effectué par ce site
 * tant qu'un prestataire n'est pas branché côté serveur (voir api/paiement/).
 */
export type MoyenPaiement = 'mobile-money' | 'carte';

export type Commande = {
  reference: string;
  formationId?: string;
  offreId?: string;
  /** Montant à encaisser : il DOIT être recalculé côté serveur, jamais pris tel quel. */
  montant?: number;
  devise?: string;
  moyen: MoyenPaiement;
  client: { nom: string; telephone: string; email?: string; pays?: string };
};

export type ResultatPaiement =
  /** Le prestataire fournit une page de paiement : on y redirige l'élève. */
  | { statut: 'redirection'; url: string }
  /** Paiement non disponible (non configuré, erreur…) : on garde l'inscription classique. */
  | { statut: 'indisponible'; raison: string };

/** Statuts acceptés par la page /confirmation. */
export type StatutConfirmation =
  | 'inscription-envoyee'
  | 'inscription-whatsapp'
  | 'apercu'
  | 'paiement-en-attente'
  | 'paiement-reussi'
  | 'paiement-echoue'
  | 'paiement-annule';
