/** Référence lisible pour une demande d'inscription ou une commande, ex. ALM-20261024-7KQ4. */
export function nouvelleReference(date = new Date()) {
  const jour = date.toISOString().slice(0, 10).replace(/-/g, '');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const octets = new Uint8Array(4);
  crypto.getRandomValues(octets);
  const suffixe = Array.from(octets, (o) => alphabet[o % alphabet.length]).join('');
  return `ALM-${jour}-${suffixe}`;
}
