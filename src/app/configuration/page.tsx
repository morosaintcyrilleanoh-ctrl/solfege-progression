import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/PageHero';
import { isSupabaseConfigured } from '@/lib/supabase/env';

export const metadata: Metadata = { title: 'Configuration' };

export default function ConfigurationPage() {
  const configured = isSupabaseConfigured();
  return (
    <>
      <PageHero title="Configuration du site" subtitle="État de la connexion aux comptes (Supabase)." />
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 text-sm text-slate-700">
        <p className={`rounded-xl p-3 font-semibold ${configured ? 'bg-success-50 text-success-700' : 'bg-amber-100 text-amber-800'}`} role="status">
          {configured ? 'Supabase est configuré : les comptes sont actifs.' : 'Supabase n’est pas encore configuré : les comptes sont désactivés.'}
        </p>
        <p>Les laboratoires fonctionnent dans tous les cas, sans compte, avec un historique enregistré sur l’appareil.</p>
        <p>
          Pour activer les comptes, l’administrateur suit le guide <code>docs/SUPABASE.md</code> du dépôt : créer un projet Supabase,
          appliquer les migrations, puis renseigner <code>NEXT_PUBLIC_SUPABASE_URL</code> et <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>{' '}
          dans les variables d’environnement de l’hébergement. Aucune clé secrète n’est nécessaire au site.
        </p>
      </div>
    </>
  );
}
