import { site } from '../config/site';
import { useRouteur } from '../lib/router';
import { lienWhatsApp } from '../lib/whatsapp';
import { Icone } from './Icone';
import styles from './BoutonWhatsAppFlottant.module.css';

/** Bouton WhatsApp rond, toujours visible en bas à droite. */
export function BoutonWhatsAppFlottant() {
  const { chemin } = useRouteur();
  const url = lienWhatsApp();
  // Masqué pendant l'inscription (le bouton « Suivant » occupe le bas de l'écran).
  if (chemin === '/inscription') return null;
  if (!url && !site.afficherEmplacements) return null;

  return (
    <a
      className={styles.bouton}
      href={url ?? (chemin === '/' ? '#contact' : undefined)}
      {...(url ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      title={url ? 'Écrire sur WhatsApp' : 'Numéro WhatsApp à configurer dans src/config/site.ts'}
    >
      <Icone nom="whatsapp" taille={30} />
      <span className="visuellement-cache">Écrire au formateur sur WhatsApp</span>
    </a>
  );
}
