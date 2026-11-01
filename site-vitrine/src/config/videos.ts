import videoMasterclass from '../assets/masterclass-video.mp4';
import posterMasterclass from '../assets/masterclass-poster.jpg';

/**
 * ============================================================
 *  VIDÉOS DE PRÉSENTATION ET DÉMONSTRATIONS
 *  Deux possibilités pour chaque vidéo :
 *   - youtube : l'identifiant de la vidéo (la partie après « v= » dans l'adresse).
 *     Ex. pour https://www.youtube.com/watch?v=AbCdEf12345 → 'AbCdEf12345'
 *   - fichier : une vidéo déposée dans public/videos/, ex. '/videos/presentation.mp4'
 *  Une vidéo sans youtube ni fichier s'affiche comme emplacement en mode aperçu.
 *  La vidéo YouTube ne se charge qu'au clic (le site reste rapide).
 * ============================================================
 */
export type Video = {
  titre: string;
  description: string;
  youtube?: string;
  fichier?: string;
  /** Image d'aperçu pour une vidéo en fichier, ex. '/images/video-1.jpg'. */
  miniature?: string;
  /** Vidéo verticale (format téléphone, 9:16). */
  vertical?: boolean;
};

export const sectionVideos = {
  titre: 'Vidéos et démonstrations',
  introduction: 'Découvrez la méthode en images : présentation des formations et démonstrations pédagogiques.',
};

export const videos: Video[] = [
  {
    titre: 'Masterclass gratuite : lire une partition sans se perdre',
    description: 'En une minute : pourquoi on se perd devant une partition, la méthode « UN PAS » et le rendez-vous du 8 novembre.',
    fichier: videoMasterclass as string,
    miniature: posterMasterclass as string,
    vertical: true,
  },
  { titre: 'Présentation des formations', description: 'Le Formateur Anoh Cyrille présente la méthode et le contenu des formations.', youtube: '' },
  { titre: 'Démonstration : lire une partition', description: 'Une démonstration pédagogique de lecture de notes et de rythme.', youtube: '' },
  { titre: 'Démonstration : au piano', description: 'Une démonstration au clavier : accords et accompagnement.', youtube: '' },
];
