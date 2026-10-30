import type { Bouton } from './types';
import emblemeLogo from '../assets/logo-embleme.png';
import photoFormateur from '../assets/formateur.jpg';
import photoPiano from '../assets/formateur-piano.jpg';

/**
 * ============================================================
 *  CONFIGURATION GÉNÉRALE DU SITE
 *  Modifiez ici les textes, coordonnées et liens.
 *  Un champ laissé vide ('') est simplement masqué sur le site.
 * ============================================================
 */
export const site = {
  nom: 'Apprendre la musique',
  formateur: 'Anoh Cyrille',
  titreFormateur: 'Formateur Anoh Cyrille',
  slogan: 'Apprendre la musique avec méthode.',

  /**
   * Mode aperçu : affiche des emplacements « à compléter » pour les photos,
   * vidéos, témoignages, tarifs et coordonnées qui ne sont pas encore renseignés.
   * Passez à false avant la mise en ligne : les emplacements vides seront masqués.
   */
  afficherEmplacements: true,

  /** Langue et référencement. */
  seo: {
    titre: 'Apprendre la musique · Formations du Formateur Anoh Cyrille',
    description:
      'Solfège, lecture de partition, piano, harmonie et oreille musicale : des formations claires et progressives pour les débutants et musiciens francophones.',
  },

  /** Coordonnées. Laissez vide ce que vous ne souhaitez pas afficher. */
  contact: {
    /** Numéro WhatsApp au format international, chiffres uniquement. Ex. : '2250700000000'. */
    whatsapp: '2250749562180',
    /** Numéro affiché (format libre). Ex. : '+225 07 00 00 00 00'. */
    telephone: '+225 07 49 56 21 80',
    email: '',
    /** Ex. : 'Abidjan, Côte d’Ivoire'. */
    localisation: 'Abidjan, Côte d’Ivoire',
    /** Ex. : 'Du lundi au samedi, 9 h – 18 h (GMT)'. */
    horaires: '',
  },

  /** Messages WhatsApp pré-remplis. {formation} et {offre} sont remplacés automatiquement. */
  messagesWhatsApp: {
    general: 'Bonjour Formateur Anoh Cyrille, je souhaite avoir des informations sur vos formations.',
    formation: 'Bonjour Formateur Anoh Cyrille, je suis intéressé(e) par la formation « {formation} ».',
    offre: 'Bonjour Formateur Anoh Cyrille, je souhaite souscrire à l’offre « {offre} ».',
  },

  /** Réseaux sociaux : collez l'adresse complète de vos pages. */
  reseaux: {
    facebook: '',
    youtube: '',
    instagram: '',
    tiktok: '',
  },

  /** Lien vers la plateforme d'exercices en ligne (laboratoires), si vous souhaitez l'afficher. */
  plateforme: {
    url: '',
    libelle: 'Accéder à la plateforme d’exercices',
    /**
     * Adresse du test de niveau gratuit de la plateforme
     * (ex. 'https://votre-plateforme.vercel.app/test-de-positionnement').
     * Renseignée, elle ajoute le bouton « Tester mon niveau gratuitement ».
     */
    testNiveau: '',
  },

  /**
   * Images. Déposez vos fichiers dans le dossier public/images/
   * puis indiquez leur chemin, ex. : '/images/formateur.jpg'.
   */
  images: {
    /**
     * Emblème du logo (en-tête, pied de page). Par défaut : src/assets/logo-embleme.png.
     * Pour le changer : remplacez ce fichier, ou indiquez un chemin, ex. '/images/logo.png'.
     * Logo complet (pour vos documents et réseaux) : public/images/logo.jpg
     */
    logo: emblemeLogo as string,
    /**
     * Photo principale (accueil). Format portrait conseillé, ~900 × 1100 px, < 250 Ko.
     * Par défaut : src/assets/formateur.jpg (remplacez ce fichier pour changer de photo).
     */
    formateurAccueil: photoFormateur as string,
    /** Photo de la section « Le formateur ». */
    formateurPresentation: photoPiano as string,
    /** Photo de la section communauté (cours, groupe, concert…). */
    communaute: '',
  },
};

