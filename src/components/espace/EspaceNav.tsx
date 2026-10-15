'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AppRole } from '@/lib/supabase/database.types';

const LINKS: Record<AppRole, { href: string; label: string }[]> = {
  student: [
    { href: '/espace/eleve', label: 'Tableau de bord' },
    { href: '/cours', label: 'Mes cours' },
    { href: '/espace/eleve/devoirs', label: 'Devoirs' },
    { href: '/espace/lives', label: 'Lives' },
    { href: '/espace/annonces', label: 'Annonces' },
    { href: '/profil', label: 'Profil' },
  ],
  trainer: [
    { href: '/espace/formateur', label: 'Tableau de bord' },
    { href: '/espace/formateur/cours', label: 'Cours' },
    { href: '/espace/formateur/exercices', label: 'Exercices' },
    { href: '/espace/formateur/groupes', label: 'Groupes' },
    { href: '/espace/formateur/devoirs', label: 'Devoirs' },
    { href: '/espace/lives', label: 'Lives' },
    { href: '/espace/annonces', label: 'Annonces' },
    { href: '/profil', label: 'Profil' },
  ],
  admin: [
    { href: '/espace/admin', label: 'Vue d’ensemble' },
    { href: '/espace/admin/comptes', label: 'Comptes' },
    { href: '/espace/formateur/cours', label: 'Cours' },
    { href: '/espace/formateur/exercices', label: 'Exercices' },
    { href: '/espace/formateur/groupes', label: 'Groupes' },
    { href: '/espace/lives', label: 'Lives' },
    { href: '/espace/annonces', label: 'Annonces' },
    { href: '/espace/admin/parametres', label: 'Paramètres' },
    { href: '/profil', label: 'Profil' },
  ],
};

export function EspaceNav({ role }: { role: AppRole }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigation de l’espace" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-1.5 pb-1">
        {LINKS[role].map((l) => {
          const active = pathname === l.href || (l.href !== '/espace/eleve' && l.href !== '/espace/formateur' && l.href !== '/espace/admin' && pathname.startsWith(`${l.href}/`));
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={`block min-h-10 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold ${
                  active ? 'bg-night-900 text-white' : 'bg-white text-slate-700 shadow-sm hover:bg-slate-50'
                }`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
