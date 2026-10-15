import type { Metadata } from 'next';
import { ScalesLab } from '@/components/labs/scales/ScalesLab';
import { PageHero } from '@/components/layout/PageHero';

export const metadata: Metadata = { title: 'Tonalités et gammes', description: 'Armures, cycle des quintes, gammes majeures et mineures.' };

export default function ScalesPage() {
  return (
    <>
      <PageHero
        eyebrow="Module 3 · Laboratoire"
        title="Tonalités et gammes"
        subtitle="Tons et demi-tons, armures, cycle des quintes, gammes majeures et mineures, degrés."
      />
      <div className="mx-auto max-w-3xl px-3 py-4 sm:px-4 sm:py-6">
        <ScalesLab />
      </div>
    </>
  );
}
