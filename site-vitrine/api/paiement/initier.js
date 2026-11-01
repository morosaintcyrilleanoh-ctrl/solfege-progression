/**
 * Fonction serveur Vercel : POST /api/paiement/initier
 *
 * POINT D'INTÉGRATION — aucun prestataire n'est branché pour l'instant.
 * Cette fonction répond « 501 Non configuré » et le site propose alors
 * l'inscription classique. Aucun paiement n'est simulé.
 *
 * Pour activer le paiement :
 *  1. Ouvrez un compte chez un prestataire (Mobile Money et/ou carte).
 *  2. Ajoutez sa clé secrète dans Vercel > Settings > Environment Variables
 *     (ex. PAIEMENT_CLE_SECRETE — jamais de préfixe VITE_, jamais dans le code).
 *  3. Ici : validez le corps de la requête, recalculez le montant à partir de
 *     l'offre (ne faites jamais confiance au montant envoyé par le navigateur),
 *     créez la transaction via l'API du prestataire avec :
 *       - return_url : https://<votre-site>/confirmation?statut=paiement-en-attente&ref=<reference>
 *       - notify_url : https://<votre-site>/api/paiement/notification
 *     puis répondez { url: <adresse de la page de paiement> }.
 *  4. Définissez VITE_PAIEMENT_ENDPOINT=/api/paiement/initier et redéployez.
 */
export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ erreur: 'Méthode non autorisée.' });
  }
  return res.status(501).json({ erreur: 'Le paiement en ligne n’est pas encore configuré.' });
}
