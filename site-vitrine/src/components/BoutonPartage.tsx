import { useState } from 'react';
import { partage } from '../config/conversion';
import { Icone } from './Icone';

type Props = { libelle?: string; message?: string; chemin?: string; className?: string; variante?: 'contour' | 'texte' };

/**
 * « Partager à un ami » : ouvre la feuille de partage du téléphone si elle existe,
 * sinon WhatsApp avec un message pré-rempli (fonctionne sans numéro configuré).
 */
export function BoutonPartage({ libelle = 'Partager à un ami', message = partage.message, chemin = '/', className, variante = 'contour' }: Props) {
  const [copie, setCopie] = useState(false);
  const adresse = new URL(chemin, window.location.origin).toString();
  const texte = `${message} ${adresse}`;
  const lienWhatsApp = `https://wa.me/?text=${encodeURIComponent(texte)}`;

  async function partager(e: React.MouseEvent<HTMLAnchorElement>) {
    if (typeof navigator.share === 'function') {
      e.preventDefault();
      try {
        await navigator.share({ text: message, url: adresse });
      } catch {
        /* partage annulé */
      }
      return;
    }
    // Sur ordinateur sans WhatsApp, le lien s'ouvre dans WhatsApp Web ; on copie aussi le texte.
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      /* copie refusée : le lien WhatsApp suffit */
    }
  }

  return (
    <a
      className={[variante === 'contour' ? 'btn btn--contour' : 'lien-partage', className].filter(Boolean).join(' ')}
      href={lienWhatsApp}
      target="_blank"
      rel="noopener noreferrer"
      onClick={partager}
    >
      <Icone nom="partage" />
      {copie ? 'Lien copié' : libelle}
    </a>
  );
}
