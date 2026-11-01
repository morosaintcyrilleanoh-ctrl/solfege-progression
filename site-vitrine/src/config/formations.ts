import type { Bouton } from './types';

/**
 * ============================================================
 *  CATALOGUE DES FORMATIONS
 *  Ajoutez, retirez ou réordonnez les formations ici.
 *  - id : identifiant court, sans espace ni accent. Il donne l'adresse de la
 *    page de la formation : /formations/<id> (ex. /formations/piano).
 *  - bouton / boutonSecondaire : configurables (inscription, whatsapp, lien, section, page).
 *  - image : facultative, ex. '/images/formation-piano.jpg' (paysage, ~1200 × 750 px).
 *  Les textes sont des propositions : adaptez-les à votre contenu réel.
 * ============================================================
 */
export type Formation = {
  id: string;
  titre: string;
  accroche: string;
  description: string;
  /** Public visé, ex. « Débutant », « Tous niveaux ». */
  niveau: string;
  /** Points du programme (carte et page de la formation). */
  programme: string[];
  /** « À la fin de la formation, vous saurez… » (page de la formation). */
  objectifs: string[];
  /** « Cette formation est faite pour vous si… » (page de la formation). */
  pourQui: string[];
  /** Ce qu'il faut avant de commencer. */
  prerequis: string;
  /** Matériel nécessaire. */
  materiel: string;
  /** Durée, rythme, format (ex. « 8 semaines · vidéos + lives »). Vide = masqué. */
  format?: string;
  /** Symbole affiché sur la carte. */
  symbole: 'cle-sol' | 'partition' | 'clavier' | 'accord' | 'oreille';
  image?: string;
  bouton: Bouton;
  boutonSecondaire?: Bouton;
};

/** Boutons par défaut d'une carte : « Je m'inscris » (jaune) et « Voir le programme ». */
function boutons(id: string) {
  return {
    bouton: { libelle: 'Je m’inscris', action: { type: 'inscription', formation: id } },
    boutonSecondaire: { libelle: 'Voir le programme', action: { type: 'page', chemin: `/formations/${id}` } },
  } satisfies Pick<Formation, 'bouton' | 'boutonSecondaire'>;
}

