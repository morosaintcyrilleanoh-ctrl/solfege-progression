import { useId, useState, type FormEvent } from 'react';
import { formations, trouverFormation } from '../config/formations';
import { formaterPrix, offres, trouverOffre } from '../config/offres';
import { site } from '../config/site';
import { Icone } from '../components/Icone';
import { useRouteur } from '../lib/router';
import { nouvelleReference } from '../lib/reference';
import {
  canalInscription,
  envoyerInscription,
  memoriserDemande,
  type DemandeInscription,
} from '../services/inscription';
import { demarrerPaiement, paiementEnLigneDisponible } from '../services/paiement';
import styles from './Formulaire.module.css';

const pays = [
  'Côte d’Ivoire', 'Sénégal', 'Cameroun', 'Bénin', 'Burkina Faso', 'Mali', 'Togo', 'Guinée', 'Niger', 'Gabon',
  'Congo', 'RD Congo', 'Tchad', 'Centrafrique', 'Madagascar', 'Burundi', 'Rwanda', 'Djibouti', 'Comores',
  'Mauritanie', 'Maroc', 'Algérie', 'Tunisie', 'Haïti', 'France', 'Belgique', 'Suisse', 'Canada',
];

type Erreurs = Partial<Record<'nom' | 'telephone' | 'email' | 'consentement' | 'envoi', string>>;

