import type { ReactNode } from 'react';

export function PageHero({ title, subtitle, eyebrow, children }: { title: string; subtitle?: string; eyebrow?: string; children?: ReactNode }) {
  return (
    <div className="bg-night-900 text-white">
      <div className="mx-auto max-w-6xl px-4 pb-6 pt-5 sm:pb-8 sm:pt-8">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-accent-300">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-white/70 sm:text-base">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
