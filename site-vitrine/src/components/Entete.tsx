import { useEffect, useState, type MouseEvent } from 'react';
import { site } from '../config/site';
import { href, useRouteur } from '../lib/router';
import { BoutonAction } from './BoutonAction';
import { Icone } from './Icone';
import styles from './Entete.module.css';

/** Liens du menu : identifiant de section de la page d'accueil → libellé. */
const liens = [
  { id: 'formateur', libelle: 'Le formateur' },
  { id: 'formations', libelle: 'Formations' },
  { id: 'communaute', libelle: 'Communauté' },
  { id: 'videos', libelle: 'Vidéos' },
  { id: 'tarifs', libelle: 'Tarifs' },
  { id: 'faq', libelle: 'FAQ' },
];

export function Entete() {
  const { chemin, naviguer } = useRouteur();
  const [ouvert, setOuvert] = useState(false);
  const [defile, setDefile] = useState(false);

  useEffect(() => {
    const surDefilement = () => setDefile(window.scrollY > 12);
    surDefilement();
    window.addEventListener('scroll', surDefilement, { passive: true });
    return () => window.removeEventListener('scroll', surDefilement);
  }, []);

  useEffect(() => {
    document.body.style.overflow = ouvert ? 'hidden' : '';
    const surTouche = (e: KeyboardEvent) => e.key === 'Escape' && setOuvert(false);
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, [ouvert]);

  const allerA = (id: string) => (e: MouseEvent) => {
    setOuvert(false);
    if (chemin !== '/') {
      e.preventDefault();
      naviguer(`/#${id}`);
    }
  };

  return (
    <header className={`${styles.entete} ${defile || ouvert ? styles.plein : ''}`}>
      <div className={`conteneur ${styles.barre}`}>
        <a
          className={styles.logo}
          href={href('/')}
          onClick={(e) => {
            e.preventDefault();
            setOuvert(false);
            naviguer('/');
          }}
        >
          <span className={styles.monogramme} aria-hidden="true">
            <Icone nom="cle-sol" taille={22} />
          </span>
          <span className={styles.nom}>
            {site.nom}
            <small>{site.titreFormateur}</small>
          </span>
        </a>

        <nav className={`${styles.nav} ${ouvert ? styles.navOuverte : ''}`} aria-label="Navigation principale" id="menu-principal">
          <ul>
            {liens.map((lien) => (
              <li key={lien.id}>
                <a href={chemin === '/' ? `#${lien.id}` : href(`/#${lien.id}`)} onClick={allerA(lien.id)}>
                  {lien.libelle}
                </a>
              </li>
            ))}
          </ul>
          <div className={styles.navActions}>
            <BoutonAction bouton={{ libelle: 'Contact', action: { type: 'section', id: 'contact' } }} variante="contour" taille="petit" />
            <BoutonAction bouton={{ libelle: 'S’inscrire', action: { type: 'inscription' } }} taille="petit" />
          </div>
        </nav>

        <button
          type="button"
          className={styles.burger}
          aria-expanded={ouvert}
          aria-controls="menu-principal"
          onClick={() => setOuvert((v) => !v)}
        >
          <Icone nom={ouvert ? 'fermer' : 'menu'} taille={24} />
          <span className="visuellement-cache">{ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}</span>
        </button>
      </div>
    </header>
  );
}