export function Inscription() {
  const { recherche, naviguer } = useRouteur();
  const id = useId();
  const formationInitiale = trouverFormation(recherche.get('formation'))?.id ?? '';
  const offreInitiale = trouverOffre(recherche.get('offre'))?.id ?? '';

  const [formation, setFormation] = useState(formationInitiale);
  const [offre, setOffre] = useState(offreInitiale);
  const [moyen, setMoyen] = useState<DemandeInscription['moyenPaiement']>('a-definir');
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [envoi, setEnvoi] = useState(false);

  const offreChoisie = trouverOffre(offre);
  const canal = canalInscription();
  const paiementPossible = paiementEnLigneDisponible() && Boolean(offreChoisie?.prix) && moyen !== 'a-definir';

  async function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const donnees = new FormData(e.currentTarget);
    const valeur = (cle: string) => String(donnees.get(cle) ?? '').trim();

    const demande: DemandeInscription = {
      reference: nouvelleReference(),
      nom: valeur('nom'),
      telephone: valeur('telephone'),
      email: valeur('email'),
      pays: valeur('pays'),
      formation: trouverFormation(formation)?.titre ?? '',
      offre: offreChoisie?.nom ?? '',
      moyenPaiement: moyen,
      message: valeur('message'),
    };

    const nouvelles: Erreurs = {};
    if (demande.nom.length < 2) nouvelles.nom = 'Indiquez votre nom complet.';
    if (demande.telephone.replace(/\D/g, '').length < 8) nouvelles.telephone = 'Indiquez un numéro valide, avec l’indicatif du pays.';
    if (demande.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(demande.email)) nouvelles.email = 'Cette adresse e-mail semble incorrecte.';
    if (!donnees.get('consentement')) nouvelles.consentement = 'Cochez cette case pour que le formateur puisse vous recontacter.';
    setErreurs(nouvelles);
    if (Object.keys(nouvelles).length > 0) {
      const premier = e.currentTarget.querySelector<HTMLElement>('[aria-invalid="true"]');
      premier?.focus();
      return;
    }

    // 1) Paiement en ligne, s'il est activé (redirection vers le prestataire).
    if (paiementPossible) {
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
      setErreurs({ envoi: `${resultat.raison} Vous pouvez envoyer votre demande d’inscription sans payer en ligne en choisissant « À définir avec le formateur ».` });
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

  const champ = (nom: keyof Erreurs) => ({
    id: `${id}-${nom}`,
    name: nom,
    'aria-invalid': erreurs[nom] ? ('true' as const) : undefined,
    'aria-describedby': erreurs[nom] ? `${id}-${nom}-erreur` : undefined,
  });
  const messageErreur = (nom: keyof Erreurs) =>
    erreurs[nom] && (
      <span className={styles.erreur} id={`${id}-${nom}-erreur`}>
        {erreurs[nom]}
      </span>
    );

  return (
    <section className={`section ${styles.page}`} aria-labelledby="titre-inscription">
      <div className={`conteneur ${styles.grille}`}>
        <header className={styles.entete}>
          <span className="surtitre">Inscription</span>
          <h1 className="titre-section" id="titre-inscription">
            Rejoindre une formation
          </h1>
          <p className="intro-section">
            Remplissez ce formulaire : le {site.titreFormateur} vous recontacte pour confirmer votre inscription et les modalités de
            paiement.
          </p>
          <ul className={styles.etapes}>
            <li>
              <strong>1.</strong> Vous envoyez votre demande.
            </li>
            <li>
              <strong>2.</strong> Le formateur confirme votre place et le tarif.
            </li>
            <li>
              <strong>3.</strong> Vous réglez selon les modalités indiquées, puis vous commencez.
            </li>
          </ul>
        </header>

        <form className={styles.formulaire} onSubmit={soumettre} noValidate>
          <fieldset className={styles.groupe}>
            <legend>Votre choix</legend>
            <div className={styles.champ}>
              <label htmlFor={`${id}-formation`}>Formation</label>
              <select id={`${id}-formation`} name="formation" value={formation} onChange={(e) => setFormation(e.target.value)}>
                <option value="">Je ne sais pas encore</option>
                {formations.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.titre}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.champ}>
              <label htmlFor={`${id}-offre`}>Offre</label>
              <select id={`${id}-offre`} name="offre" value={offre} onChange={(e) => setOffre(e.target.value)}>
                <option value="">À définir avec le formateur</option>
                {offres.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nom}
                    {o.prix ? ` — ${formaterPrix(o.prix)}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>

          <fieldset className={styles.groupe}>
            <legend>Vos coordonnées</legend>
            <div className={styles.champ}>
              <label htmlFor={`${id}-nom`}>
                Nom complet <abbr title="obligatoire">*</abbr>
              </label>
              <input {...champ('nom')} type="text" autoComplete="name" required />
              {messageErreur('nom')}
            </div>
            <div className={styles.champ}>
              <label htmlFor={`${id}-telephone`}>
                Téléphone / WhatsApp <abbr title="obligatoire">*</abbr>
              </label>
              <input {...champ('telephone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="+225 …" required />
              {messageErreur('telephone')}
            </div>
            <div className={styles.champ}>
              <label htmlFor={`${id}-email`}>E-mail (facultatif)</label>
              <input {...champ('email')} type="email" autoComplete="email" inputMode="email" />
              {messageErreur('email')}
            </div>
            <div className={styles.champ}>
              <label htmlFor={`${id}-pays`}>Pays</label>
              <select id={`${id}-pays`} name="pays" defaultValue="">
                <option value="">Choisir…</option>
                {pays.map((p) => (
                  <option key={p}>{p}</option>
                ))}
                <option>Autre pays</option>
              </select>
            </div>
          </fieldset>

          <fieldset className={styles.groupe}>
            <legend>Paiement souhaité</legend>
            <div className={styles.choix} role="radiogroup">
              {(
                [
                  ['mobile-money', 'Mobile Money', 'Orange, MTN, Moov, Wave…'],
                  ['carte', 'Carte bancaire', 'Visa, Mastercard'],
                  ['a-definir', 'À définir', 'avec le formateur'],
                ] as const
              ).map(([valeur, libelle, detail]) => (
                <label key={valeur} className={`${styles.option} ${moyen === valeur ? styles.optionActive : ''}`}>
                  <input type="radio" name="moyen" value={valeur} checked={moyen === valeur} onChange={() => setMoyen(valeur)} />
                  <span>
                    <strong>{libelle}</strong>
                    <small>{detail}</small>
                  </span>
                </label>
              ))}
            </div>
            {!paiementEnLigneDisponible() && (
              <p className={styles.info}>
                Le paiement en ligne n’est pas encore activé : aucun paiement ne vous sera demandé sur ce site. Le formateur vous
                indiquera comment régler.
              </p>
            )}
          </fieldset>

          <div className={styles.champ}>
            <label htmlFor={`${id}-message`}>Message (facultatif)</label>
            <textarea id={`${id}-message`} name="message" rows={4} placeholder="Votre niveau, vos objectifs, vos questions…" />
          </div>

          <div className={styles.champ}>
            <label className={styles.case}>
              <input {...champ('consentement')} type="checkbox" />
              <span>J’accepte que le formateur me recontacte au sujet de cette demande.</span>
            </label>
            {messageErreur('consentement')}
          </div>

          {erreurs.envoi && (
            <p className={styles.erreurEnvoi} role="alert">
              {erreurs.envoi}
            </p>
          )}

          <button type="submit" className="btn btn--large" disabled={envoi}>
            {envoi ? 'Envoi en cours…' : paiementPossible ? 'Continuer vers le paiement' : 'Envoyer ma demande'}
            {!envoi && <Icone nom={canal === 'whatsapp' && !paiementPossible ? 'whatsapp' : 'fleche'} />}
          </button>

          <p className={styles.mention}>
            {canal === 'whatsapp' && !paiementPossible && 'Votre demande s’ouvrira dans WhatsApp : il vous suffira de l’envoyer.'}
            {canal === 'serveur' && !paiementPossible && 'Votre demande est transmise directement au formateur.'}
            {canal === 'apercu' && (
              <>
                <span className="badge-apercu">Mode aperçu</span> Aucun envoi n’est configuré : la demande ne sera transmise à personne.
              </>
            )}
          </p>
        </form>
      </div>
    </section>
  );
}
