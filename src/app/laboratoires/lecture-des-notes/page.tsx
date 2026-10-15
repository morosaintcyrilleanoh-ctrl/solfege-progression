import type { Metadata } from 'next';
import { NoteReadingLab } from '@/components/labs/note-reading/NoteReadingLab';
import { PageHero } from '@/components/layout/PageHero';

export const metadata: Metadata = {
  title: 'Lecture des notes',
  description: 'Laboratoire interactif de lecture des notes en clé de sol et en clé de fa.',
};

export default function NoteReadingPage() {
  return (
    <>
      <PageHero
        eyebrow="Module 1 · Laboratoire"
        title="Lecture des notes"
        subtitle="Clé de sol, clé de fa, lignes supplémentaires et altérations : lis la note, réponds, progresse."
      />
      <div className="mx-auto max-w-3xl px-3 py-4 sm:px-4 sm:py-6">
        <NoteReadingLab />
      </div>
    </>
  );
}
