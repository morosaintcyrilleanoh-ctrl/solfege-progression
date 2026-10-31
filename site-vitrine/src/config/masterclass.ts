import afficheMasterclass from '../assets/affiche-masterclass.jpg';
import videoMasterclass from '../assets/masterclass-video.mp4';
import posterMasterclass from '../assets/masterclass-poster.jpg';

/**
 * ============================================================
 *  MASTERCLASS GRATUITE
 *  Page /masterclass + bandeau sur l'accueil (masqué automatiquement
 *  une fois l'événement passé).
 *  Dates en heure d'Abidjan = GMT (« Z » à la fin).
 * ============================================================
 */
export const masterclass = {
  actif: true,
  titre: 'Lire une partition de musique sans te perdre',
  accroche: 'Une méthode claire, simple et pratique pour enfin comprendre les symboles, les notes et le rythme.',
  /** Début et fin (heure d'Abidjan = GMT). */
  debut: '2026-11-08T20:30:00Z',
  fin: '2026-11-08T22:00:00Z',
  dateTexte: 'Dimanche 8 novembre 2026',
  heureTexte: '20 h 30 – 22 h (heure d’Abidjan, GMT)',
  plateforme: 'En direct sur YouTube',

  /**
   * Lien du groupe WhatsApp de la masterclass (https://chat.whatsapp.com/…).
   * Renseigné : « Réserver ma place » y mène directement.
   * Vide : l'inscription envoie un message WhatsApp au formateur.
   */
  lienGroupe: 'https://chat.whatsapp.com/HEy0MsSUhmDDv1qjHr5PUQ',
  /** Lien du direct YouTube (ou de la chaîne). Affiché pendant et après l'événement. */
  lienYoutube: '',
  /** Lien du replay, si vous le publiez. */
  lienReplay: '',

  affiche: afficheMasterclass as string,
  video: videoMasterclass as string,
  poster: posterMasterclass as string,

  problemes: [
    'Vous ne savez pas quelle note lire en premier',
    'Vous hésitez sur le rythme',
    'Vous recommencez plusieurs fois',
    'Et vous retournez chercher un tutoriel…',
  ],
  benefices: [
    'Mieux comprendre une partition',
    'Savoir par où commencer face à une nouvelle partition',
    'Mieux repérer les notes et les rythmes',
    'Éviter les erreurs qui ralentissent votre apprentissage',
    'Poser vos questions en direct',
  ],
  /** La méthode « UN PAS » du formateur. */
  methode: [
    { lettre: 'U', titre: 'Comprendre', texte: 'les bases de la musique' },
    { lettre: 'N', titre: 'Nommer', texte: 'les notes et les rythmes' },
    { lettre: 'P', titre: 'Pratiquer', texte: 'avec des exercices concrets' },
    { lettre: 'A', titre: 'Appliquer', texte: 'sur des morceaux réels' },
    { lettre: 'S', titre: 'Se perfectionner', texte: 'pour aller plus loin' },
  ],
  ouvertA: 'Débutants, musiciens, chanteurs, étudiants et passionnés de musique.',
  aApporter: 'Pas besoin d’être un expert : venez avec votre curiosité, votre cahier et votre instrument.',
};

export type EtatEvenement = 'a-venir' | 'en-direct' | 'termine';

export function etatMasterclass(maintenant = Date.now()): EtatEvenement {
  if (maintenant < Date.parse(masterclass.debut)) return 'a-venir';
  if (maintenant < Date.parse(masterclass.fin)) return 'en-direct';
  return 'termine';
}

/** Lien « Ajouter à mon agenda » (Google Agenda). */
export function lienAgenda() {
  const format = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d+/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Masterclass gratuite : ${masterclass.titre}`,
    dates: `${format(masterclass.debut)}/${format(masterclass.fin)}`,
    details: `Avec le Formateur Anoh Cyrille. ${masterclass.plateforme}.${masterclass.lienYoutube ? ` ${masterclass.lienYoutube}` : ''}`,
    location: masterclass.lienYoutube || 'YouTube',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
