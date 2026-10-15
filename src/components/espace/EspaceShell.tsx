import type { ReactNode } from 'react';
import { signOutAction } from '@/app/connexion/actions';
import { buttonClasses } from '@/components/ui/primitives';
import { ROLE_LABELS, displayName } from '@/lib/data/names';
import type { ProfileRow } from '@/lib/supabase/database.types';
import { EspaceNav } from './EspaceNav';

export function EspaceShell({ profile, title, subtitle, children, actions }: { profile: ProfileRow; title: string; subtitle?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <>
      <div className="bg-night-900 text-white">
        <div className="mx-auto max-w-6xl px-4 pb-5 pt-5 sm:pt-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-300">
                {ROLE_LABELS[profile.role]} · {displayName(profile)}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-white/70 sm:text-base">{subtitle}</p>}
            </div>
            <form action={signOutAction}>
              <button type="submit" className="min-h-10 rounded-lg px-3 text-sm font-semibold text-white/80 hover:bg-white/10">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4">
        <EspaceNav role={profile.role} />
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        {children}
      </div>
    </>
  );
}

export function Section({ title, children, action, className = '' }: { title: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-bold text-night-800">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-500">{children}</p>;
}

export function QueryError({ what }: { what: string }) {
  return (
    <p role="alert" className="rounded-xl bg-danger-50 p-3 text-sm text-danger-700">
      Impossible de charger {what}. Vérifie ta connexion puis recharge la page.
    </p>
  );
}

export { buttonClasses };
