/** Libellés lisibles des compétences, pour les statistiques et recommandations. */
export const SKILL_LABELS: Record<string, string> = {
  'lecture.notes': 'Lecture des notes',
  'rythme.durees': 'Durée des figures',
  'rythme.silences': 'Silences',
  'rythme.figures-pointees': 'Figures pointées et triolets',
  'rythme.equivalences': 'Équivalences de durées',
  'rythme.mesures': 'Remplissage des mesures',
  'rythme.pulsation': 'Mesures simples et composées',
  'rythme.syncopes': 'Syncopes',
  'rythme.tempo': 'Tempo',
  'tonalites.tons': 'Tons et demi-tons',
  'tonalites.armures': 'Armures',
  'tonalites.identification': 'Identification des tonalités',
  'tonalites.gammes-majeures': 'Gammes majeures',
  'tonalites.gammes-mineures': 'Gammes mineures',
  'tonalites.degres': 'Degrés de la gamme',
  'tonalites.relatives': 'Tonalités relatives',
  'intervalles.identification': 'Identification des intervalles',
  'intervalles.construction': 'Construction des intervalles',
  'accords.qualite': 'Accords majeurs et mineurs',
  'accords.renversements': 'Renversements',
  'accords.fonctions': 'Degrés et fonctions harmoniques',
  'lecture.melodique': 'Lecture mélodique',
};

export function skillLabel(skill: string): string {
  return SKILL_LABELS[skill] ?? skill;
}
