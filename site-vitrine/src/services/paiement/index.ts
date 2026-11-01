import type { Commande, ResultatPaiement } from './types';

export type { Commande, MoyenPaiement, ResultatPaiement, StatutConfirmation } from './types';

/**
 * ============================================================
 *  PAIEMENT EN LIGNE — point d'intégration (Mobile Money / carte)
 *
 *  Le navigateur ne parle JAMAIS directement au prestataire avec une clé secrète.
 *  Il appelle votre fonction serveur (api/paiement/initier.js sur Vercel), qui :
 *   1. recalcule le montant à partir de l'offre choisie ;
 *   2. crée la transaction chez le prestataire (CinetPay, FedaPay, PayDunya,
 *      Paystack, Flutterwave, Stripe… selon vos pays et vos besoins) ;
 *   3. renvoie { url } : l'adresse de la page de paiement du prestataire.
 *  Après paiement, le prestataire redirige l'élève vers :
 *      /confirmation?statut=paiement-en-attente&ref=<reference>
 *  et notifie votre serveur (api/paiement/notification.js), qui seul fait foi.
 *
 *  Tant que VITE_PAIEMENT_ENDPOINT est vide, le paiement en ligne est simplement
 *  indiqué comme « bientôt disponible » et l'inscription passe par le formateur.
 * ============================================================
 */
const endpoint = import.meta.env.VITE_PAIEMENT_ENDPOINT as string | undefined;

export function paiementEnLigneDisponible() {
  return Boolean(endpoint);
}

export async function demarrerPaiement(commande: Commande): Promise<ResultatPaiement> {
  if (!endpoint) {
    return { statut: 'indisponible', raison: 'Le paiement en ligne n’est pas encore activé.' };
  }
  try {
    const reponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commande),
    });
    const donnees = (await reponse.json().catch(() => ({}))) as { url?: string; erreur?: string };
    if (!reponse.ok || !donnees.url) {
      return { statut: 'indisponible', raison: donnees.erreur ?? 'Le paiement en ligne est momentanément indisponible.' };
    }
    return { statut: 'redirection', url: donnees.url };
  } catch {
    return { statut: 'indisponible', raison: 'Impossible de joindre le service de paiement. Vérifiez votre connexion.' };
  }
}
