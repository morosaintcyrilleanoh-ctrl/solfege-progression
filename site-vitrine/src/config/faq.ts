/**
 * ============================================================
 *  FOIRE AUX QUESTIONS
 *  Une réponse vide ('') affiche « À compléter » en mode aperçu,
 *  et la question est masquée une fois le mode aperçu désactivé.
 * ============================================================
 */
export type QuestionFaq = { question: string; reponse: string };

export const sectionFaq = {
  titre: 'Questions fréquentes',
};

export const faq: QuestionFaq[] = [
  {
    question: 'Je n’ai jamais fait de musique. Puis-je commencer ?',
    reponse:
      'Oui. Les formations sont pensées pour les débutants : chaque notion est expliquée depuis le début. La formation Solfège est le meilleur point de départ.',
  },
  {
    question: 'Par quelle formation commencer ?',
    reponse:
      'Si vous débutez, commencez par le Solfège, puis la Lecture de partition. Le Piano, l’Harmonie et l’Oreille musicale s’appuient sur ces bases. En cas de doute, écrivez au formateur sur WhatsApp.',
  },
  {
    question: 'Comment se déroulent les cours ?',
    reponse: '',
  },
  {
    question: 'Ai-je besoin d’un piano ou d’un clavier ?',
    reponse: '',
  },
  {
    question: 'Comment payer ma formation ?',
    reponse:
      'Le paiement en ligne par Mobile Money et carte bancaire sera bientôt disponible. En attendant, envoyez votre demande d’inscription : le formateur vous recontacte pour confirmer votre inscription et les modalités de paiement.',
  },
  {
    question: 'Combien de temps dure une formation ?',
    reponse: '',
  },
];
