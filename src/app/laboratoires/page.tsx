import type { Metadata } from 'next';
import { ModuleCards } from '@/components/ModuleCards';
import { PageHero } from '@/components/layout/PageHero';

export const metadata: Metadata = { title: 'Laboratoires' };

export default function LabsPage() {
  return (
    <>
      <PageHero title="Laboratoires" subtitle="Des exercices interactifs pour pratiquer chaque notion du solfège." />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <ModuleCards />
      </div>
    </>
  );
}
