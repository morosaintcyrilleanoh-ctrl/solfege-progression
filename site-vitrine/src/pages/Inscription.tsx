import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { formations, trouverFormation } from '../config/formations';
import { aLienPaiement, formaterPrix, offresPour, trouverOffre } from '../config/offres';
import { site } from '../config/site';
import { Icone } from '../components/Icone';
import { Logo } from '../components/Logo';
import { href, useRouteur } from '../lib/router';
import { nouvelleReference } from '../lib/reference';
import { canalInscription, envoyerInscription, memoriserDemande, type DemandeInscription } from '../services/inscription';
import { demarrerPaiement, paiementEnLigneDisponible } from '../services/paiement';
import styles from './Formulaire.module.css';

const pays = [
  'Côte d’Ivoire', 'Sénégal', 'Cameroun', 'Bénin', 'Burkina Faso', 'Mali', 'Togo', 'Guinée', 'Niger', 'Gabon',
  'Congo', 'RD Congo', 'Tchad', 'Centrafrique', 'Madagascar', 'Burundi', 'Rwanda', 'Djibouti', 'Comores',
  'Mauritanie', 'Maroc', 'Algérie', 'Tunisie', 'Haïti', 'France', 'Belgique', 'Suisse', 'Canada',
];

const etapes = ['Votre formation', 'Votre formule', 'Vos coordonnées', 'Paiement'] as const;
const lettres = 'ABCDEFGHIJ';

type Erreurs = Partial<Record<'nom' | 'telephone' | 'email' | 'consentement' | 'envoi', string>>;

