import { site } from '../config/site';
import { lienWhatsApp } from '../lib/whatsapp';

/**
 * ============================================================
 *  ENVOI DES DEMANDES D'INSCRIPTION — point d'intégration
 *
 *  Ordre de priorité :
 *   1. VITE_INSCRIPTION_ENDPOINT défini → la demande est envoyée en POST JSON
 *      à cette adresse (Formspree, webhook Make/Zapier, votre API, Google Apps Script…).
 *   2. Sinon, numéro WhatsApp configuré → la demande est envoyée par WhatsApp,
 *      sous forme de message pré-rempli que l'élève n'a plus qu'à envoyer.
 *   3. Sinon → mode aperçu : rien n'est envoyé, la page de confirmation l'indique.
 *
 *  Format envoyé au point 1 : l'objet DemandeInscription ci-dessous + site + date.
 * ============================================================
 */
export type DemandeInscription = {
  reference: string;
  nom: string;
  telephone: string;
  email: string;
  pays: string;
  formation: string;
  offre: string;
  moyenPaiement: 'mobile-money' | 'carte' | 'a-definir';
  message: string;
};

export type ResultatInscription =
  | { canal: 'serveur' }
  | { canal: 'whatsapp'; url: string }
  | { canal: 'apercu' };

const endpoint = import.meta.env.VITE_INSCRIPTION_ENDPOINT as string | undefined;

/** Canal utilisé pour les inscriptions, selon la configuration. */
export function canalInscription(): ResultatInscription['canal'] {
  if (endpoint) return 'serveur';
  if (lienWhatsApp()) return 'whatsapp';
  return 'apercu';
}

/**
 * Envoie la demande. Pour WhatsApp, renvoie le lien à ouvrir : appelez
 * window.open() immédiatement (avant tout await) pour éviter le blocage des fenêtres.
 */
export function envoyerInscription(demande: DemandeInscription): Promise<ResultatInscription> | ResultatInscription {
  const canal = canalInscription();
  if (canal === 'whatsapp') return { canal, url: lienWhatsApp(messageWhatsApp(demande)) ?? '' };
  if (canal === 'apercu') return { canal };
  return envoyerAuServeur(demande);
}

async function envoyerAuServeur(demande: DemandeInscription): Promise<ResultatInscription> {
  const reponse = await fetch(endpoint as string, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ ...demande, site: site.nom, date: new Date().toISOString() }),
  });
  if (!reponse.ok) throw new Error(`Envoi refusé (${reponse.status})`);
  return { canal: 'serveur' };
}

/**
 * Dernière demande envoyée, gardée pour la page de confirmation
 * (récapitulatif et lien WhatsApp si la fenêtre n'a pas pu s'ouvrir).
 */
const CLE = 'alm-derniere-demande';

export function memoriserDemande(demande: DemandeInscription, lien?: string) {
  try {
    sessionStorage.setItem(CLE, JSON.stringify({ demande, lien }));
  } catch {
    /* stockage indisponible (navigation privée) : sans conséquence */
  }
}

export function relireDemande(): { demande: DemandeInscription; lien?: string } | null {
  try {
    const brut = sessionStorage.getItem(CLE);
    return brut ? JSON.parse(brut) : null;
  } catch {
    return null;
  }
}

const libellesPaiement: Record<DemandeInscription['moyenPaiement'], string> = {
  'mobile-money': 'Mobile Money',
  carte: 'Carte bancaire',
  'a-definir': 'À définir avec le formateur',
};

function messageWhatsApp(d: DemandeInscription) {
  const champs: [string, string][] = [
    ['Référence', d.reference],
    ['Nom', d.nom],
    ['Téléphone', d.telephone],
    ['E-mail', d.email],
    ['Pays', d.pays],
    ['Formation', d.formation],
    ['Offre', d.offre],
    ['Paiement souhaité', libellesPaiement[d.moyenPaiement]],
    ['Message', d.message],
  ];
  const lignes = champs.filter(([, valeur]) => valeur).map(([libelle, valeur]) => `${libelle} : ${valeur}`);
  return [`Bonjour Formateur ${site.formateur}, je souhaite m’inscrire.`, '', ...lignes].join('\n');
}
