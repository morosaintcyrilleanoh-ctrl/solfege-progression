import { formations, type Formation as TypeFormation } from '../config/formations';
import { formaterPrix, offresPour } from '../config/offres';
import { site } from '../config/site';
import { BoutonAction, messagePour } from '../components/BoutonAction';
import { BoutonPartage } from '../components/BoutonPartage';
import { Icone } from '../components/Icone';
import { href, useRouteur } from '../lib/router';
import styles from './Formation.module.css';

/** Page détaillée d'une formation : /formations/<id>. */
export function Formation({ formation }: { formation: TypeFormation }) {
  const { naviguer } = useRouteur();
  const autres = formations.filter((f) => f.id !== formation.id);
  const inscription = { libelle: 'Je m’inscris à cette formation', action: { type: 'inscription', formation: formation.id } } as const;

  return (
    <>
      <section className={`sombre ${styles.hero}`} aria-labelledby="titre-formation">
        <div className={`conteneur ${styles.heroContenu}`}>
          <nav className={styles.fil} aria-label="Fil d’Ariane">
            <a href={href('/')} onClick={(e) => { e.preventDefault(); naviguer('/'); }}>Accueil</a>
            <span aria-hidden="true">›</span>
            <a href={href('/#formations')} onClick={(e) => { e.preventDefault(); naviguer('/#formations'); }}>Formations</a>
            <span aria-hidden="true">›</span>
            <span aria-current="page">{formation.titre}</span>
          </nav>
          <span className={styles.symbole}>
            <Icone nom={formation.symbole} taille={40} />
          </span>
          <span className="surtitre">Formation · {formation.niveau}</span>
          <h1 className={styles.titre} id="titre-formation">
            {formation.titre}
          </h1>
          <p className={styles.accroche}>{formation.accroche}</p>
          <p className="intro-section">{formation.description}</p>
          <div className={styles.actions}>
            <BoutonAction bouton={inscription} icone={<Icone nom="fleche" />} />
            <BoutonAction
              bouton={{ libelle: 'Poser une question', action: { type: 'whatsapp', message: messagePour(formation.id) } }}
              variante="contour"
            />
          </div>
          <ul className={styles.infos}>
            <li>
              <strong>Niveau</strong> {formation.niveau}
            </li>
            {formation.format && (
              <li>
                <strong>Format</strong> {formation.format}
              </li>
            )}
            <li>
              <strong>Prérequis</strong> {formation.prerequis}
            </li>
          </ul>
          {!formation.format && site.afficherEmplacements && (
            <p className={styles.note}>
              <span className="badge-apercu">À compléter</span> Durée et format (vidéos, lives, groupe…) : champ <code>format</code> dans{' '}
              <code>src/config/formations.ts</code>.
            </p>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="titre-objectifs">
        <div className={`conteneur ${styles.deuxColonnes}`}>
          <div>
            <span className="surtitre">Objectifs</span>
            <h2 className={styles.sousTitre} id="titre-objectifs">
              À la fin, vous saurez…
            </h2>
            <ul className={styles.objectifs}>
              {formation.objectifs.map((o) => (
                <li key={o}>
                  <span>
                    <Icone nom="coche" taille={16} />
                  </span>
                  {o}
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.encart}>
            <h2 className={styles.encartTitre}>C’est pour vous si…</h2>
            <ul>
              {formation.pourQui.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p className={styles.materiel}>
              <strong>Matériel :</strong> {formation.materiel}
            </p>
          </div>
        </div>
      </section>

      <section className="section section--grise" aria-labelledby="titre-programme">
        <div className="conteneur">
          <span className="surtitre">Programme</span>
          <h2 className={styles.sousTitre} id="titre-programme">
            Ce que vous allez apprendre
          </h2>
          <ol className={styles.programme}>
            {formation.programme.map((p, i) => (
              <li key={p}>
                <span className={styles.numero}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.module}>{p}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="titre-formules">
        <div className="conteneur">
          <div className={`sombre ${styles.cta}`}>
            <span className="surtitre">Inscription</span>
            <h2 className={styles.sousTitre} id="titre-formules">
              Commencez la formation {formation.titre}
            </h2>
            <ul className={styles.formules}>
              {offresPour(formation.id).map((o) => (
                <li key={o.id}>
                  <span className={styles.formuleNom}>
                    <strong>{o.nom}</strong>
                    <small>
                      {o.modalite} · {o.horaires}
                      {o.lieu ? ` · ${o.lieu}` : ''}
                    </small>
                  </span>
                  <span className={styles.formulePrix}>
                    {o.prix ? formaterPrix(o.prix) : 'Tarif sur demande'}
                    {o.prix?.mention && <small>{o.prix.mention}</small>}
                  </span>
                </li>
              ))}
            </ul>
            <div className={styles.actions}>
              <BoutonAction bouton={inscription} icone={<Icone nom="fleche" />} />
              <BoutonAction bouton={{ libelle: 'Comparer les formules', action: { type: 'section', id: 'tarifs' } }} variante="contour" />
            </div>
            <BoutonPartage
              variante="texte"
              chemin={`/formations/${formation.id}`}
              message={`Regarde cette formation « ${formation.titre} » du Formateur Anoh Cyrille :`}
            />
          </div>
        </div>
      </section>

      <section className="section section--grise" aria-labelledby="titre-autres">
        <div className="conteneur">
          <span className="surtitre">À découvrir aussi</span>
          <h2 className={styles.sousTitre} id="titre-autres">
            Les autres formations
          </h2>
          <ul className={styles.autres}>
            {autres.map((f) => (
              <li key={f.id}>
                <a
                  href={href(`/formations/${f.id}`)}
                  onClick={(e) => {
                    e.preventDefault();
                    naviguer(`/formations/${f.id}`);
                  }}
                >
                  <span className={styles.petitSymbole}>
                    <Icone nom={f.symbole} taille={24} />
                  </span>
                  <span>
                    <strong>{f.titre}</strong>
                    <small>{f.accroche}</small>
                  </span>
                  <Icone nom="fleche" taille={18} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
