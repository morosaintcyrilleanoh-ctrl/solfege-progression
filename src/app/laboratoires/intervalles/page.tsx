import type { Metadata } from 'next';
import { ModuleGate } from '@/components/labs/ModuleGate';
import { QuizLabIntervals } from '@/components/labs/scales/QuizLabIntervals';
import { PageHero } from '@/components/layout/PageHero';

export const metadata: Metadata = { title: 'Intervalles et théorie', description: 'Intervalles, accords, renversements, fonctions harmoniques.' };

export default function IntervalsPage() {
  return (
    <>
      <PageHero
        eyebrow="Module 4 · Laboratoire avancé"
        title="Intervalles et théorie musicale"
        subtitle="Intervalles mélodiques et harmoniques, accords, renversements, degrés et fonctions, lecture mélodique, cadences."
      />
      <div className="mx-auto max-w-3xl px-3 py-4 sm:px-4 sm:py-6">
        <ModuleGate>
          <QuizLabIntervals />
        </ModuleGate>
      </div>
    </>
  );
}
