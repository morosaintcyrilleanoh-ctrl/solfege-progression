import type { Metadata } from 'next';
import { AccountBanner } from '@/components/dashboard/AccountBanner';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { PageHero } from '@/components/layout/PageHero';

export const metadata: Metadata = { title: 'Tableau de bord' };

export default function DashboardPage() {
  return (
    <>
      <PageHero title="Mon tableau de bord" subtitle="Tes résultats sur cet appareil." />
      <div className="mx-auto max-w-6xl px-4 py-5">
        <AccountBanner />
        <StudentDashboard />
      </div>
    </>
  );
}
