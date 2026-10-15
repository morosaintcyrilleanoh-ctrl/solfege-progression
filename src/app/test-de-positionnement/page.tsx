import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/PageHero';
import { PlacementTest } from '@/components/placement/PlacementTest';

export const metadata: Metadata = { title: 'Test de positionnement' };

export default function PlacementPage() {
  return (
    <>
      <PageHero title="Test de positionnement" subtitle="Quelques minutes pour savoir par où commencer." />
      <div className="mx-auto max-w-3xl px-3 py-4 sm:px-4 sm:py-6">
        <PlacementTest />
      </div>
    </>
  );
}
