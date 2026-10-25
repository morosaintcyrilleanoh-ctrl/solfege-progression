/**
 * ============================================================
 *  QUIZ « QUELLE FORMATION EST FAITE POUR MOI ? »
 *  Chaque réponse donne des points à une ou plusieurs formations (par id).
 *  La formation qui a le plus de points est recommandée.
 * ============================================================
 */
export type ReponseQuiz = { libelle: string; points: Record<string, number> };
export type QuestionQuiz = { question: string; reponses: ReponseQuiz[] };

export const sectionQuiz = {
  titre: 'Quelle formation est faite pour vous ?',
  introduction: 'Répondez à 3 questions : on vous recommande la formation la plus adaptée pour commencer.',
};

export const quiz: QuestionQuiz[] = [
  {
    question: 'Où en êtes-vous en musique ?',
    reponses: [
      { libelle: 'Je pars de zéro', points: { solfege: 3 } },
      { libelle: 'Je connais les notes mais je lis lentement', points: { 'lecture-partition': 3 } },
      { libelle: 'Je joue déjà, surtout à l’oreille', points: { harmonie: 2, 'oreille-musicale': 1, 'lecture-partition': 1 } },
      { libelle: 'Je lis et je joue, je veux aller plus loin', points: { harmonie: 3 } },
    ],
  },
  {
    question: 'Quel est votre objectif principal ?',
    reponses: [
      { libelle: 'Comprendre et lire la musique', points: { solfege: 2, 'lecture-partition': 2 } },
      { libelle: 'Jouer du piano ou du clavier', points: { piano: 4 } },
      { libelle: 'Accompagner, arranger ou composer', points: { harmonie: 3 } },
      { libelle: 'Chanter ou jouer plus juste', points: { 'oreille-musicale': 3 } },
    ],
  },
  {
    question: 'Avez-vous un clavier ou un piano ?',
    reponses: [
      { libelle: 'Oui', points: { piano: 2 } },
      { libelle: 'Pas encore', points: { solfege: 1, 'oreille-musicale': 1 } },
      { libelle: 'Je joue d’un autre instrument', points: { 'lecture-partition': 1, harmonie: 1 } },
      { libelle: 'Je chante', points: { 'oreille-musicale': 2, 'lecture-partition': 1 } },
    ],
  },
];
