import { useEffect, useState } from 'react';
import { barreAction } from '../config/conversion';
import { site } from '../config/site';
import { useRouteur } from '../lib/router';
import { lienWhatsApp } from '../lib/whatsapp';
import { BoutonAction } from './BoutonAction';
import { Icone } from './Icone';
import styles from './BarreAction.module.css';

/**
 * Téléphone : barre fixée en bas de l'écran (« Je m'inscris » + WhatsApp),
 * qui apparaît après le haut de page.
 * Ordinateur : simple bouton WhatsApp rond flottant.
 */
export function BarreAction() {
  const { chemin, recherche } = useRouteur();
  const [visible, setVisible] = useState(false);
  const url = lienWhatsApp();

  useEffect(() => {
    const surDefilement = () => setVisible(window.scrollY > 420);
    surDefilement();
    window.addEventListener('scroll', surDefilement, { passive: true });
    return () => window.removeEventListener('scroll', surDefilement);
  }, [chemin]);

  if (chemin === '/inscription' || chemin === '/confirmation') return null;

  // Sur la page d'une formation, le bouton inscrit directement à cette formation.
  const formation = chemin.startsWith('/formations/') ? chemin.split('/')[2] : recherche.get('formation') ?? undefined;
  const bouton = formation && barreAction.bouton.action.type === 'inscription'
    ? { ...barreAction.bouton, action: { ...barreAction.bouton.action, formation } }
    : barreAction.bouton;

  if (chemin === '/masterclass') {
    return (
      <div className={`${styles.barre} ${visible ? styles.visible : ''}`} aria-hidden={!visible}>
        <a className="btn btn--large" href="#reserver" tabIndex={visible ? 0 : -1}>
          Réserver ma place gratuite <Icone nom="fleche" />
        </a>
      </div>
    );
  }

  const whatsapp = barreAction.afficherWhatsApp && (url || site.afficherEmplacements);
  const proprietesWhatsApp = url
    ? { href: url, target: '_blank', rel: 'noopener noreferrer' }
    : { href: chemin === '/' ? '#contact' : undefined, title: 'Numéro WhatsApp à configurer dans src/config/site.ts' };

  return (
    <>
      <div className={`${styles.barre} ${visible ? styles.visible : ''}`} aria-hidden={!visible}>
        <BoutonAction bouton={bouton} large icone={<Icone nom="fleche" />} />
        {whatsapp && (
          <a className={styles.whatsapp} {...proprietesWhatsApp} tabIndex={visible ? 0 : -1}>
            <Icone nom="whatsapp" taille={26} />
            <span className="visuellement-cache">Écrire sur WhatsApp</span>
          </a>
        )}
      </div>

      {whatsapp && (
        <a className={styles.flottant} {...proprietesWhatsApp}>
          <Icone nom="whatsapp" taille={30} />
          <span className="visuellement-cache">Écrire au formateur sur WhatsApp</span>
        </a>
      )}
    </>
  );
}
