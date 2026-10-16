'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { NAV_ITEMS, isActive } from './nav-items';

/** Barre de navigation fixe en bas de l'écran sur téléphone (zone du pouce). */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-night-900 pb-[env(safe-area-inset-bottom)] text-white md:hidden"
    >
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const cls = `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${active ? 'text-electric-300' : 'text-white/65'}`;
          const content = (
            <>
              <Icon name={item.icon} className="size-5" />
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