/** Accueil (bandeau principal). */
export const accueil = {
  /** Annonce cliquable au-dessus du titre (vide = masquée). */
  annonce: { texte: 'Programme phare : Lire une partition en 60 jours', chemin: '/formations/solfege' },
  surtitre: 'Avec le Formateur Anoh Cyrille',
  titre: 'Lisez, comprenez et jouez la musique.',
  sousTitre:
    'Des formations progressives en solfège, lecture de partition, piano, harmonie et oreille musicale, pensées pour les débutants et les musiciens francophones.',
  boutonPrincipal: { libelle: 'Je commence maintenant', action: { type: 'inscription' } } satisfies Bouton,
  boutonSecondaire: { libelle: 'Quelle formation pour moi ?', action: { type: 'section', id: 'quiz' } } satisfies Bouton,
  /** Preuve sociale sous les boutons (vide = masquée). Lien vers la section témoignages. */
  preuve: 'Des élèves formés en ligne dans 6 pays',
  lienPreuve: 'Lire leurs témoignages',
  /** Étiquette sous la photo du formateur. */
  etiquettePhoto: 'Professeur de musique à l’INSAAC',
  /** Mots-clés du ruban défilant. */
  disciplines: ['Solfège', 'Lecture', 'Piano', 'Harmonie', 'Oreille musicale'],
};

/** Présentation du formateur. */
export const formateur = {
  titre: 'Le formateur',
  nom: 'Anoh Cyrille',
  role: 'Formateur en solfège, piano et harmonie',
  /** Paragraphes de présentation. Remplacez-les par votre propre texte. */
  presentation: [
    'Je suis Anoh Cyrille, formateur spécialisé dans l’enseignement du solfège, de la lecture de partition, du piano, de l’harmonie et du développement de l’oreille musicale.',
    'Mon objectif est de rendre la théorie musicale claire et concrète : chaque notion est expliquée simplement, puis mise en pratique, pour que vous puissiez lire, comprendre et jouer la musique avec assurance.',
  ],
  /**
   * Parcours, diplômes, expériences : à compléter avec des informations réelles.
   * Chaque ligne s'affiche comme un point de la liste. Laissez vide pour masquer.
   */
  parcours: ['Professeur de musique à l’INSAAC'] as string[],
  /**
   * Onglets « Ma mission / Ma méthode » : une phrase forte (en noir)
   * suivie d'une suite (en gris). Textes proposés : adaptez-les à vos mots.
   */
  onglets: [
    {
      libelle: 'Ma mission',
      fort: 'Rendre la musique compréhensible et accessible à chaque francophone qui veut apprendre.',
      suite: 'Des premières notes jusqu’à l’harmonie, chaque élève avance à son rythme, avec des explications claires.',
    },
    {
      libelle: 'Ma méthode',
      fort: 'Expliquer simplement, puis pratiquer tout de suite.',
      suite: 'Chaque notion est reliée à l’écoute et au jeu, pour lire, comprendre et jouer la musique avec assurance.',
    },
  ],
  specialites: ['Solfège', 'Lecture de partition', 'Piano', 'Harmonie', 'Oreille musicale'],
  bouton: { libelle: 'Échanger avec le formateur', action: { type: 'whatsapp' } } satisfies Bouton,
};

/** Communauté « Apprendre la musique ». */
export const communaute = {
  titre: 'La communauté Apprendre la musique',
  introduction:
    'Apprendre la musique, c’est aussi progresser avec d’autres. La communauté réunit les élèves et musiciens francophones qui suivent les formations du Formateur Anoh Cyrille.',
  /** Les piliers de la communauté. Modifiez-les pour refléter ce que vous proposez réellement. */
  piliers: [
    { titre: 'Entraide', texte: 'Posez vos questions, partagez vos difficultés et vos progrès avec d’autres élèves.' },
    { titre: 'Pratique régulière', texte: 'Des exercices et défis pour garder le rythme et travailler chaque semaine.' },
    { titre: 'Échanges avec le formateur', texte: 'Des moments d’échange pour clarifier les notions et avancer sereinement.' },
  ],
  /** Bouton pour rejoindre (groupe WhatsApp, chaîne, page…). Lien vide = bouton masqué. */
  bouton: { libelle: 'Rejoindre la communauté', action: { type: 'lien', url: '', nouvelOnglet: true } } satisfies Bouton,
};

/** Bloc d'appel à l'action (inscription et contact). */
export const appelAction = {
  titre: 'Prêt à commencer ?',
  /** Bouton principal en fin de page. */
  texte:
    'Inscrivez-vous à la formation de votre choix ou posez vos questions directement au formateur. Vous recevrez une réponse personnalisée.',
  boutonInscription: { libelle: 'Réserver ma place', action: { type: 'inscription' } } satisfies Bouton,
  boutonContact: { libelle: 'Poser une question sur WhatsApp', action: { type: 'whatsapp' } } satisfies Bouton,
};
