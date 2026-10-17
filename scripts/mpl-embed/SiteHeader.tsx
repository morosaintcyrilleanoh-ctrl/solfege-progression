'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LAB_HOME, NAV_ITEMS, isActive } from './nav-items';

/** En-tête aux couleurs de Music Progression Lab. */
export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-night-900/95 text-white backdrop-blur supports-[backdrop-filter]:bg-night-900/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16">
        <a href={LAB_HOME} className="flex items-center gap-2.5 rounded-lg" aria-label="Music Progression Lab — accueil">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo servi par Music Progression Lab */}
          <img src="/assets/logo.svg" alt="" width={34} height={34} />
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight sm:text-base">
              Music Progression <strong>Lab</strong>
            </span>
            <span className="block text-[11px] font-medium text-accent-300 sm:text-xs">Solfège</span>
          </span>
        </a>
        <nav aria-label="Navigation du solfège" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.filter((i) => !i.external).map((item) => {
              const active = isActive(pathname, item.href);
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
            <li>
              <a href={LAB_HOME} className="ml-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white">
                ← Retour au Lab
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
