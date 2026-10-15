'use client';

import { updateProfileAction } from '@/app/espace/actions';
import { ActionForm, Field } from '@/components/forms/Form';
import type { ProfileRow } from '@/lib/supabase/database.types';

export function ProfileForm({ profile }: { profile: ProfileRow }) {
  return (
    <ActionForm action={updateProfileAction} submitLabel="Enregistrer mon profil">
      {(s) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="first_name" label="Prénom" required maxLength={80} defaultValue={s?.values?.first_name ?? profile.first_name} error={s?.fieldErrors?.first_name} autoComplete="given-name" />
            <Field name="last_name" label="Nom" maxLength={80} defaultValue={s?.values?.last_name ?? profile.last_name} error={s?.fieldErrors?.last_name} autoComplete="family-name" />
            <Field name="instrument" label="Instrument ou voix" maxLength={80} defaultValue={s?.values?.instrument ?? profile.instrument} error={s?.fieldErrors?.instrument} hint="Ex. piano, guitare, chant (soprano)…" />
            <Field name="country" label="Pays / ville" maxLength={80} defaultValue={s?.values?.country ?? profile.country} error={s?.fieldErrors?.country} />
          </div>
          <Field name="musical_background" label="Ton parcours musical" as="textarea" maxLength={1000} defaultValue={s?.values?.musical_background ?? profile.musical_background} error={s?.fieldErrors?.musical_background} />
          <Field name="goals" label="Tes objectifs" as="textarea" maxLength={1000} defaultValue={s?.values?.goals ?? profile.goals} error={s?.fieldErrors?.goals} />
          <Field
            name="weekly_goal"
            label="Objectif de la semaine (nombre de réponses)"
            type="number"
            inputMode="numeric"
            min={10}
            max={2000}
            defaultValue={s?.values?.weekly_goal ?? profile.weekly_goal}
            error={s?.fieldErrors?.weekly_goal}
          />
        </>
      )}
    </ActionForm>
  );
}
