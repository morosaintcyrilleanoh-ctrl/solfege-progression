import { site } from '../config/site';

/** Le numéro WhatsApp est-il configuré ? */
export function whatsappDisponible() {
  return chiffres(site.contact.whatsapp).length >= 8;
}

/** Lien wa.me avec message pré-rempli, ou null si aucun numéro n'est configuré. */
export function lienWhatsApp(message: string = site.messagesWhatsApp.general) {
  if (!whatsappDisponible()) return null;
  return `https://wa.me/${chiffres(site.contact.whatsapp)}?text=${encodeURIComponent(message)}`;
}

/** Remplace {formation} et {offre} dans un modèle de message. */
export function remplir(modele: string, valeurs: { formation?: string; offre?: string }) {
  return modele.replace('{formation}', valeurs.formation ?? '').replace('{offre}', valeurs.offre ?? '');
}

function chiffres(valeur: string) {
  return valeur.replace(/\D/g, '');
}
