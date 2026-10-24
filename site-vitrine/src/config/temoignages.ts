/**
 * ============================================================
 *  TÉMOIGNAGES
 *  Ajoutez uniquement de vrais témoignages, avec l'accord des personnes.
 *  - photo : facultative, ex. '/images/temoignage-awa.jpg' (carré, ~200 × 200 px).
 *  Tant que la liste est vide, des emplacements s'affichent en mode aperçu
 *  et la section est masquée une fois le mode aperçu désactivé.
 *
 *  Exemple de témoignage :
 *  { nom: 'Prénom N.', details: 'Élève en solfège · Ville', texte: 'Son message…', photo: '' },
 * ============================================================
 */
export type Temoignage = {
  nom: string;
  /** Ex. « Élève en piano · Abidjan ». */
  details?: string;
  texte: string;
  photo?: string;
};

export const sectionTemoignages = {
  titre: 'Témoignages',
  introduction: 'Ce que disent les élèves des formations Apprendre la musique.',
  /** Nombre d'emplacements vides montrés en mode aperçu. */
  emplacementsApercu: 3,
};

export const temoignages: Temoignage[] = [];
