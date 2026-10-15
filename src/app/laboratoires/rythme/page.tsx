import type { Metadata } from 'next';
import { RhythmLab } from '@/components/labs/rhythm/RhythmLab';
import { PageHero } from '@/components/layout/PageHero';

export const metadata: Metadata = {
  title: 'Rythme, temps et mesures',
  description: 'Laboratoire rythmique : figures, silences, mesures, métronome et pulsation.',
};

export default function RhythmPage() {
  return (
    <>
      <PageHero
        eyebrow="Module 2 · Laboratoire"
        title="Rythme, temps et mesures"
        subtitle="Figures et silences, mesures simples et composées, syncopes, tempo, métronome et pulsation."
      />
      <div className="mx-auto max-w-3xl px-3 py-4 sm:px-4 sm:py-6">
        <RhythmLab />
      </div>
    </>
  );
}
