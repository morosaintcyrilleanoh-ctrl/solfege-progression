import type { Bouton, Prix } from './types';

/**
 * ============================================================
 *  TARIFS ET OFFRES (officiels)
 *  prix : null → « Tarif sur demande ».
 *  formations : formations concernées (id de formations.ts) ; l'offre est
 *  alors proposée sur leur page et dans leur parcours d'inscription.
 *  Horaires : heure d'Abidjan (GMT).
 * ============================================================
 */
export type Offre = {
  id: string;
  nom: string;
  description: string;
  prix: Prix | null;
  /** « En ligne » ou « Présentiel ». */
  modalite: 'En ligne' | 'Présentiel';
  /** Durée du programme. */
  duree: string;
  /** Jours et heures des séances. */
  horaires: string;
  /** Lieu (présentiel). */
  lieu?: string;
  formations: string[];
  inclus: string[];
  /** Met l'offre en avant (carte noire). */
  recommandee?: boolean;
  /** Paiement en plusieurs fois, si vous l'acceptez. Vide = rien n'est affiché. */
  plusieursFois?: string;
  bouton: Bouton;
};

export const tarifs = {
  titre: 'Tarifs et formules',
  introduction:
    'Des formules claires, en ligne ou en présentiel à Abidjan. Les horaires sont donnés à l’heure d’Abidjan (GMT).',
  /** Moyens de paiement affichés (purement informatif). */
  moyensPaiement: ['Orange Money', 'MTN MoMo', 'Moov Money', 'Wave', 'Carte bancaire'],
  /** Mention affichée sous les offres. */
  mention: 'Le paiement en ligne sera activé prochainement. En attendant, l’inscription est confirmée directement avec le formateur.',
};

export const offres: Offre[] = [
  {
    id: 'partition-60-jours',
    nom: 'Lire une partition musicale en 60 jours',
    description: 'Le programme de solfège pour apprendre à lire une partition, pas à pas, en direct avec le formateur.',
    prix: { montant: 50000, devise: 'FCFA', mention: 'pour les 2 mois' },
    modalite: 'En ligne',
    duree: '60 jours (2 mois)',
    horaires: 'Lundi et jeudi, 20 h 30 – 22 h',
    formations: ['solfege'],
    inclus: ['2 séances en direct par semaine', 'Notes, clés, rythme et mesures', 'Lecture de partition', 'Questions au formateur'],
    recommandee: true,
    bouton: { libelle: 'Je m’inscris', action: { type: 'inscription', formation: 'solfege', offre: 'partition-60-jours' } },
  },
  {
    id: 'piano-en-ligne',
    nom: 'Piano en ligne',
    description: 'Apprendre le piano depuis chez vous, avec un cours en direct chaque semaine.',
    prix: { montant: 25000, devise: 'FCFA', mention: 'par mois' },
    modalite: 'En ligne',
    duree: '6 à 8 mois',
    horaires: 'Lundi, 18 h – 19 h',
    formations: ['piano'],
    inclus: ['1 séance en direct par semaine', 'Position, coordination, accords', 'Accompagnement', 'Paiement mois par mois'],
    bouton: { libelle: 'Choisir cette formule', action: { type: 'inscription', formation: 'piano', offre: 'piano-en-ligne' } },
  },
  {
    id: 'piano-presentiel',
    nom: 'Piano en présentiel',
    description: 'Les cours de piano en salle, chaque samedi matin à Abidjan.',
    prix: { montant: 30000, devise: 'FCFA', mention: 'par mois' },
    modalite: 'Présentiel',
    duree: '6 à 8 mois',
    horaires: 'Samedi, 8 h 30 – 13 h 30',
    lieu: 'Paroisse Saint Jean-Paul II, Cocody Angré 8e tranche, Abidjan',
    formations: ['piano'],
    inclus: ['Cours chaque samedi matin', 'Pratique sur instrument', 'Position, accords, accompagnement', 'Paiement mois par mois'],
    bouton: { libelle: 'Choisir cette formule', action: { type: 'inscription', formation: 'piano', offre: 'piano-presentiel' } },
  },
  {
    id: 'coaching',
    nom: 'Coaching individuel',
    description: 'Vous êtes seul avec le formateur : un programme sur mesure, à votre rythme et selon vos objectifs.',
    prix: { montant: 250000, devise: 'FCFA', mention: 'pour 5 à 6 mois' },
    modalite: 'En ligne',
    duree: '5 à 6 mois',
    horaires: 'Créneaux fixés avec le formateur',
    formations: ['solfege', 'piano', 'harmonie', 'oreille-musicale'],
    inclus: ['Cours individuels en ligne', 'Programme sur mesure', 'Suivi personnalisé de votre progression'],
    bouton: { libelle: 'Choisir le coaching', action: { type: 'inscription', offre: 'coaching' } },
  },
];

export function trouverOffre(id: string | null | undefined) {
  return offres.find((o) => o.id === id);
}

/** Offres proposées pour une formation (toutes si aucune formation n'est choisie). */
export function offresPour(formationId: string | null | undefined) {
  if (!formationId) return offres;
  return offres.filter((o) => o.formations.includes(formationId));
}

export function formaterPrix(prix: Prix) {
  const montant = new Intl.NumberFormat('fr-FR').format(prix.montant).replace(/ | /g, ' ');
  return `${montant} ${prix.devise}`;
}
