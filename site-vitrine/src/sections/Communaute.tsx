import { communaute, site } from '../config/site';
import { BoutonAction } from '../components/BoutonAction';
import { EnteteSection } from '../components/EnteteSection';
import { Emplacement } from '../components/Emplacement';
import { Icone } from '../components/Icone';
import styles from './Communaute.module.css';

export function Communaute() {
  const photo = site.images.communaute;
  const plateforme = site.plateforme;
  const avecVisuel = Boolean(photo) || site.afficherEmplacements;

  return (
    <section id="communaute" className="section" aria-labelledby="titre-communaute">
      <div className={`conteneur ${styles.grille} ${avecVisuel ? '' : styles.seul}`}>
        <div className={styles.texte}>
          <EnteteSection id="titre-communaute" surtitre="Communauté" titre={communaute.titre} introduction={communaute.introduction} />
          <ul className={styles.piliers}>
            {communaute.piliers.map((p) => (
              <li key={p.titre}>
                <h3>{p.titre}</h3>
                <p>{p.texte}</p>
              </li>
            ))}
          </ul>
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

        {avecVisuel && (
          <div className={styles.visuel}>
          {photo ? (
            <img className={styles.photo} src={photo} alt="La communauté Apprendre la musique" loading="lazy" width={900} height={1100} />
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
    </section>
  );
}
