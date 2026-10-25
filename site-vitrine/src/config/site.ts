import type { Bouton } from './types';

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
    whatsapp: '',
    /** Numéro affiché (format libre). Ex. : '+225 07 00 00 00 00'. */
    telephone: '',
    email: '',
    /** Ex. : 'Abidjan, Côte d’Ivoire'. */
    localisation: '',
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
  },

  /**
   * Images. Déposez vos fichiers dans le dossier public/images/
   * puis indiquez leur chemin, ex. : '/images/formateur.jpg'.
   */
  images: {
    /** Votre logo (en-tête et pied de page), ex. '/images/logo.png'. Vide = clé de sol. */
    logo: '',
    /** Photo principale (accueil). Format portrait conseillé, ~900 × 1100 px, < 250 Ko. */
    formateurAccueil: '',
    /** Photo de la section « Le formateur ». */
    formateurPresentation: '',
    /** Photo de la section communauté (cours, groupe, concert…). */
    communaute: '',
  },
};

/** Accueil (bandeau principal). */
export const accueil = {
  surtitre: 'Avec le Formateur Anoh Cyrille',
  titre: 'Lisez, comprenez et jouez la musique.',
  sousTitre:
    'Des formations progressives en solfège, lecture de partition, piano, harmonie et oreille musicale, pensées pour les débutants et les musiciens francophones.',
  boutonPrincipal: { libelle: 'Découvrir les formations', action: { type: 'section', id: 'formations' } } satisfies Bouton,
  boutonSecondaire: { libelle: 'Poser une question', action: { type: 'whatsapp' } } satisfies Bouton,
  /** Mots-clés affichés sous les boutons. */
  disciplines: ['Solfège', 'Lecture', 'Piano', 'Harmonie', 'Oreille'],
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
  parcours: [] as string[],
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
  texte:
    'Inscrivez-vous à la formation de votre choix ou posez vos questions directement au formateur. Vous recevrez une réponse personnalisée.',
  boutonInscription: { libelle: 'Je m’inscris', action: { type: 'inscription' } } satisfies Bouton,
  boutonContact: { libelle: 'Écrire sur WhatsApp', action: { type: 'whatsapp' } } satisfies Bouton,
};
