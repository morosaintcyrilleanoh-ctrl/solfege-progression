export interface NavItem {
  href: string;
  label: string;
  /** Libellé court pour la barre de navigation mobile. */
  short: string;
  icon: 'home' | 'dashboard' | 'labs' | 'history' | 'user';
  /** Lien vers le reste de Music Progression Lab (hors du dossier /solfege). */
  external?: boolean;
}

/** Retour à Music Progression Lab : page d'accueil de l'application (routes en #/…). */
export const LAB_HOME = '/#/';

export const NAV_ITEMS: NavItem[] = [
  { href: LAB_HOME, label: 'Music Progression Lab', short: 'Lab', icon: 'home', external: true },
  { href: '/', label: 'Solfège', short: 'Solfège', icon: 'labs' },
  { href: '/tableau-de-bord', label: 'Mes progrès', short: 'Progrès', icon: 'dashboard' },
  { href: '/test-de-positionnement', label: 'Test de niveau', short: 'Test', icon: 'history' },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === LAB_HOME) return false;
  if (href === '/') return pathname === '/' || pathname.startsWith('/laboratoires');
  return pathname === href || pathname.startsWith(`${href}/`);
}
