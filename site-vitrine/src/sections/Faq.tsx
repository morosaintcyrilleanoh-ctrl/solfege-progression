import { site } from '../config/site';
import { faq, sectionFaq } from '../config/faq';
import { EnteteSection } from '../components/EnteteSection';
import styles from './Faq.module.css';

export function Faq() {
  const questions = site.afficherEmplacements ? faq : faq.filter((q) => q.reponse);
  if (questions.length === 0) return null;

  return (
    <section id="faq" className="section section--grise" aria-labelledby="titre-faq">
      <div className={`conteneur ${styles.grille}`}>
        <EnteteSection id="titre-faq" surtitre="FAQ" titre={sectionFaq.titre} />
        <div className={styles.liste}>
          {questions.map((q, i) => (
            <details key={q.question} className={styles.question} open={i === 0}>
              <summary>
                <span>{q.question}</span>
                <span className={styles.signe} aria-hidden="true" />
              </summary>
              <div className={styles.reponse}>
                {q.reponse ? (
                  <p>{q.reponse}</p>
                ) : (
                  <p>
                    <span className="badge-apercu">À compléter</span> Réponse à rédiger dans <code>src/config/faq.ts</code>.
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