export const formations: Formation[] = [
  {
    id: 'solfege',
    titre: 'Solfège',
    accroche: 'Lire une partition musicale en 60 jours',
    description:
      'Un accompagnement pratique pour apprendre à déchiffrer une partition avec méthode, en 2 mois, en direct avec le formateur.',
    niveau: 'Débutant',
    programme: [
      'Les bases de la partition',
      'Méthodes de déchiffrage en clé de sol et en clé de fa',
      'Des lives d’apprentissage',
      'Un groupe WhatsApp de suivi',
    ],
    objectifs: [
      'Lire les notes en clé de sol et en clé de fa',
      'Compter et frapper les rythmes courants',
      'Comprendre les mesures et les indications de la partition',
      'Lire une partition simple de manière autonome',
    ],
    pourQui: [
      'Vous n’avez jamais appris la musique et partez de zéro',
      'Vous jouez ou chantez « à l’oreille » et voulez enfin lire une partition',
      'Vous chantez dans une chorale et voulez suivre la partition',
    ],
    prerequis: 'Aucun : le programme part de zéro.',
    materiel: 'Un téléphone ou un ordinateur avec internet, un cahier et un crayon.',
    format: 'En ligne · 60 jours · du 1er décembre 2026 au 31 janvier 2027 · lundi et jeudi, 20 h 30 – 22 h (GMT)',
    symbole: 'cle-sol',
    ...boutons('solfege'),
  },
  {
    id: 'piano',
    titre: 'Piano',
    accroche: 'Apprenez, pratiquez et progressez avec un accompagnement complet',
    description:
      'Un programme de 5 mois : les bases du piano, les gammes et les accords, l’accompagnement moderne et l’indépendance des deux mains.',
    niveau: 'Débutant',
    programme: [
      'Les bases du piano : posture, lecture, techniques de base',
      'Les gammes et les accords : comprendre et jouer facilement',
      'L’accompagnement moderne : gospel, pop, variété…',
      'Exercices d’indépendance des deux mains : coordination et fluidité',
      'Un groupe WhatsApp de suivi : échanges, conseils et soutien',
    ],
    objectifs: [
      'Adopter une bonne posture et les bonnes techniques de base',
      'Comprendre et jouer les gammes et les accords',
      'Accompagner des chants dans différents styles (gospel, pop, variété…)',
      'Jouer avec plus de coordination et de fluidité entre les deux mains',
    ],
    pourQui: [
      'Vous rêvez de jouer du piano ou du clavier',
      'Vous voulez accompagner les chants à l’église ou en groupe',
      'Vous avez commencé seul et voulez une méthode claire',
    ],
    prerequis: 'Aucun ; le Solfège en parallèle aide à progresser plus vite.',
    materiel: 'En ligne : un piano ou un clavier (même d’entrée de gamme). En présentiel : pianos disponibles sur place, ou venez avec le vôtre.',
    format: '5 mois · du 10 janvier au 10 mai 2027 · en ligne le lundi (18 h – 19 h) ou en présentiel à Abidjan le samedi (8 h 30 – 13 h 30)',
    symbole: 'clavier',
    ...boutons('piano'),
  },
  {
    id: 'harmonie',
    titre: 'Harmonie',
    accroche: 'Comprendre comment la musique s’enchaîne',
    description:
      'Construction des accords, fonctions, cadences et enchaînements : les clés pour analyser, accompagner et composer.',
    niveau: 'Intermédiaire',
    programme: ['Construction des accords', 'Degrés et fonctions', 'Cadences', 'Enchaînements d’accords'],
    objectifs: [
      'Construire n’importe quel accord dans une tonalité',
      'Comprendre le rôle de chaque accord (degrés et fonctions)',
      'Reconnaître et utiliser les cadences',
      'Écrire et jouer des enchaînements d’accords',
    ],
    pourQui: [
      'Vous jouez déjà et voulez comprendre les accords',
      'Vous voulez arranger, accompagner ou composer',
      'Vous dirigez un groupe ou une chorale',
    ],
    prerequis: 'Savoir lire les notes et le rythme (niveau Solfège).',
    materiel: 'Un cahier et un crayon ; un clavier est un plus.',
    format: 'En coaching individuel en ligne, ou sur demande',
    symbole: 'accord',
    ...boutons('harmonie'),
  },
  {
    id: 'oreille-musicale',
    titre: 'Oreille musicale',
    accroche: 'Entendre, reconnaître, reproduire',
    description:
      'Reconnaître les intervalles, les accords et les mélodies à l’oreille pour jouer plus juste et apprendre plus vite.',
    niveau: 'Tous niveaux',
    programme: ['Reconnaissance des intervalles', 'Accords majeurs et mineurs', 'Dictée rythmique', 'Relevé de mélodies'],
    objectifs: [
      'Reconnaître les intervalles à l’écoute',
      'Distinguer un accord majeur d’un accord mineur',
      'Écrire un rythme entendu',
      'Retrouver une mélodie sur votre instrument',
    ],
    pourQui: [
      'Vous voulez jouer ou chanter plus juste',
      'Vous voulez relever des chants sans partition',
      'Vous voulez apprendre les morceaux plus vite',
    ],
    prerequis: 'Aucun ; connaître les notes aide pour les exercices écrits.',
    materiel: 'De quoi écouter des exemples (écouteurs) ; un instrument est un plus.',
    format: 'En coaching individuel en ligne, ou sur demande',
    symbole: 'oreille',
    ...boutons('oreille-musicale'),
  },
];

export function trouverFormation(id: string | null | undefined) {
  return formations.find((f) => f.id === id);
}
