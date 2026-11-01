/**
 * Types partagés par les fichiers de configuration.
 * Vous n'avez normalement pas besoin de modifier ce fichier.
 */

/**
 * Ce que fait un bouton. Chaque bouton du site (formations, offres, héros…)
 * est décrit par une action : il suffit de changer la configuration, pas le code.
 */
export type Action =
  /** Ouvre le formulaire d'inscription, pré-rempli avec la formation et/ou l'offre. */
  | { type: 'inscription'; formation?: string; offre?: string }
  /** Ouvre WhatsApp avec un message pré-rempli (numéro défini dans site.ts). */
  | { type: 'whatsapp'; message?: string }
  /** Ouvre un lien externe (page de paiement, plateforme de cours, formulaire…). */
  | { type: 'lien'; url: string; nouvelOnglet?: boolean }
  /** Fait défiler jusqu'à une section de la page d'accueil (ex. « tarifs »). */
  | { type: 'section'; id: string }
  /** Ouvre une page du site, ex. '/formations/piano'. */
  | { type: 'page'; chemin: string };

export type Bouton = { libelle: string; action: Action };

export type Prix = {
  montant: number;
  /** Ex. « FCFA », « EUR ». */
  devise: string;
  /** Ex. « par mois », « paiement unique ». */
  mention?: string;
};
