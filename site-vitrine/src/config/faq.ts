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
      'Si vous débutez, commencez par le programme de Solfège « Lire une partition musicale en 60 jours ». Le Piano, l’Harmonie et l’Oreille musicale s’appuient sur ces bases. En cas de doute, faites le quiz d’orientation ou écrivez au formateur sur WhatsApp.',
  },
  {
    question: 'Comment se déroulent les cours ?',
    reponse:
      'Les cours ont lieu en ligne, en direct avec le formateur : vous suivez les explications, posez vos questions et pratiquez pendant la séance, où que vous soyez. Le Solfège a lieu le lundi et le jeudi de 20 h 30 à 22 h, le Piano en ligne le lundi de 18 h à 19 h (heure d’Abidjan, GMT). Le Piano existe aussi en présentiel à Abidjan, le samedi de 8 h 30 à 13 h 30, à la paroisse Saint Jean-Paul II de Cocody Angré 8e tranche.',
  },
  {
    question: 'Ai-je besoin d’un piano ou d’un clavier ?',
    reponse: '',
  },
  {
    question: 'Comment payer ma formation ?',
    reponse:
      'Envoyez votre demande d’inscription depuis le site : le formateur vous recontacte sur WhatsApp pour confirmer votre place et vous indiquer comment régler. Le paiement en ligne par Mobile Money et carte bancaire sera bientôt disponible.',
  },
  {
    question: 'Combien de temps dure une formation ?',
    reponse:
      'Le programme de Solfège « Lire une partition musicale en 60 jours » dure 2 mois (prochaine session du 1er décembre 2026 au 31 janvier 2027). La formation Piano dure 5 mois (prochaine session du 10 janvier au 10 mai 2027). Le coaching individuel dure de 5 à 6 mois.',
  },
  {
    question: 'Je n’ai pas d’instrument. Puis-je suivre les formations ?',
    reponse:
      'Oui pour le Solfège, l’Harmonie et l’Oreille musicale : ces disciplines se travaillent sans instrument. Pour le Piano en ligne, il vous faut un piano ou un clavier, même d’entrée de gamme ; en présentiel, des pianos sont disponibles sur place (vous pouvez aussi venir avec le vôtre).',
  },
  {
    question: 'Je n’ai pas beaucoup de temps. Est-ce adapté ?',
    reponse:
      'Les formations sont progressives : quelques séances courtes et régulières chaque semaine sont plus efficaces qu’une longue séance de temps en temps.',
  },
  {
    question: 'Et si je n’y arrive pas ?',
    reponse:
      'Chaque notion est expliquée pas à pas, puis mise en pratique. En cas de blocage, vous pouvez poser vos questions au formateur.',
  },
  {
    question: 'Combien y a-t-il de places ?',
    reponse: 'Chaque session est limitée à 30 places : réservez la vôtre dès que possible.',
  },
  {
    question: 'Est-ce que je reçois une attestation ?',
    reponse: 'Oui, la formation Piano en ligne est validée par une attestation de formation.',
  },
  {
    question: 'Combien coûtent les formations ?',
    reponse:
      'Solfège (60 jours, en ligne) : 50 000 FCFA pour les 2 mois. Piano : 25 000 FCFA par mois en ligne, 30 000 FCFA par mois en présentiel. Coaching individuel : 250 000 FCFA pour 5 à 6 mois. Pour le piano, le premier paiement couvre l’inscription et le premier mois ; ensuite, vous réglez le mois suivant à la fin de chaque mois.',
  },
];
