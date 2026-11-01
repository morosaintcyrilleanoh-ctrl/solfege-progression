import { useEffect, useState, type FormEvent } from 'react';
import { etatMasterclass, lienAgenda, masterclass } from '../config/masterclass';
import { trouverOffre } from '../config/offres';
import { site } from '../config/site';
import { BoutonAction } from '../components/BoutonAction';
import { BoutonPartage } from '../components/BoutonPartage';
import { CompteARebours } from '../components/CompteARebours';
import { Icone } from '../components/Icone';
import { lienWhatsApp } from '../lib/whatsapp';
import styles from './Masterclass.module.css';

const pays = ['Côte d’Ivoire', 'Sénégal', 'Cameroun', 'Bénin', 'Burkina Faso', 'Mali', 'Togo', 'Guinée', 'Gabon', 'Congo', 'RD Congo', 'Centrafrique', 'France', 'Autre pays'];

/** Page de la masterclass gratuite : /masterclass */
export function Masterclass() {
  const [etat, setEtat] = useState(etatMasterclass);
  const [inscrit, setInscrit] = useState<{ prenom: string; lien: string | null } | null>(null);
  const [erreur, setErreur] = useState('');
  const programme = trouverOffre('partition-60-jours');

  // L'état (à venir / en direct / terminé) se met à jour tout seul.
  useEffect(() => {
    const minuteur = window.setInterval(() => setEtat(etatMasterclass()), 30_000);
    return () => window.clearInterval(minuteur);
  }, []);

  function reserver(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const donnees = new FormData(e.currentTarget);
    const prenom = String(donnees.get('prenom') ?? '').trim();
    const paysChoisi = String(donnees.get('pays') ?? '');
    if (prenom.length < 2) {
      setErreur('Indiquez votre prénom.');
      return;
    }
    setErreur('');
    const lignes = [
      `Bonjour Formateur ${site.formateur}, je réserve ma place pour la masterclass gratuite « ${masterclass.titre} » du ${masterclass.dateTexte.toLowerCase()} à 20 h 30.`,
      '',
      `Prénom : ${prenom}`,
    ];
    if (paysChoisi) lignes.push(`Pays : ${paysChoisi}`);
    const message = lignes.join('\n');
    const lien = lienWhatsApp(message);
    if (lien) window.open(lien, '_blank', 'noopener');
    setInscrit({ prenom, lien });
    requestAnimationFrame(() => document.getElementById('reserver')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  const boutonReserver = masterclass.lienGroupe ? (
    <a className="btn" href={masterclass.lienGroupe} target="_blank" rel="noopener noreferrer">
      <Icone nom="whatsapp" /> Réserver ma place gratuite
    </a>
  ) : (
    <a className="btn" href="#reserver">
      Réserver ma place gratuite <Icone nom="fleche" />
    </a>
  );

  return (
    <>
      {/* ---------- Haut de page ---------- */}
      <section className={`sombre ${styles.hero}`} aria-labelledby="titre-masterclass">
        <div className={`conteneur ${styles.heroGrille}`}>
          <div className={styles.heroTexte}>
            <div className={styles.badges}>
              <span className={styles.badgeGratuit}>Masterclass 100 % gratuite</span>
              {etat === 'en-direct' && <span className={styles.badgeDirect}>● En direct maintenant</span>}
            </div>
            <h1 id="titre-masterclass" className={styles.titre}>
              {masterclass.titre}
            </h1>
            <p className="intro-section">{masterclass.accroche}</p>
            <ul className={styles.infos}>
              <li>
                <Icone nom="calendrier" /> {masterclass.dateTexte}
              </li>
              <li>
                <Icone nom="horloge" /> {masterclass.heureTexte}
              </li>
              <li>
                <Icone nom="lecture" /> {masterclass.plateforme}
              </li>
            </ul>

            {etat === 'a-venir' && (
              <>
                <CompteARebours jusqua={masterclass.debut} />
                <div className={styles.actions}>
                  {boutonReserver}
                  <a className="btn btn--contour" href={lienAgenda()} target="_blank" rel="noopener noreferrer">
                    <Icone nom="calendrier" /> Ajouter à mon agenda
                  </a>
                </div>
              </>
            )}
            {etat === 'en-direct' && (
              <div className={styles.actions}>
                {masterclass.lienYoutube ? (
                  <a className="btn" href={masterclass.lienYoutube} target="_blank" rel="noopener noreferrer">
                    <Icone nom="lecture" /> Rejoindre le direct sur YouTube
                  </a>
                ) : (
                  boutonReserver
                )}
              </div>
            )}
            {etat === 'termine' && (
              <div className={styles.actions}>
                {(masterclass.lienReplay || masterclass.lienYoutube) && (
                  <a className="btn btn--contour" href={masterclass.lienReplay || masterclass.lienYoutube} target="_blank" rel="noopener noreferrer">
                    <Icone nom="lecture" /> Voir le replay
                  </a>
                )}
                <BoutonAction bouton={{ libelle: 'Continuer avec le programme 60 jours', action: { type: 'page', chemin: '/formations/solfege' } }} />
              </div>
            )}
          </div>

          <figure className={styles.affiche}>
            <img src={masterclass.affiche} alt={`Affiche : masterclass gratuite, ${masterclass.titre}`} width={800} height={800} />
          </figure>
        </div>
      </section>

      {/* ---------- Le problème ---------- */}
      <section className="section" aria-labelledby="titre-probleme">
        <div className={`conteneur ${styles.deux}`}>
          <div>
            <span className="surtitre">Vous vous reconnaissez ?</span>
            <h2 className="titre-section" id="titre-probleme">
              Devant une vraie partition…
            </h2>
            <ul className={styles.problemes}>
              {masterclass.problemes.map((p) => (
                <li key={p}>
                  <span aria-hidden="true">
                    <Icone nom="croix" taille={14} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.encartNoir}>
            <h3>Pendant la masterclass, vous allez :</h3>
            <ul>
              {masterclass.benefices.map((b) => (
                <li key={b}>
                  <span aria-hidden="true">
                    <Icone nom="coche" taille={14} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- La méthode UN PAS ---------- */}
      <section className="section section--grise" aria-labelledby="titre-methode">
        <div className="conteneur">
          <span className="surtitre">La méthode du formateur</span>
          <h2 className="titre-section" id="titre-methode">
            Avancer <span className={styles.surligne}>un pas</span> après l’autre
          </h2>
          <ol className={styles.methode}>
            {masterclass.methode.map((m) => (
              <li key={m.lettre}>
                <span className={styles.lettre}>{m.lettre}</span>
                <strong>{m.titre}</strong>
                <small>{m.texte}</small>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Vidéo + formateur ---------- */}
      <section className="section" aria-labelledby="titre-video-masterclass">
        <div className={`conteneur ${styles.deux}`}>
          <div className={styles.video}>
            <video src={masterclass.video} poster={masterclass.poster} controls playsInline preload="none" />
          </div>
          <div className={styles.formateur}>
            <span className="surtitre">En 1 minute</span>
            <h2 className="titre-section" id="titre-video-masterclass">
              Avec le Formateur Anoh Cyrille
            </h2>
            <p className="intro-section">Musicien, formateur et pédagogue, professeur de musique à l’INSAAC.</p>
            <p className={styles.ouvert}>
              <strong>Ouvert à tous :</strong> {masterclass.ouvertA}
            </p>
            <p className={styles.ouvert}>{masterclass.aApporter}</p>
          </div>
        </div>
      </section>

      {/* ---------- Réservation ---------- */}
      <section id="reserver" className="section section--grise" aria-labelledby="titre-reserver">
        <div className={`conteneur ${styles.reserverConteneur}`}>
          <div className={styles.carteReserver}>
            {etat === 'termine' ? (
              <>
                <h2 className={styles.carteTitre} id="titre-reserver">
                  La masterclass est terminée
                </h2>
                <p>Merci à tous les participants ! Pour aller plus loin, rejoignez le programme « Lire une partition musicale en 60 jours ».</p>
                <BoutonAction bouton={{ libelle: 'Découvrir le programme 60 jours', action: { type: 'page', chemin: '/formations/solfege' } }} large />
              </>
            ) : inscrit ? (
              <>
                <span className={styles.ok}>
                  <Icone nom="coche" taille={28} />
                </span>
                <h2 className={styles.carteTitre} id="titre-reserver">
                  Merci {inscrit.prenom}, plus qu’une étape !
                </h2>
                <ol className={styles.etapes}>
                  {inscrit.lien && (
                    <li>
                      <strong>Envoyez le message WhatsApp</strong> qui vient de s’ouvrir : il confirme votre place auprès du formateur.
                      <a className="btn btn--noir btn--large" href={inscrit.lien} target="_blank" rel="noopener noreferrer">
                        <Icone nom="whatsapp" /> Ouvrir WhatsApp à nouveau
                      </a>
                    </li>
                  )}
                  <li>
                    <strong>Ajoutez la date à votre agenda</strong> pour ne pas oublier.
                    <a className="btn btn--contour btn--large" href={lienAgenda()} target="_blank" rel="noopener noreferrer">
                      <Icone nom="calendrier" /> Ajouter à mon agenda
                    </a>
                  </li>
                  <li>
                    <strong>Le jour J</strong>, le lien du direct YouTube vous sera envoyé.
                  </li>
                </ol>
                <BoutonPartage
                  variante="texte"
                  chemin="/masterclass"
                  libelle="Inviter un ami à la masterclass"
                  message={`Masterclass gratuite « ${masterclass.titre} » avec le Formateur Anoh Cyrille, ${masterclass.dateTexte.toLowerCase()} à 20 h 30 sur YouTube :`}
                />
              </>
            ) : masterclass.lienGroupe ? (
              <>
                <h2 className={styles.carteTitre} id="titre-reserver">
                  Réservez votre place gratuite
                </h2>
                <p>Rejoignez le groupe WhatsApp de la masterclass pour recevoir le lien du direct.</p>
                <a className="btn btn--large" href={masterclass.lienGroupe} target="_blank" rel="noopener noreferrer">
                  <Icone nom="whatsapp" /> Rejoindre le groupe de la masterclass
                </a>
              </>
            ) : (
              <form onSubmit={reserver} noValidate className={styles.formulaire}>
                <h2 className={styles.carteTitre} id="titre-reserver">
                  Réservez votre place gratuite
                </h2>
                <p>Deux informations suffisent. Votre réservation est envoyée au formateur sur WhatsApp.</p>
                <label htmlFor="mc-prenom">Votre prénom</label>
                <input
                  id="mc-prenom"
                  name="prenom"
                  type="text"
                  autoComplete="given-name"
                  aria-invalid={erreur ? true : undefined}
                  aria-describedby={erreur ? 'mc-erreur' : undefined}
                />
                {erreur && (
                  <span id="mc-erreur" className={styles.erreur}>
                    {erreur}
                  </span>
                )}
                <label htmlFor="mc-pays">Votre pays (facultatif)</label>
                <select id="mc-pays" name="pays" defaultValue="">
                  <option value="">Choisir…</option>
                  {pays.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
                <button type="submit" className="btn btn--large">
                  <Icone nom="whatsapp" /> Réserver ma place gratuite
                </button>
                <small>100 % gratuit · sans engagement</small>
              </form>
            )}
          </div>

          {programme && etat !== 'termine' && (
            <aside className={styles.suite}>
              <span className="surtitre">Et après ?</span>
              <h3>Le programme « {programme.nom} »</h3>
              <p>
                Pour aller plus loin après la masterclass : {programme.periode?.toLowerCase()}, {programme.horaires.toLowerCase()}, en
                ligne.
              </p>
              <BoutonAction bouton={{ libelle: 'Voir le programme', action: { type: 'page', chemin: '/formations/solfege' } }} variante="contour" />
            </aside>
          )}
        </div>
      </section>
    </>
  );
}
