export interface NavItem {
  href: string;
  label: string;
  /** Libellé court pour la barre de navigation mobile. */
  short: string;
  icon: 'home' | 'dashboard' | 'labs' | 'history';
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Accueil', short: 'Accueil', icon: 'home' },
  { href: '/tableau-de-bord', label: 'Tableau de bord', short: 'Tableau', icon: 'dashboard' },
  { href: '/laboratoires', label: 'Laboratoires', short: 'Labos', icon: 'labs' },
  { href: '/laboratoires/lecture-des-notes/historique', label: 'Historique', short: 'Historique', icon: 'history' },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  if (href === '/laboratoires') return pathname.startsWith('/laboratoires') && !pathname.endsWith('/historique');
  return pathname === href || pathname.startsWith(`${href}/`);
}
