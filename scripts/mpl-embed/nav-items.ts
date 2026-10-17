export interface NavItem {
  href: string;
  label: string;
  /** Libellé court pour la barre de navigation mobile. */
  short: string;
  icon: 'home' | 'dashboard' | 'labs' | 'history' | 'user' | 'ear' | 'staff';
  /** Lien vers le reste de Music Progression Lab (hors du dossier /solfege). */
  external?: boolean;
}

/** Retour à Music Progression Lab : page d'accueil de l'application (routes en #/…). */
export const LAB_HOME = '/#/';

/** Barre du bas, identique à celle de Music Progression Lab. */
export const TAB_ITEMS: NavItem[] = [
  { href: LAB_HOME, label: 'Accueil', short: 'Accueil', icon: 'home', external: true },
  { href: '/#/programme', label: 'Oreille', short: 'Oreille', icon: 'ear', external: true },
  { href: '/', label: 'Solfège', short: 'Solfège', icon: 'staff' },
  { href: '/#/tableau-de-bord', label: 'Compte', short: 'Compte', icon: 'user', external: true },
];

/** Menu du haut (ordinateur) : pages du solfège. */
export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Solfège', short: 'Solfège', icon: 'staff' },
  { href: '/tableau-de-bord', label: 'Mes progrès', short: 'Progrès', icon: 'dashboard' },
  { href: '/test-de-positionnement', label: 'Test de niveau', short: 'Test', icon: 'history' },
];

export function isActive(pathname: string, href: string): boolean {
  if (href.startsWith('/#')) return false;
  if (href === '/') return pathname === '/' || pathname.startsWith('/laboratoires') || pathname.startsWith('/tableau-de-bord') || pathname.startsWith('/test-de-positionnement');
  return pathname === href || pathname.startsWith(`${href}/`);
}
