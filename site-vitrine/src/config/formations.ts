import type { Bouton } from './types';

/**
 * ============================================================
 *  CATALOGUE DES FORMATIONS
 *  Ajoutez, retirez ou réordonnez les formations ici.
 *  - id : identifiant court, sans espace ni accent (utilisé dans les liens).
 *  - bouton / boutonSecondaire : configurables (inscription, whatsapp, lien, section).
 *  - image : facultative, ex. '/images/formation-piano.jpg' (paysage, ~1200 × 750 px).
 * ============================================================
 */
export type Formation = {
  id: string;
  titre: string;
  accroche: string;
  description: string;
  /** Public visé, ex. « Débutant », « Tous niveaux ». */
  niveau: string;
  /** Ce que la formation aborde. */
  programme: string[];
  /** Symbole affiché sur la carte. */
  symbole: 'cle-sol' | 'partition' | 'clavier' | 'accord' | 'oreille';
  image?: string;
  /** Offre de la section Tarifs associée (facultatif). */
  offre?: string;
  bouton: Bouton;
  boutonSecondaire?: Bouton;
};

export const formations: Formation[] = [
  {
    id: 'solfege',
    titre: 'Solfège',
    accroche: 'Les bases solides de tout musicien',
    description:
      'Notes, clés, rythme, mesures, gammes et intervalles : le langage de la musique expliqué pas à pas, sans prérequis.',
    niveau: 'Débutant',
    programme: ['Les notes et les clés', 'Rythme, figures et mesures', 'Gammes et tonalités', 'Intervalles'],
    symbole: 'cle-sol',
    bouton: { libelle: 'S’inscrire', action: { type: 'inscription', formation: 'solfege' } },
    boutonSecondaire: { libelle: 'Poser une question', action: { type: 'whatsapp' } },
  },
  {
    id: 'lecture-partition',
    titre: 'Lecture de partition',
    accroche: 'Lire une partition avec aisance',
    description:
      'Déchiffrer une partition, repérer les notes et le rythme rapidement, et comprendre les indications du compositeur.',
    niveau: 'Débutant à intermédiaire',
    programme: ['Lecture en clé de sol et de fa', 'Déchiffrage rythmique', 'Nuances et indications', 'Lecture à vue'],
    symbole: 'partition',
    bouton: { libelle: 'S’inscrire', action: { type: 'inscription', formation: 'lecture-partition' } },
    boutonSecondaire: { libelle: 'Poser une question', action: { type: 'whatsapp' } },
  },
  {
    id: 'piano',
    titre: 'Piano',
    accroche: 'Du premier accord aux premiers morceaux',
    description:
      'Position des mains, coordination, accords et accompagnement : apprendre à jouer en reliant chaque geste à la théorie.',
    niveau: 'Débutant',
    programme: ['Découverte du clavier', 'Indépendance des mains', 'Accords et renversements', 'Accompagnement'],
    symbole: 'clavier',
    bouton: { libelle: 'S’inscrire', action: { type: 'inscription', formation: 'piano' } },
    boutonSecondaire: { libelle: 'Poser une question', action: { type: 'whatsapp' } },
  },
  {
    id: 'harmonie',
    titre: 'Harmonie',
    accroche: 'Comprendre comment la musique s’enchaîne',
    description:
      'Construction des accords, fonctions, cadences et enchaînements : les clés pour analyser, accompagner et composer.',
    niveau: 'Intermédiaire',
    programme: ['Construction des accords', 'Degrés et fonctions', 'Cadences', 'Enchaînements d’accords'],
    symbole: 'accord',
    bouton: { libelle: 'S’inscrire', action: { type: 'inscription', formation: 'harmonie' } },
    boutonSecondaire: { libelle: 'Poser une question', action: { type: 'whatsapp' } },
  },
  {
    id: 'oreille-musicale',
    titre: 'Oreille musicale',
    accroche: 'Entendre, reconnaître, reproduire',
    description:
      'Reconnaître les intervalles, les accords et les mélodies à l’oreille pour jouer plus juste et apprendre plus vite.',
    niveau: 'Tous niveaux',
    programme: ['Reconnaissance des intervalles', 'Accords majeurs et mineurs', 'Dictée rythmique', 'Relevé de mélodies'],
    symbole: 'oreille',
    bouton: { libelle: 'S’inscrire', action: { type: 'inscription', formation: 'oreille-musicale' } },
    boutonSecondaire: { libelle: 'Poser une question', action: { type: 'whatsapp' } },
  },
];

export function trouverFormation(id: string | null | undefined) {
  return formations.find((f) => f.id === id);
}
