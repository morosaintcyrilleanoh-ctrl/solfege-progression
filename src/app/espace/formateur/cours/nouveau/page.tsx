import { CourseForm } from '@/components/academy/CourseForms';
import { EspaceShell, Section } from '@/components/espace/EspaceShell';
import { requireRole } from '@/lib/auth/session';

export default async function NewCourse() {
  const { profile } = await requireRole(['trainer', 'admin'], '/espace/formateur/cours/nouveau');
  return (
    <EspaceShell profile={profile} title="Nouveau cours">
      <Section title="Informations">
        <CourseForm />
      </Section>
    </EspaceShell>
  );
}
