'use client';

import { saveInviteCodeAction, saveSettingsAction, setRoleAction } from '@/app/espace/admin/actions';
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

export function InviteCodeForm({ code }: { code: string | null }) {
  return (
    <ActionForm action={saveInviteCodeAction} submitLabel="Enregistrer le code">
      {(s) => (
        <Field
          name="invite_code"
          label="Code d’invitation"
          maxLength={60}
          autoComplete="off"
          defaultValue={s?.values?.invite_code ?? code ?? ''}
          hint="Donnez-le à vos élèves. Lettres sans accent, chiffres ou tirets (4 à 40). Laissez vide pour ne plus demander de code."
          error={s?.fieldErrors?.invite_code}
        />
      )}
    </ActionForm>
  );
}
