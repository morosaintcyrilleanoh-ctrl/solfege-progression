import type { Bouton } from './types';

/**
 * ============================================================
 *  BLOCS QUI AIDENT À DÉCIDER
 *  - « Pour qui ? » (accueil)
 *  - « Vos difficultés → notre solution » (accueil)
 *  - Barre d'action fixe en bas de l'écran (téléphone)
 *  - Bouton de partage
 *  Textes proposés : adaptez-les à vos mots.
 * ============================================================
 */
export const pourQui = {
  titre: 'Ces formations sont-elles faites pour vous ?',
  pourVous: [
    'Vous partez de zéro et voulez enfin comprendre la musique',
    'Vous jouez ou chantez à l’oreille et voulez lire une partition',
    'Vous servez à l’église, dans une chorale ou un groupe et voulez progresser',
    'Vous voulez une méthode claire et progressive, en français',
  ],
  pasPourVous: [
    'Vous cherchez un résultat sans pratiquer régulièrement',
    'Vous voulez seulement des partitions toutes faites, sans apprendre à les lire',
  ],
};

export const difficultes = {
  titre: 'Vos difficultés, nos solutions',
  introduction: 'Les blocages les plus fréquents chez les musiciens qui apprennent seuls, et la réponse des formations.',
  liste: [
    {
      probleme: 'Je n’arrive pas à lire les notes rapidement.',
      solution: 'Des exercices progressifs de lecture en clé de sol et de fa, avec correction.',
    },
    {
      probleme: 'Je ne comprends pas le rythme et les mesures.',
      solution: 'Le rythme expliqué simplement, puis pratiqué : compter, frapper, lire.',
    },
    {
      probleme: 'Je joue à l’oreille mais je ne sais pas ce que je fais.',
      solution: 'L’harmonie et les accords reliés à ce que vous jouez déjà.',
    },
    {
      probleme: 'Les vidéos gratuites partent dans tous les sens.',
      solution: 'Un parcours structuré, du solfège à l’harmonie, avec un formateur pour répondre à vos questions.',
    },
  ],
};

/** Barre fixe en bas de l'écran sur téléphone. */
export const barreAction: { bouton: Bouton; afficherWhatsApp: boolean } = {
  bouton: { libelle: 'Je m’inscris', action: { type: 'inscription' } },
  afficherWhatsApp: true,
};

/** Message utilisé par les boutons « Partager à un ami ». L'adresse du site est ajoutée automatiquement. */
export const partage = {
  message: 'Je te recommande les formations musicales du Formateur Anoh Cyrille (solfège, piano, harmonie…) :',
};
