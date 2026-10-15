import { ExerciseForm } from '@/components/academy/ExerciseForms';
import { EspaceShell, Section } from '@/components/espace/EspaceShell';
import { requireRole } from '@/lib/auth/session';
import { trainerOptions } from '@/lib/data/trainer-options';

export default async function NewExercise() {
  const { profile, supabase, userId } = await requireRole(['trainer', 'admin'], '/espace/formateur/exercices/nouveau');
  const opts = await trainerOptions(supabase, userId, profile.role === 'admin');
  return (
    <EspaceShell profile={profile} title="Nouvel exercice">
      <Section title="Informations">
        <ExerciseForm courses={opts.courses} lessons={opts.lessons} />
      </Section>
    </EspaceShell>
  );
}
