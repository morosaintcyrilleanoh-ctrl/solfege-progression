import { difficultes, pourQui } from '../config/conversion';
import { EnteteSection } from '../components/EnteteSection';
import { Icone } from '../components/Icone';
import styles from './PourQui.module.css';

/** « Pour qui ? » + « Vos difficultés, nos solutions ». */
export function PourQui() {
  return (
    <section id="pour-qui" className="section" aria-labelledby="titre-pour-qui">
      <div className="conteneur">
        <EnteteSection id="titre-pour-qui" surtitre="Pour qui ?" titre={pourQui.titre} />
        <div className={styles.colonnes}>
          <div className={`${styles.colonne} ${styles.oui}`}>
            <h3>C’est pour vous si…</h3>
            <ul>
              {pourQui.pourVous.map((ligne) => (
                <li key={ligne}>
                  <span className={styles.puceOui}>
                    <Icone nom="coche" taille={14} />
                  </span>
                  {ligne}
                </li>
              ))}
            </ul>
          </div>
          <div className={`${styles.colonne} ${styles.non}`}>
            <h3>Ce n’est pas pour vous si…</h3>
            <ul>
              {pourQui.pasPourVous.map((ligne) => (
                <li key={ligne}>
                  <span className={styles.puceNon}>
                    <Icone nom="croix" taille={14} />
                  </span>
                  {ligne}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.difficultes}>
          <EnteteSection surtitre="Problème → solution" titre={difficultes.titre} introduction={difficultes.introduction} />
          <ul className={styles.liste}>
            {difficultes.liste.map((d) => (
              <li key={d.probleme} className={styles.ligne}>
                <p className={styles.probleme}>
                  <span aria-hidden="true">«</span> {d.probleme} <span aria-hidden="true">»</span>
                </p>
                <span className={styles.vers} aria-hidden="true">
                  <Icone nom="fleche" taille={18} />
                </span>
                <p className={styles.solution}>{d.solution}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
