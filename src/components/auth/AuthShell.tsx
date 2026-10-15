import Link from 'next/link';
import type { ReactNode } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase/env';

/** Mise en page des pages de compte, avec un message clair si Supabase n'est pas configuré. */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  const configured = isSupabaseConfigured();
  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-extrabold text-night-800">{title}</h1>
      {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {configured ? (
          children
        ) : (
          <div role="status" className="space-y-2 text-sm text-slate-700">
            <p className="font-semibold text-night-800">Les comptes ne sont pas encore activés sur ce site.</p>
            <p>
              L’administrateur doit relier le site à un projet Supabase (voir <Link className="font-semibold text-electric-600 hover:underline" href="/configuration">la page de configuration</Link>).
              En attendant, tous les laboratoires fonctionnent sans compte et enregistrent tes résultats sur cet appareil.
            </p>
            <Link href="/laboratoires" className="inline-block font-semibold text-electric-600 hover:underline">
              Aller aux laboratoires
            </Link>
          </div>
        )}
      </div>
      {configured && footer && <div className="mt-4 text-center text-sm text-slate-600">{footer}</div>}
    </div>
  );
}
