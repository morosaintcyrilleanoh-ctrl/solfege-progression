import type { Metadata } from 'next';
import { HistoryView } from '@/components/labs/note-reading/HistoryView';
import { PageHero } from '@/components/layout/PageHero';

export const metadata: Metadata = { title: 'Historique · Lecture des notes' };

export default function HistoryPage() {
  return (
    <>
      <PageHero eyebrow="Lecture des notes" title="Mon historique" subtitle="Tes séances, tes scores et les notes à revoir." />
      <div className="mx-auto max-w-3xl px-3 py-4 sm:px-4 sm:py-6">
        <HistoryView />
      </div>
    </>
  );
}
