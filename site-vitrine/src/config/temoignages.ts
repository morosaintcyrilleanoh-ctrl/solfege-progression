/**
 * ============================================================
 *  TÉMOIGNAGES
 *  Vrais messages d'élèves formés en ligne (reçus sur WhatsApp).
 *  Par respect de leur vie privée : prénom + initiale et pays uniquement,
 *  jamais de numéro de téléphone. Orthographe légèrement corrigée,
 *  sans changer le sens. Demandez l'accord de chaque élève.
 *  - photo : facultative, ex. '/images/temoignage-ben.jpg' (carré, ~200 × 200 px).
 *  - Les témoignages s'affichent dans l'ordre de cette liste.
 * ============================================================
 */
export type Temoignage = {
  nom: string;
  /** Ex. « Élève en ligne · Côte d'Ivoire ». */
  details?: string;
  texte: string;
  photo?: string;
};

export const sectionTemoignages = {
  titre: 'Ce que disent les élèves',
  introduction:
    'Messages reçus après les cours en direct. Des élèves en Côte d’Ivoire, au Gabon, en Centrafrique, en Guinée, au Sénégal et en France.',
  /** Nombre de témoignages visibles avant le bouton « Voir plus ». */
  visiblesAuDepart: 6,
  /** Nombre d'emplacements vides montrés en mode aperçu si la liste est vide. */
  emplacementsApercu: 3,
};

export const temoignages: Temoignage[] = [
  {
    nom: 'Ben',
    details: 'Élève en ligne · Côte d’Ivoire',
    texte:
      'Le live était vraiment interactif. J’ai beaucoup appris grâce aux explications claires et aux échanges enrichissants. Avec le formateur Anoh Cyrille, on apprend dans la pratique et la bonne humeur. C’est toujours un réel plaisir d’apprendre avec lui.',
  },
  {
    nom: 'José R.',
    details: 'Élève en ligne · Côte d’Ivoire',
    texte:
      'J’ai particulièrement apprécié ce direct, qui m’a permis de mieux comprendre la disposition des notes sur les portées en clé de sol et, surtout, en clé de fa. Merci pour la qualité de votre enseignement, votre disponibilité et le partage de vos connaissances. J’ai la ferme conviction qu’au terme de cette formation, je serai capable de lire une partition de manière autonome.',
  },
  {
    nom: 'L. N.',
    details: 'Élève en ligne · Centrafrique',
    texte:
      'Un cours de musique tout simplement super ! L’ambiance est joyeuse, l’enseignement est clair et adapté. Grâce à la pédagogie du formateur, je découvre la lecture de partition, le rythme et le solfège avec plaisir. Bravo pour ce travail remarquable.',
  },
  {
    nom: 'Emmanuel',
    details: 'Élève en ligne · Guinée',
    texte:
      'Merci pour cette formation enrichissante. Il y a de la méthode, de la clarté et de la pertinence dans vos cours. J’ai déjà beaucoup appris et j’ai hâte de suivre la prochaine séance.',
  },
  {
    nom: 'Enock-C.',
    details: 'Élève en ligne · Côte d’Ivoire',
    texte:
      'J’ai compris beaucoup de choses aujourd’hui. Il faudra que je travaille encore, mais j’ai commencé à déchiffrer des partitions, et cela grâce à vous. Merci coach.',
  },
  {
    nom: 'Fredyannyck',
    details: 'Élève en ligne · Gabon',
    texte:
      'Merci pour votre temps et votre disponibilité à nous former. Les cours sont bien expliqués et compris, très bonne méthode pédagogique. J’ose croire que nous serons meilleurs à la sortie de cette formation.',
  },
  {
    nom: 'Merveille D.',
    details: 'Élève en ligne · France',
    texte: 'Merci infiniment professeur, merci pour la méthode et la patience. C’était magnifique, je fais des progrès au fur et à mesure.',
  },
  {
    nom: 'Marie B.',
    details: 'Élève en ligne · Sénégal',
    texte: 'Merci professeur, le cours a été instructif : on a encore fait un pas en avant avec la lecture rythmique.',
  },
  {
    nom: 'Un élève',
    details: 'Élève en ligne · Côte d’Ivoire',
    texte: 'Le premier live fut enrichissant. À cette allure, si je suis assidu, je saurai lire une partition à la fin.',
  },
];
