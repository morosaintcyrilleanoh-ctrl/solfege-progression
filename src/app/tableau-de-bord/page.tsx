import type { Metadata } from 'next';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { PageHero } from '@/components/layout/PageHero';

export const metadata: Metadata = { title: 'Tableau de bord' };

export default function DashboardPage() {
  return (
    <>
      <PageHero title="Mon tableau de bord" subtitle="Tes résultats réels, enregistrés sur cet appareil." />
      <div className="mx-auto max-w-6xl px-4 py-5">
        <p className="mb-4 rounded-xl border border-electric-300 bg-electric-500/5 p-3 text-sm text-slate-700">
          <strong>Version sans compte :</strong> les chiffres ci-dessous proviennent de tes exercices sur cet appareil. Les
          comptes élèves, formateurs et administrateurs (avec synchronisation) arrivent à l’étape suivante du projet.
        </p>
        <StudentDashboard />
      </div>
    </>
  );
}
