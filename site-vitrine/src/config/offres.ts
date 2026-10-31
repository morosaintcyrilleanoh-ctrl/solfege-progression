import type { Bouton, Prix } from './types';
import affichePartition from '../assets/affiche-partition-60-jours.jpg';
import affichePianoEnLigne from '../assets/affiche-piano-en-ligne.jpg';
import affichePianoPresentiel from '../assets/affiche-piano-presentiel.jpg';

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
  /** Période de la prochaine session, telle qu'affichée. */
  periode?: string;
  /** Date de début (AAAA-MM-JJ) : sert au « Début dans X jours ». */
  debut?: string;
  /** Nombre de places par session. */
  places?: number;
  /** Affiche de la formation (image carrée). */
  affiche?: string;
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
    description: 'Un accompagnement pratique pour apprendre à déchiffrer une partition avec méthode.',
    prix: { montant: 50000, devise: 'FCFA', mention: 'pour les 2 mois' },
    modalite: 'En ligne',
    duree: '60 jours (2 mois)',
    horaires: 'Lundi et jeudi, 20 h 30 – 22 h',
    periode: 'Du 1er décembre 2026 au 31 janvier 2027',
    debut: '2026-12-01',
    places: 30,
    affiche: affichePartition as string,
    formations: ['solfege'],
    inclus: [
      'Les bases de la partition',
      'Méthodes de déchiffrage en clé de sol et en clé de fa',
      'Des lives d’apprentissage, 2 fois par semaine',
      'Un groupe WhatsApp de suivi',
    ],
    recommandee: true,
    bouton: { libelle: 'Je m’inscris', action: { type: 'inscription', formation: 'solfege', offre: 'partition-60-jours' } },
  },
  {
    id: 'piano-en-ligne',
    nom: 'Piano en ligne',
    description: 'Programme d’accompagnement : apprenez, pratiquez et progressez depuis chez vous, à votre rythme.',
    prix: { montant: 25000, devise: 'FCFA', mention: 'par mois' },
    modalite: 'En ligne',
    duree: '5 mois',
    horaires: 'Lundi, 18 h – 19 h',
    periode: 'Du 10 janvier au 10 mai 2027',
    debut: '2027-01-10',
    places: 30,
    affiche: affichePianoEnLigne as string,
    formations: ['piano'],
    inclus: [
      'Vidéos de qualité et supports pédagogiques (PDF)',
      'Bases, gammes, accords et accompagnement moderne',
      'Suivi personnalisé et groupe WhatsApp de suivi',
      'Attestation de formation',
    ],
    bouton: { libelle: 'Choisir cette formule', action: { type: 'inscription', formation: 'piano', offre: 'piano-en-ligne' } },
  },
  {
    id: 'piano-presentiel',
    nom: 'Piano en présentiel',
    description: 'Votre talent mérite une bonne formation : les cours de piano en salle, chaque samedi matin à Abidjan.',
    prix: { montant: 30000, devise: 'FCFA', mention: 'par mois' },
    modalite: 'Présentiel',
    duree: '5 mois',
    horaires: 'Samedi, 8 h 30 – 13 h 30',
    lieu: 'Paroisse Saint Jean-Paul II, Cocody Angré 8e tranche, Abidjan',
    periode: 'Du 10 janvier au 10 mai 2027',
    debut: '2027-01-10',
    places: 30,
    affiche: affichePianoPresentiel as string,
    formations: ['piano'],
    inclus: [
      'Les bases du piano, les gammes et les accords',
      'L’accompagnement moderne',
      'Exercices d’indépendance des deux mains',
      'Un groupe WhatsApp de suivi',
    ],
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

/** Nombre de jours avant le début de la session (null si pas de date ou déjà commencée). */
export function joursAvantDebut(offre: Offre, aujourdHui = new Date()) {
  if (!offre.debut) return null;
  const [a, m, j] = offre.debut.split('-').map(Number);
  const debut = Date.UTC(a ?? 0, (m ?? 1) - 1, j ?? 1);
  const jour = Date.UTC(aujourdHui.getFullYear(), aujourdHui.getMonth(), aujourdHui.getDate());
  const ecart = Math.round((debut - jour) / 86_400_000);
  return ecart >= 0 ? ecart : null;
}
