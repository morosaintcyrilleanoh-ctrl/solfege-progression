import { formations, type Formation } from '../config/formations';
import type { Bouton } from '../config/types';
import { BoutonAction, messagePour } from '../components/BoutonAction';
import { EnteteSection } from '../components/EnteteSection';
import { Icone } from '../components/Icone';
import { href, useRouteur } from '../lib/router';
import styles from './Catalogue.module.css';

/** Un bouton WhatsApp sans message reçoit automatiquement le message de la formation. */
function avecMessage(bouton: Bouton, formation: Formation): Bouton {
  if (bouton.action.type === 'whatsapp' && !bouton.action.message) {
    return { ...bouton, action: { type: 'whatsapp', message: messagePour(formation.id) } };
  }
  return bouton;
}

export function Catalogue() {
  const { naviguer } = useRouteur();
  return (
    <section id="formations" className="section section--grise" aria-labelledby="titre-formations">
      <div className="conteneur">
        <EnteteSection
          id="titre-formations"
          surtitre="Catalogue"
          titre="Les formations"
          introduction="Des formations complémentaires pour progresser étape par étape, des premières notes jusqu’à l’harmonie. En ligne, et en présentiel à Abidjan pour le piano."
        />

        <ul className={styles.grille}>
          {formations.map((f, i) => (
            <li key={f.id} className={styles.carte} id={`formation-${f.id}`}>
              {f.image && <img className={styles.image} src={f.image} alt="" loading="lazy" width={1200} height={750} />}
              <div className={styles.haut}>
                <span className={styles.symbole}>
                  <Icone nom={f.symbole} taille={34} />
                </span>
                <span className={styles.numero} aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <span className="pastille">{f.niveau}</span>
              <h3 className={styles.titre}>
                <a
                  href={href(`/formations/${f.id}`)}
                  onClick={(e) => {
                    e.preventDefault();
                    naviguer(`/formations/${f.id}`);
                  }}
                >
                  {f.titre}
                </a>
              </h3>
              <p className={styles.accroche}>{f.accroche}</p>
              <p className={styles.description}>{f.description}</p>
              <ul className={styles.programme} aria-label={`Programme : ${f.titre}`}>
                {f.programme.map((point) => (
                  <li key={point}>
                    <Icone nom="coche" taille={16} />
                    {point}
                  </li>
                ))}
              </ul>
              <div className={styles.actions}>
                <BoutonAction bouton={avecMessage(f.bouton, f)} taille="petit" icone={<Icone nom="fleche" />} />
                {f.boutonSecondaire && (
                  <BoutonAction bouton={avecMessage(f.boutonSecondaire, f)} variante="contour" taille="petit" />
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
