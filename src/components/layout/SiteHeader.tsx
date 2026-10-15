'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import logo from './logo.svg';
import { NAV_ITEMS, isActive } from './nav-items';
import { useIsSignedIn } from './useAccount';

export function SiteHeader() {
  const pathname = usePathname();
  const signedIn = useIsSignedIn();
  const items = NAV_ITEMS.map((i) => (i.href === '/espace' && signedIn === false ? { ...i, href: '/connexion', label: 'Connexion', short: 'Connexion' } : i));
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-night-900/95 text-white backdrop-blur supports-[backdrop-filter]:bg-night-900/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg" aria-label="Solfège Progression — accueil">
          <Image src={logo} alt="" width={34} height={34} priority />
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight sm:text-base">Solfège Progression</span>
            <span className="block text-[11px] font-medium text-accent-300 sm:text-xs">Apprendre la musique</span>
          </span>
        </Link>
        <nav aria-label="Navigation principale" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {items.map((item) => {
              const active = isActive(pathname, item.href === '/connexion' ? '/espace' : item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
