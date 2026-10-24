import { site } from '../config/site';
import { sectionTemoignages, temoignages } from '../config/temoignages';
import { EnteteSection } from '../components/EnteteSection';
import { Emplacement } from '../components/Emplacement';
import { Icone } from '../components/Icone';
import styles from './Temoignages.module.css';

export function Temoignages() {
  const vide = temoignages.length === 0;
  if (vide && !site.afficherEmplacements) return null;

  return (
    <section id="temoignages" className="section" aria-labelledby="titre-temoignages">
      <div className="conteneur">
        <EnteteSection
          id="titre-temoignages"
          surtitre="Témoignages"
          titre={sectionTemoignages.titre}
          introduction={sectionTemoignages.introduction}
        />
        <ul className={styles.grille}>
          {vide
            ? Array.from({ length: sectionTemoignages.emplacementsApercu }, (_, i) => (
                <li key={i}>
                  <Emplacement
                    className={styles.emplacement}
                    icone="citation"
                    titre={`Témoignage ${i + 1}`}
                    indication="Un vrai témoignage d’élève, avec son accord"
                    fichier="src/config/temoignages.ts"
                  />
                </li>
              ))
            : temoignages.map((t, i) => (
                <li key={`${t.nom}-${i}`} className={styles.carte}>
                  <Icone nom="citation" taille={28} className={styles.guillemets} />
                  <blockquote className={styles.texte}>
                    <p>{t.texte}</p>
                  </blockquote>
                  <div className={styles.auteur}>
                    {t.photo ? (
                      <img src={t.photo} alt="" width={48} height={48} loading="lazy" />
                    ) : (
                      <span className={styles.initiale} aria-hidden="true">
                        {t.nom.charAt(0)}
                      </span>
                    )}
                    <span>
                      <strong>{t.nom}</strong>
                      {t.details && <small>{t.details}</small>}
                    </span>
                  </div>
                </li>
              ))}
        </ul>
      </div>
    </section>
  );
}
