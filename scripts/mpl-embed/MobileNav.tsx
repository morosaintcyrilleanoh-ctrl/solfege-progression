'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TAB_ITEMS, isActive } from './nav-items';

const ICONS: Record<string, React.ReactNode> = {
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  ear: <path d="M3 12h3l2-6 4 12 3-9 2 3h4" />,
  staff: (
    <>
      <path d="M3 6h18M3 10h18M3 14h18M3 18h18" />
      <circle cx="15" cy="12" r="2.6" fill="currentColor" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.2-4 4.2-6 8-6s6.8 2 8 6" />
    </>
  ),
};

/** Barre du bas (téléphone), identique à celle de Music Progression Lab. */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_rgba(11,37,69,0.06)] md:hidden"
    >
      <ul className="grid grid-cols-4">
        {TAB_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const cls = `flex min-h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${active ? 'text-electric-600' : 'text-slate-500'}`;
          const content = (
            <>
              <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {ICONS[item.icon]}
              </svg>
              {item.short}
            </>
          );
          return (
            <li key={item.href}>
              {item.external ? (
                <a href={item.href} className={cls}>
                  {content}
                </a>
              ) : (
                <Link href={item.href} aria-current={active ? 'page' : undefined} className={cls}>
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