/** Parcours d'inscription en 4 étapes, une question par écran. */
export function Inscription() {
  const { recherche, naviguer } = useRouteur();
  const id = useId();
  const haut = useRef<HTMLDivElement>(null);
  const formationParam = trouverFormation(recherche.get('formation'))?.id;
  const offreParam = trouverOffre(recherche.get('offre'))?.id;

  // L'écran d'accueil n'apparaît que si l'élève n'a pas déjà choisi une formation ou une offre.
  const [etape, setEtape] = useState(formationParam || offreParam ? 1 : 0);
  const [formation, setFormation] = useState<string | null>(formationParam ?? (offreParam ? '' : null));
  const [offre, setOffre] = useState<string | null>(offreParam ?? null);
  const [coordonnees, setCoordonnees] = useState({ nom: '', telephone: '', email: '', pays: '' });
  const [moyen, setMoyen] = useState<DemandeInscription['moyenPaiement'] | null>(null);
  const [message, setMessage] = useState('');
  const [consentement, setConsentement] = useState(false);
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [envoi, setEnvoi] = useState(false);

  const offreChoisie = trouverOffre(offre);
  const canal = canalInscription();
  const paiementPossible = paiementEnLigneDisponible() && Boolean(offreChoisie?.prix) && (moyen === 'mobile-money' || moyen === 'carte');

  useEffect(() => {
    haut.current?.scrollIntoView({ block: 'start' });
    window.scrollTo({ top: 0 });
  }, [etape]);

  const peutContinuer = etape === 1 ? formation !== null : etape === 2 ? offre !== null : etape === 4 ? moyen !== null : true;

  function validerCoordonnees() {
    const e: Erreurs = {};
    if (coordonnees.nom.trim().length < 2) e.nom = 'Indiquez votre nom complet.';
    if (coordonnees.telephone.replace(/\D/g, '').length < 8) e.telephone = 'Indiquez un numéro valide, avec l’indicatif du pays.';
    if (coordonnees.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(coordonnees.email.trim())) e.email = 'Cette adresse e-mail semble incorrecte.';
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  async function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (etape < 4) {
      if (!peutContinuer) return;
      if (etape === 3 && !validerCoordonnees()) {
        e.currentTarget.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
        return;
      }
      setErreurs({});
      setEtape(etape + 1);
      return;
    }

    if (!moyen) return;
    if (!consentement) {
      setErreurs({ consentement: 'Cochez cette case pour que le formateur puisse vous recontacter.' });
      return;
    }

    const demande: DemandeInscription = {
      reference: nouvelleReference(),
      nom: coordonnees.nom.trim(),
      telephone: coordonnees.telephone.trim(),
      email: coordonnees.email.trim(),
      pays: coordonnees.pays,
      formation: trouverFormation(formation)?.titre ?? (formation === '' ? 'Je ne sais pas encore' : ''),
      offre: offreChoisie?.nom ?? 'À définir avec le formateur',
      moyenPaiement: moyen,
      message: message.trim(),
    };

    // 1) Paiement en ligne, s'il est activé (redirection vers le prestataire).
    if (paiementPossible && (moyen === 'mobile-money' || moyen === 'carte')) {
      setEnvoi(true);
      memoriserDemande(demande);
      const resultat = await demarrerPaiement({
        reference: demande.reference,
        formationId: formation || undefined,
        offreId: offre || undefined,
        moyen,
        client: { nom: demande.nom, telephone: demande.telephone, email: demande.email, pays: demande.pays },
      });
      if (resultat.statut === 'redirection') {
        window.location.assign(resultat.url);
        return;
      }
      setEnvoi(false);
      setErreurs({ envoi: `${resultat.raison} Choisissez « À définir avec le formateur » pour envoyer votre demande sans payer en ligne.` });
      return;
    }

    // 2) Demande d'inscription classique.
    const resultat = envoyerInscription(demande);
    if (!(resultat instanceof Promise)) {
      if (resultat.canal === 'whatsapp') {
        memoriserDemande(demande, resultat.url);
        window.open(resultat.url, '_blank', 'noopener');
        naviguer(`/confirmation?statut=inscription-whatsapp&ref=${demande.reference}`);
      } else {
        memoriserDemande(demande);
        naviguer(`/confirmation?statut=apercu&ref=${demande.reference}`);
      }
      return;
    }

    setEnvoi(true);
    try {
      await resultat;
      memoriserDemande(demande);
      naviguer(`/confirmation?statut=inscription-envoyee&ref=${demande.reference}`);
    } catch {
      setErreurs({ envoi: 'L’envoi n’a pas abouti. Vérifiez votre connexion puis réessayez.' });
    } finally {
      setEnvoi(false);
    }
  }

  const quitter = () => naviguer('/');

  // ---------- Écran d'accueil ----------
  if (etape === 0) {
    return (
      <div className={styles.page}>
        <div className={`sombre ${styles.intro}`}>
          <div className={`conteneur ${styles.introContenu}`}>
            <div className={styles.introBarre}>
              <a href={href('/')} onClick={(e) => { e.preventDefault(); quitter(); }} className={styles.introLogo}>
                <Logo />
              </a>
              <BoutonFermer onClick={quitter} />
            </div>
            <span className="surtitre">Inscription</span>
            <h1 className={styles.introTitre}>Choisissez votre formation, le formateur vous répond.</h1>
            <p className="intro-section">
              Quelques questions simples pour préparer votre inscription. Le {site.titreFormateur} vous recontacte pour la
              confirmer.
            </p>
          </div>
        </div>
        <div className={`conteneur ${styles.introCarte}`}>
          <span className="pastille">4 étapes · environ 2 min</span>
          <ul className={styles.introEtapes}>
            {etapes.map((nom, i) => (
              <li key={nom}>
                <span>{i + 1}</span>
                {nom}
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn--large" onClick={() => setEtape(1)}>
            Démarrer ma demande <Icone nom="fleche" />
          </button>
        </div>
      </div>
    );
  }

  // ---------- Étapes 1 à 4 ----------
  return (
    <form className={styles.page} onSubmit={soumettre} noValidate>
      <div ref={haut} className={styles.progression}>
        <div className={`conteneur ${styles.progressionContenu}`}>
          <div className={styles.progressionTexte}>
            <div className={styles.barre} aria-hidden="true">
              <span style={{ width: `${(etape / etapes.length) * 100}%` }} />
            </div>
            <span className={styles.etapeLibelle}>
              Étape {etape} / {etapes.length} · {etapes[etape - 1]}
            </span>
          </div>
          <BoutonFermer onClick={quitter} />
        </div>
      </div>

      <div className={`conteneur ${styles.corps}`} key={etape}>
        {etape === 1 && (
          <Question titre="Bonjour ! Quelle formation vous intéresse ?" aide="Choisissez celle qui vous correspond le plus : on affinera ensemble.">
            <Options
              nom="formation"
              valeur={formation}
              onChange={(v) => {
                setFormation(v);
                if (offre && v && !trouverOffre(offre)?.formations.includes(v)) setOffre(null);
              }}
              options={[
                ...formations.map((f) => ({ valeur: f.id, libelle: f.titre, detail: `${f.niveau} · ${f.accroche}` })),
                { valeur: '', libelle: 'Je ne sais pas encore', detail: 'Le formateur vous conseille' },
              ]}
            />
          </Question>
        )}

        {etape === 2 && (
          <Question titre="Quelle formule vous convient ?" aide="Horaires à l’heure d’Abidjan (GMT). Le formateur confirme votre place.">
            <Options
              nom="offre"
              valeur={offre}
              onChange={setOffre}
              options={[
                ...offresPour(formation).map((o) => ({
                  valeur: o.id,
                  libelle: o.nom,
                  detail: [o.prix && `${formaterPrix(o.prix)} ${o.prix.mention ?? ''}`.trim(), o.modalite, o.horaires].filter(Boolean).join(' · '),
                  badge: o.recommandee ? 'Programme phare' : undefined,
                })),
                { valeur: '', libelle: 'À définir avec le formateur', detail: 'Vous en discuterez ensemble' },
              ]}
            />
            {aLienPaiement(offreChoisie) && (
              <div className={styles.paiementDirect}>
                <p>
                  <strong>Vous pouvez payer tout de suite</strong> et réserver votre place en ligne (Mobile Money ou carte), ou
                  continuer pour envoyer votre demande au formateur.
                </p>
                {offreChoisie.notePaiement && <small>{offreChoisie.notePaiement}</small>}
                <a className="btn btn--large" href={offreChoisie.lienPaiement}>
                  {offreChoisie.libellePaiement ?? 'Payer et réserver ma place'}
                  {offreChoisie.prix ? ` · ${formaterPrix(offreChoisie.prix)}` : ''}
                  <Icone nom="fleche" />
                </a>
              </div>
            )}
          </Question>
        )}

        {etape === 3 && (
          <Question titre="Comment vous joindre ?" aide="Le formateur vous recontacte sur ce numéro, de préférence par WhatsApp.">
            <div className={styles.champs}>
              <Champ id={`${id}-nom`} libelle="Nom complet" requis erreur={erreurs.nom}>
                <input
                  id={`${id}-nom`}
                  type="text"
                  autoComplete="name"
                  value={coordonnees.nom}
                  onChange={(e) => setCoordonnees({ ...coordonnees, nom: e.target.value })}
                  aria-invalid={erreurs.nom ? true : undefined}
                  aria-describedby={erreurs.nom ? `${id}-nom-erreur` : undefined}
                />
              </Champ>
              <Champ id={`${id}-telephone`} libelle="Téléphone / WhatsApp" requis erreur={erreurs.telephone}>
                <input
                  id={`${id}-telephone`}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+225 …"
                  value={coordonnees.telephone}
                  onChange={(e) => setCoordonnees({ ...coordonnees, telephone: e.target.value })}
                  aria-invalid={erreurs.telephone ? true : undefined}
                  aria-describedby={erreurs.telephone ? `${id}-telephone-erreur` : undefined}
                />
              </Champ>
              <Champ id={`${id}-email`} libelle="E-mail (facultatif)" erreur={erreurs.email}>
                <input
                  id={`${id}-email`}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={coordonnees.email}
                  onChange={(e) => setCoordonnees({ ...coordonnees, email: e.target.value })}
                  aria-invalid={erreurs.email ? true : undefined}
                  aria-describedby={erreurs.email ? `${id}-email-erreur` : undefined}
                />
              </Champ>
              <Champ id={`${id}-pays`} libelle="Pays">
                <select id={`${id}-pays`} value={coordonnees.pays} onChange={(e) => setCoordonnees({ ...coordonnees, pays: e.target.value })}>
                  <option value="">Choisir…</option>
                  {pays.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                  <option>Autre pays</option>
                </select>
              </Champ>
            </div>
          </Question>
        )}

        {etape === 4 && (
          <Question titre="Comment souhaitez-vous régler ?" aide="Indiquez votre préférence : rien n’est prélevé à cette étape.">
            <Options
              nom="moyen"
              valeur={moyen}
              onChange={(v) => setMoyen(v as DemandeInscription['moyenPaiement'])}
              options={[
                { valeur: 'mobile-money', libelle: 'Mobile Money', detail: 'Orange, MTN, Moov, Wave…' },
                { valeur: 'carte', libelle: 'Carte bancaire', detail: 'Visa, Mastercard' },
                { valeur: 'a-definir', libelle: 'À définir avec le formateur', detail: 'Vous en discuterez ensemble' },
              ]}
            />
            {!paiementEnLigneDisponible() && (
              <p className={styles.info}>
                Le paiement en ligne n’est pas encore activé : aucun paiement ne vous sera demandé sur ce site. Le formateur vous
                indiquera comment régler.
              </p>
            )}
            <Champ id={`${id}-message`} libelle="Un message pour le formateur ? (facultatif)">
              <textarea
                id={`${id}-message`}
                rows={3}
                placeholder="Votre niveau, vos objectifs, vos questions…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </Champ>
            <div className={styles.champ}>
              <label className={styles.case}>
                <input
                  type="checkbox"
                  checked={consentement}
                  onChange={(e) => setConsentement(e.target.checked)}
                  aria-invalid={erreurs.consentement ? true : undefined}
                  aria-describedby={erreurs.consentement ? `${id}-consentement-erreur` : undefined}
                />
                <span>J’accepte que le formateur me recontacte au sujet de cette demande.</span>
              </label>
              {erreurs.consentement && (
                <span className={styles.erreur} id={`${id}-consentement-erreur`}>
                  {erreurs.consentement}
                </span>
              )}
            </div>
            {erreurs.envoi && (
              <p className={styles.erreurEnvoi} role="alert">
                {erreurs.envoi}
              </p>
            )}
            <p className={styles.mention}>
              {canal === 'whatsapp' && !paiementPossible && 'Votre demande s’ouvrira dans WhatsApp : il vous suffira de l’envoyer.'}
              {canal === 'serveur' && !paiementPossible && 'Votre demande est transmise directement au formateur.'}
              {canal === 'apercu' && (
                <>
                  <span className="badge-apercu">Mode aperçu</span> Aucun envoi n’est configuré : la demande ne sera transmise à
                  personne.
                </>
              )}
            </p>
          </Question>
        )}
      </div>

      {/* Barre d'action fixée en bas de l'écran */}
      <div className={styles.pied}>
        <div className={`conteneur ${styles.piedContenu}`}>
          {etape > 1 && (
            <button type="button" className={`btn btn--contour ${styles.retour}`} onClick={() => setEtape(etape - 1)}>
              <Icone nom="fleche" style={{ transform: 'rotate(180deg)' }} />
              <span className="visuellement-cache">Étape précédente</span>
            </button>
          )}
          <button type="submit" className={`btn btn--noir ${styles.suivant}`} disabled={!peutContinuer || envoi}>
            {etape < 4 ? 'Suivant' : envoi ? 'Envoi en cours…' : paiementPossible ? 'Continuer vers le paiement' : 'Envoyer ma demande'}
            {!envoi && <Icone nom={etape === 4 && canal === 'whatsapp' && !paiementPossible ? 'whatsapp' : 'fleche'} />}
          </button>
        </div>
      </div>
    </form>
  );
}

function BoutonFermer({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={styles.fermer} onClick={onClick}>
      <Icone nom="fermer" taille={20} />
      <span className="visuellement-cache">Quitter l’inscription</span>
    </button>
  );
}

function Question({ titre, aide, children }: { titre: string; aide: string; children: ReactNode }) {
  return (
    <fieldset className={styles.question}>
      <legend className={styles.questionTitre}>{titre}</legend>
      <p className={styles.aide}>{aide}</p>
      {children}
    </fieldset>
  );
}

type Option = { valeur: string; libelle: string; detail?: string; badge?: string };

/** Options lettrées A, B, C… avec pastille de sélection. */
function Options({ nom, valeur, onChange, options }: { nom: string; valeur: string | null; onChange: (v: string) => void; options: Option[] }) {
  return (
    <div className={styles.options}>
      {options.map((o, i) => (
        <label key={o.valeur || 'aucun'} className={`${styles.option} ${valeur === o.valeur ? styles.optionActive : ''}`}>
          <input type="radio" name={nom} value={o.valeur} checked={valeur === o.valeur} onChange={() => onChange(o.valeur)} />
          <span className={styles.lettre} aria-hidden="true">
            {lettres[i]}
          </span>
          <span className={styles.optionTexte}>
            <strong>
              {o.libelle}
              {o.badge && <em>{o.badge}</em>}
            </strong>
            {o.detail && <small>{o.detail}</small>}
          </span>
          <span className={styles.rond} aria-hidden="true" />
        </label>
      ))}
    </div>
  );
}

function Champ({ id, libelle, requis, erreur, children }: { id: string; libelle: string; requis?: boolean; erreur?: string; children: ReactNode }) {
  return (
    <div className={styles.champ}>
      <label htmlFor={id}>
        {libelle} {requis && <abbr title="obligatoire">*</abbr>}
      </label>
      {children}
      {erreur && (
        <span className={styles.erreur} id={`${id}-erreur`}>
          {erreur}
        </span>
      )}
    </div>
  );
}
