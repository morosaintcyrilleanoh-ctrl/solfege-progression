import type { Bouton, Prix } from './types';

/**
 * ============================================================
 *  TARIFS ET OFFRES
 *  prix : null tant que le tarif n'est pas fixé → « Tarif sur demande ».
 *  Exemple : prix: { montant: 25000, devise: 'FCFA', mention: 'paiement unique' }
 * ============================================================
 */
export type Offre = {
  id: string;
  nom: string;
  description: string;
  prix: Prix | null;
  inclus: string[];
  /** Met l'offre en avant (bordure dorée). */
  recommandee?: boolean;
  bouton: Bouton;
};

export const tarifs = {
  titre: 'Tarifs et offres',
  introduction:
    'Choisissez la formule adaptée à votre objectif. Le paiement pourra se faire par Mobile Money ou par carte bancaire.',
  /** Moyens de paiement affichés (purement informatif). */
  moyensPaiement: ['Orange Money', 'MTN MoMo', 'Moov Money', 'Wave', 'Carte bancaire'],
  /** Mention affichée sous les offres. */
  mention: 'Le paiement en ligne sera activé prochainement. En attendant, l’inscription est confirmée directement avec le formateur.',
};

export const offres: Offre[] = [
  {
    id: 'formation-unique',
    nom: 'Une formation',
    description: 'Suivez la formation de votre choix parmi le catalogue.',
    prix: null,
    inclus: ['Accès à une formation au choix', 'Supports pédagogiques', 'Questions au formateur'],
    bouton: { libelle: 'Choisir cette offre', action: { type: 'inscription', offre: 'formation-unique' } },
  },
  {
    id: 'parcours-complet',
    nom: 'Parcours complet',
    description: 'Les cinq formations pour une progression complète, du solfège à l’harmonie.',
    prix: null,
    inclus: ['Solfège et lecture de partition', 'Piano', 'Harmonie et oreille musicale', 'Questions au formateur'],
    recommandee: true,
    bouton: { libelle: 'Choisir cette offre', action: { type: 'inscription', offre: 'parcours-complet' } },
  },
  {
    id: 'accompagnement',
    nom: 'Accompagnement personnalisé',
    description: 'Un suivi individuel adapté à votre niveau et à vos objectifs.',
    prix: null,
    inclus: ['Programme sur mesure', 'Séances individuelles', 'Suivi de votre progression'],
    bouton: { libelle: 'En parler au formateur', action: { type: 'whatsapp', message: 'Bonjour Formateur Anoh Cyrille, je souhaite un accompagnement personnalisé.' } },
  },
];

export function trouverOffre(id: string | null | undefined) {
  return offres.find((o) => o.id === id);
}

export function formaterPrix(prix: Prix) {
  const montant = new Intl.NumberFormat('fr-FR').format(prix.montant);
  return `${montant} ${prix.devise}`;
}
