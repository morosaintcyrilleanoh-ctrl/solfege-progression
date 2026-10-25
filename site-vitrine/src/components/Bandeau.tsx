import { accueil } from '../config/site';
import styles from './Bandeau.module.css';

/** Ruban jaune défilant avec les disciplines (texte de config : accueil.disciplines). */
export function Bandeau() {
  const elements = [...accueil.disciplines, ...accueil.disciplines];
  return (
    <div className={styles.bandeau} aria-label={`Disciplines : ${accueil.disciplines.join(', ')}`} role="note">
      <div className={styles.piste} aria-hidden="true">
        {[0, 1].map((copie) => (
          <ul key={copie} className={styles.liste}>
            {elements.map((d, i) => (
              <li key={`${d}-${i}`}>
                <span className={styles.plus}>+</span>
                {d}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
