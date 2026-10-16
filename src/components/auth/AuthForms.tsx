'use client';

import Link from 'next/link';
import { newPasswordAction, resetRequestAction, signInAction, signUpAction } from '@/app/connexion/actions';
import { ActionForm, Field } from '@/components/forms/Form';

export function LoginForm({ next }: { next: string }) {
  return (
    <ActionForm action={signInAction} submitLabel="Se connecter" pendingLabel="Connexion…">
      {(s) => (
        <>
          <input type="hidden" name="suivant" value={next} />
          <Field name="email" defaultValue={s?.values?.email} label="Adresse e-mail" type="email" autoComplete="email" inputMode="email" required error={s?.fieldErrors?.email} />
          <Field name="password" label="Mot de passe" type="password" autoComplete="current-password" required error={s?.fieldErrors?.password} />
          <p className="text-right text-sm">
            <Link href="/mot-de-passe-oublie" className="font-semibold text-electric-600 hover:underline">
              Mot de passe oublié ?
            </Link>
          </p>
        </>
      )}
    </ActionForm>
  );
}

export function SignUpForm() {
  return (
    <ActionForm action={signUpAction} submitLabel="Créer mon compte" pendingLabel="Création…">
      {(s) =>
        s?.ok ? null : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="first_name" defaultValue={s?.values?.first_name} label="Prénom" autoComplete="given-name" required maxLength={80} error={s?.fieldErrors?.first_name} />
              <Field name="last_name" defaultValue={s?.values?.last_name} label="Nom" autoComplete="family-name" maxLength={80} error={s?.fieldErrors?.last_name} />
            </div>
            <Field name="email" defaultValue={s?.values?.email} label="Adresse e-mail" type="email" autoComplete="email" inputMode="email" required error={s?.fieldErrors?.email} />
            <Field
              name="password"
              label="Mot de passe"
              type="password"
              autoComplete="new-password"
              required
              hint="Au moins 8 caractères, avec des lettres et des chiffres."
              error={s?.fieldErrors?.password}
            />
            <Field name="password_confirm" label="Confirme le mot de passe" type="password" autoComplete="new-password" required error={s?.fieldErrors?.password_confirm} />
            <Field
              name="invite_code"
              defaultValue={s?.values?.invite_code}
              label="Code d’invitation"
              autoComplete="off"
              maxLength={60}
              hint="Donné par ton formateur. Laisse vide si on ne t’en a pas donné."
              error={s?.fieldErrors?.invite_code}
            />
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" name="consent" className="mt-1 size-4 accent-electric-500" />
              <span>
                J’accepte que mes résultats d’exercices soient enregistrés et consultés par mes formateurs pour suivre ma progression.
              </span>
            </label>
            {s?.fieldErrors?.consent && <p className="text-sm text-danger-700">{s.fieldErrors.consent}</p>}
          </>
        )
      }
    </ActionForm>
  );
}

export function ResetRequestForm() {
  return (
    <ActionForm action={resetRequestAction} submitLabel="Recevoir le lien" pendingLabel="Envoi…">
      {(s) => <Field name="email" defaultValue={s?.values?.email} label="Adresse e-mail" type="email" autoComplete="email" inputMode="email" required error={s?.fieldErrors?.email} />}
    </ActionForm>
  );
}

export function NewPasswordForm() {
  return (
    <ActionForm action={newPasswordAction} submitLabel="Enregistrer le mot de passe">
      {(s) =>
        s?.ok ? (
          <Link href="/espace" className="font-semibold text-electric-600 hover:underline">
            Aller à mon espace
          </Link>
        ) : (
          <>
            <Field name="password" label="Nouveau mot de passe" type="password" autoComplete="new-password" required hint="Au moins 8 caractères, avec des lettres et des chiffres." error={s?.fieldErrors?.password} />
            <Field name="password_confirm" label="Confirme le mot de passe" type="password" autoComplete="new-password" required error={s?.fieldErrors?.password_confirm} />
          </>
        )
      }
    </ActionForm>
  );
}
