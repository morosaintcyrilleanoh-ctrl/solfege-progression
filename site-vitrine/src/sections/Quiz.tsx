import { useState } from 'react';
import { formations } from '../config/formations';
import { quiz, sectionQuiz } from '../config/quiz';
import { site } from '../config/site';
import { BoutonAction, messagePour } from '../components/BoutonAction';
import { EnteteSection } from '../components/EnteteSection';
import { Icone } from '../components/Icone';
import styles from './Quiz.module.css';

const lettres = 'ABCDEFGH';

/** Calcule la formation recommandée à partir des réponses (index choisi par question). */
function recommander(choix: number[]) {
  const scores = new Map<string, number>();
  choix.forEach((indexReponse, indexQuestion) => {
    const points = quiz[indexQuestion]?.reponses[indexReponse]?.points ?? {};
    for (const [id, valeur] of Object.entries(points)) scores.set(id, (scores.get(id) ?? 0) + valeur);
  });
  // À égalité, l'ordre du catalogue départage (du plus fondamental au plus avancé).
  let meilleure = formations[0];
  for (const f of formations) {
    if ((scores.get(f.id) ?? 0) > (scores.get(meilleure?.id ?? '') ?? 0)) meilleure = f;
  }
  return meilleure;
}

export function Quiz() {
  const [choix, setChoix] = useState<number[]>([]);
  const etape = choix.length;
  const termine = etape >= quiz.length;
  const question = quiz[etape];
  const resultat = termine ? recommander(choix) : undefined;

  return (
    <section id="quiz" className="section" aria-labelledby="titre-quiz">
      <div className={`conteneur ${styles.grille}`}>
        <EnteteSection id="titre-quiz" surtitre="Orientation gratuite" titre={sectionQuiz.titre} introduction={sectionQuiz.introduction} />

        <div className={styles.carte} aria-live="polite">
          {!termine && question && (
            <>
              <div className={styles.haut}>
                <span className={styles.compteur}>
                  Question {etape + 1} / {quiz.length}
                </span>
                {etape > 0 && (
                  <button type="button" className={styles.retour} onClick={() => setChoix(choix.slice(0, -1))}>
                    ← Retour
                  </button>
                )}
              </div>
              <div className={styles.barre} aria-hidden="true">
                <span style={{ width: `${(etape / quiz.length) * 100}%` }} />
              </div>
              <h3 className={styles.question} key={etape}>
                {question.question}
              </h3>
              <div className={styles.reponses}>
                {question.reponses.map((r, i) => (
                  <button key={r.libelle} type="button" className={styles.reponse} onClick={() => setChoix([...choix, i])}>
                    <span className={styles.lettre} aria-hidden="true">
                      {lettres[i]}
                    </span>
                    {r.libelle}
                    <Icone nom="fleche" taille={18} className={styles.fleche} />
                  </button>
                ))}
              </div>
            </>
          )}

          {termine && resultat && (
            <div className={styles.resultat}>
              <span className="pastille">
                <Icone nom="ampoule" taille={16} /> Notre recommandation
              </span>
              <div className={styles.resultatTitre}>
                <span className={styles.symbole}>
                  <Icone nom={resultat.symbole} taille={34} />
                </span>
                <div>
                  <h3>{resultat.titre}</h3>
                  <p>{resultat.accroche}</p>
                </div>
              </div>
              <p className={styles.description}>{resultat.description}</p>
              <div className={styles.actions}>
                <BoutonAction
                  bouton={{ libelle: `Je m’inscris en ${resultat.titre}`, action: { type: 'inscription', formation: resultat.id } }}
                  large
                  icone={<Icone nom="fleche" />}
                />
                <BoutonAction
                  bouton={{ libelle: 'Voir le programme', action: { type: 'page', chemin: `/formations/${resultat.id}` } }}
                  variante="contour"
                  large
                />
              </div>
              <div className={styles.liens}>
                <BoutonAction
                  bouton={{ libelle: 'En parler au formateur', action: { type: 'whatsapp', message: messagePour(resultat.id) } }}
                  variante="contour"
                  taille="petit"
                />
                {site.plateforme.testNiveau && (
                  <BoutonAction
                    bouton={{ libelle: 'Tester mon niveau gratuitement', action: { type: 'lien', url: site.plateforme.testNiveau, nouvelOnglet: true } }}
                    variante="contour"
                    taille="petit"
                  />
                )}
                <button type="button" className={styles.recommencer} onClick={() => setChoix([])}>
                  Refaire le quiz
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
