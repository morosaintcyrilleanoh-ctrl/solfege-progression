'use client';

import { saveSettingsAction, setRoleAction } from '@/app/espace/admin/actions';
import { CheckboxField, SelectField } from '@/components/forms/Controls';
import { ActionForm, Field } from '@/components/forms/Form';

export function RoleForm({ userId, role }: { userId: string; role: string }) {
  return (
    <ActionForm action={setRoleAction.bind(null, userId)} submitLabel="Changer le rôle" className="!space-y-2">
      {() => (
        <SelectField
          name="role"
          label="Rôle"
          defaultValue={role}
          options={[
            { value: 'student', label: 'Élève' },
            { value: 'trainer', label: 'Formateur' },
            { value: 'admin', label: 'Administrateur' },
          ]}
        />
      )}
    </ActionForm>
  );
}

export function SettingsForm({ siteName, signupOpen, weeklyGoal }: { siteName: string; signupOpen: boolean; weeklyGoal: number }) {
  return (
    <ActionForm action={saveSettingsAction} submitLabel="Enregistrer les paramètres">
      {(s) => (
        <>
          <Field name="site_name" label="Nom de la plateforme" required maxLength={80} defaultValue={siteName} error={s?.fieldErrors?.site_name} />
          <CheckboxField
            name="signup_open"
            label="Inscriptions ouvertes"
            defaultChecked={signupOpen}
            hint="Pour une fermeture complète, désactivez aussi « Allow new users to sign up » dans Supabase > Authentication."
          />
          <Field name="default_weekly_goal" label="Objectif hebdomadaire par défaut (réponses)" type="number" min={10} max={2000} defaultValue={weeklyGoal} error={s?.fieldErrors?.default_weekly_goal} />
        </>
      )}
    </ActionForm>
  );
}
