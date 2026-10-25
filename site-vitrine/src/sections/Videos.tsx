import { useState } from 'react';
import { site } from '../config/site';
import { sectionVideos, videos, type Video } from '../config/videos';
import { EnteteSection } from '../components/EnteteSection';
import { Emplacement } from '../components/Emplacement';
import { Icone } from '../components/Icone';
import styles from './Videos.module.css';

function estRenseignee(v: Video) {
  return Boolean(v.youtube || v.fichier);
}

export function Videos() {
  const visibles = site.afficherEmplacements ? videos : videos.filter(estRenseignee);
  if (visibles.length === 0) return null;

  return (
    <section id="videos" className="section section--grise" aria-labelledby="titre-videos">
      <div className="conteneur">
        <EnteteSection id="titre-videos" surtitre="Vidéos" titre={sectionVideos.titre} introduction={sectionVideos.introduction} />
        <ul className={styles.grille}>
          {visibles.map((v, i) => (
            <li key={`${v.titre}-${i}`} className={`${styles.element} ${i === 0 ? styles.principale : ''}`}>
              <div className={styles.cadre}>
                <Lecteur video={v} />
              </div>
              <h3 className={styles.titre}>{v.titre}</h3>
              <p className={styles.description}>{v.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Lecteur léger : pour YouTube, seule la miniature est chargée ;
 * le lecteur complet ne se charge qu'au clic (économie de données mobiles).
 */
function Lecteur({ video }: { video: Video }) {
  const [actif, setActif] = useState(false);

  if (video.fichier) {
    return <video className={styles.media} src={video.fichier} poster={video.miniature} controls preload="none" playsInline />;
  }

  if (video.youtube) {
    if (actif) {
      return (
        <iframe
          className={styles.media}
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtube)}?autoplay=1&rel=0`}
          title={video.titre}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    return (
      <button type="button" className={styles.vignette} onClick={() => setActif(true)}>
        <img
          className={styles.media}
          src={video.miniature || `https://i.ytimg.com/vi/${encodeURIComponent(video.youtube)}/hqdefault.jpg`}
          alt=""
          loading="lazy"
        />
        <span className={styles.lecture}>
          <Icone nom="lecture" taille={28} />
        </span>
        <span className="visuellement-cache">Lire la vidéo : {video.titre}</span>
      </button>
    );
  }

  return (
    <Emplacement
      className={styles.media}
      icone="video"
      titre="Vidéo à ajouter"
      indication="Identifiant YouTube ou fichier vidéo"
      fichier="src/config/videos.ts"
    />
  );
}
