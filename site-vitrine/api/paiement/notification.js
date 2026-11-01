/**
 * Fonction serveur Vercel : POST /api/paiement/notification
 *
 * POINT D'INTÉGRATION — notification (webhook / IPN) envoyée par le prestataire
 * de paiement après chaque transaction. C'est elle, et non la page de
 * confirmation, qui doit faire foi pour valider un paiement :
 *  1. vérifier la signature ou interroger l'API du prestataire avec la référence ;
 *  2. enregistrer le résultat (base de données, tableur, e-mail au formateur…) ;
 *  3. donner l'accès à la formation.
 */
export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ erreur: 'Méthode non autorisée.' });
  }
  return res.status(501).json({ erreur: 'Notification de paiement non configurée.' });
}
