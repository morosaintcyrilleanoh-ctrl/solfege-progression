'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LAB_HOME, NAV_ITEMS, isActive } from './nav-items';

/** En-tête blanc, identique à celui de Music Progression Lab. */
export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 text-night-800 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16">
        <a href={LAB_HOME} className="flex items-center gap-2.5 rounded-lg" aria-label="Music Progression Lab — accueil">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo servi par Music Progression Lab */}
          <img src="/assets/logo.svg" alt="" width={34} height={34} />
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold tracking-tight sm:text-base">
              Music Progression <strong className="text-electric-600">Lab</strong>
            </span>
            <span className="block text-[11px] font-semibold text-electric-600 sm:text-xs">Solfège</span>
          </span>
        </a>
        <nav aria-label="Navigation du solfège" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = item.href === '/' ? pathname === '/' || pathname.startsWith('/laboratoires') : isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      active ? 'bg-electric-500/10 text-electric-700' : 'text-slate-600 hover:bg-slate-100 hover:text-night-800'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <a href={LAB_HOME} className="ml-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-night-800 hover:border-electric-300 hover:bg-electric-500/5">
                ← Retour au Lab
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
