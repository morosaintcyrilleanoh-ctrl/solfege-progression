import { useEffect, useState, type MouseEvent } from 'react';
import { formations } from '../config/formations';
import { href, useRouteur } from '../lib/router';
import { BoutonAction } from './BoutonAction';
import { Icone } from './Icone';
import { Logo } from './Logo';
import styles from './Entete.module.css';

/** Liens du menu : identifiant de section de la page d'accueil → libellé. */
const liens = [
  { id: 'formateur', libelle: 'Le formateur' },
  { id: 'formations', libelle: 'Formations', sousMenu: true },
  { id: 'communaute', libelle: 'Communauté' },
  { id: 'videos', libelle: 'Vidéos' },
  { id: 'tarifs', libelle: 'Tarifs' },
  { id: 'faq', libelle: 'FAQ' },
];

export function Entete() {
  const { chemin, naviguer } = useRouteur();
  const [ouvert, setOuvert] = useState(false);
  const [sousMenu, setSousMenu] = useState(false);
  const [defile, setDefile] = useState(false);

  useEffect(() => {
    const surDefilement = () => setDefile(window.scrollY > 10);
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

  const fermer = () => {
    setOuvert(false);
    setSousMenu(false);
  };

  const allerA = (cible: string) => (e: MouseEvent) => {
    fermer();
    if (cible.startsWith('/') || chemin !== '/') {
      e.preventDefault();
      naviguer(cible.startsWith('/') ? cible : `/#${cible}`);
    }
  };

  return (
    <header className={styles.entete}>
      <div className={`conteneur ${styles.cadre}`}>
        <div className={`${styles.capsule} ${defile || ouvert ? styles.capsuleDefilee : ''}`}>
          <a
            className={styles.lienLogo}
            href={href('/')}
            onClick={(e) => {
              e.preventDefault();
              fermer();
              naviguer('/');
            }}
          >
            <Logo />
          </a>

          {/* Navigation ordinateur */}
          <nav className={styles.navLarge} aria-label="Navigation principale">
            <ul>
              {liens.map((lien) => (
                <li key={lien.id}>
                  <a href={chemin === '/' ? `#${lien.id}` : href(`/#${lien.id}`)} onClick={allerA(lien.id)}>
                    {lien.libelle}
                  </a>
                </li>
              ))}
            </ul>
            <BoutonAction bouton={{ libelle: 'S’inscrire', action: { type: 'inscription' } }} taille="petit" />
          </nav>

          <button
            type="button"
            className={styles.burger}
            aria-expanded={ouvert}
            aria-controls="menu-mobile"
            onClick={() => (ouvert ? fermer() : setOuvert(true))}
          >
            <Icone nom={ouvert ? 'fermer' : 'menu'} taille={22} />
            <span className="visuellement-cache">{ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}</span>
          </button>
        </div>
      </div>

      {/* Menu téléphone : plein écran */}
      <div id="menu-mobile" className={`${styles.panneau} ${ouvert ? styles.panneauOuvert : ''}`} hidden={!ouvert}>
        <nav aria-label="Menu" className={`conteneur ${styles.panneauNav}`}>
          <ul>
            <li>
              <a href={href('/')} onClick={allerA('/')}>
                Accueil
              </a>
            </li>
            {liens.map((lien) =>
              lien.sousMenu ? (
                <li key={lien.id}>
                  <button type="button" className={styles.accordeon} aria-expanded={sousMenu} onClick={() => setSousMenu((v) => !v)}>
                    {lien.libelle}
                    <Icone nom="chevron" taille={22} />
                  </button>
                  {sousMenu && (
                    <ul className={styles.sousListe}>
                      {formations.map((f) => (
                        <li key={f.id}>
                          <a href={href(`/#formation-${f.id}`)} onClick={allerA(`formation-${f.id}`)}>
                            <strong>{f.titre}</strong>
                            <small>{f.accroche}</small>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ) : (
                <li key={lien.id}>
                  <a href={chemin === '/' ? `#${lien.id}` : href(`/#${lien.id}`)} onClick={allerA(lien.id)}>
                    {lien.libelle}
                  </a>
                </li>
              ),
            )}
          </ul>
          <div className={styles.panneauActions} onClick={fermer}>
            <BoutonAction bouton={{ libelle: 'Nous contacter', action: { type: 'section', id: 'contact' } }} variante="contour" large />
            <BoutonAction bouton={{ libelle: 'S’inscrire à une formation', action: { type: 'inscription' } }} large />
          </div>
        </nav>
      </div>
    </header>
  );
}
