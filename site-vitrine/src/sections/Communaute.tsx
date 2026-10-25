import { useRef, useState } from 'react';
import { communaute, site } from '../config/site';
import { BoutonAction } from '../components/BoutonAction';
import { EnteteSection } from '../components/EnteteSection';
import { Emplacement } from '../components/Emplacement';
import { Icone, type NomIcone } from '../components/Icone';
import styles from './Communaute.module.css';

const icones: NomIcone[] = ['personnes', 'cle-sol', 'whatsapp', 'oreille'];

export function Communaute() {
  const photo = site.images.communaute;
  const plateforme = site.plateforme;
  const piste = useRef<HTMLUListElement>(null);
  const [progression, setProgression] = useState(0);

  // Barre de progression du carrousel (téléphone)
  const surDefilement = () => {
    const el = piste.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgression(max > 0 ? el.scrollLeft / max : 0);
  };

  return (
    <section id="communaute" className="section" aria-labelledby="titre-communaute">
      <div className="conteneur">
        <div className={styles.haut}>
          <EnteteSection id="titre-communaute" surtitre="Communauté" titre={communaute.titre} introduction={communaute.introduction} />
          {(photo || site.afficherEmplacements) && (
            <div className={styles.visuel}>
              {photo ? (
                <img className={styles.photo} src={photo} alt="La communauté Apprendre la musique" loading="lazy" width={1200} height={800} />
              ) : (
                <Emplacement
                  className={styles.photo}
                  titre="Photo de la communauté"
                  indication="Un cours, un groupe d’élèves, un concert…"
                  fichier="site.images.communaute"
                />
              )}
            </div>
          )}
        </div>

        <ul className={styles.piliers} ref={piste} onScroll={surDefilement}>
          {communaute.piliers.map((p, i) => (
            <li key={p.titre} className={styles.pilier}>
              <div className={styles.pilierHaut}>
                <span className={styles.icone}>
                  <Icone nom={icones[i % icones.length] ?? 'personnes'} taille={24} />
                </span>
              </div>
              <h3>{p.titre}</h3>
              <p>{p.texte}</p>
            </li>
          ))}
        </ul>
        <div className={styles.barre} aria-hidden="true">
          <span style={{ width: `${Math.max(18, progression * 100)}%` }} />
        </div>

        <div className={styles.actions}>
          <BoutonAction bouton={communaute.bouton} icone={<Icone nom="personnes" />} />
          {plateforme.url && (
            <BoutonAction
              bouton={{ libelle: plateforme.libelle, action: { type: 'lien', url: plateforme.url, nouvelOnglet: true } }}
              variante="contour"
            />
          )}
        </div>
      </div>
    </section>
  );
}
