/**
 * Validation des formulaires (côté serveur, dans les actions). Les mêmes
 * limites que les contraintes de la base, pour des messages clairs.
 */
import { z } from 'zod';

const trimmed = (max: number) => z.string().trim().max(max, `${max} caractères maximum.`);

export const emailSchema = z.string().trim().toLowerCase().email('Adresse e-mail invalide.').max(254);

export const passwordSchema = z
  .string()
  .min(8, 'Au moins 8 caractères.')
  .max(72, '72 caractères maximum.')
  .regex(/[A-Za-z]/, 'Au moins une lettre.')
  .regex(/\d/, 'Au moins un chiffre.');

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mot de passe requis.').max(72),
});

export const signUpSchema = z
  .object({
    first_name: trimmed(80).min(1, 'Prénom requis.'),
    last_name: trimmed(80),
    email: emailSchema,
    password: passwordSchema,
    password_confirm: z.string(),
    invite_code: trimmed(60).optional().default(''),
    consent: z.literal('on', { message: 'Merci d’accepter les conditions d’utilisation.' }),
  })
  .refine((d) => d.password === d.password_confirm, { message: 'Les deux mots de passe ne correspondent pas.', path: ['password_confirm'] });

export const resetRequestSchema = z.object({ email: emailSchema });

export const newPasswordSchema = z
  .object({ password: passwordSchema, password_confirm: z.string() })
  .refine((d) => d.password === d.password_confirm, { message: 'Les deux mots de passe ne correspondent pas.', path: ['password_confirm'] });

export const profileSchema = z.object({
  first_name: trimmed(80).min(1, 'Prénom requis.'),
  last_name: trimmed(80),
  instrument: trimmed(80),
  country: trimmed(80),
  musical_background: trimmed(1000),
  goals: trimmed(1000),
  weekly_goal: z.coerce.number().int('Nombre entier.').min(10, 'Au moins 10.').max(2000, '2000 au maximum.'),
});

export type FieldErrors = Record<string, string>;

/** Premier message d'erreur par champ. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    out[key] ??= issue.message;
  }
  return out;
}

export function formObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === 'string') obj[key] = value;
  });
  return obj;
}

export interface ActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: FieldErrors;
  /** Valeurs saisies, renvoyées en cas d'erreur pour ne pas vider le formulaire (jamais les mots de passe). */
  values?: Record<string, string>;
}

export function keepValues(formData: FormData): Record<string, string> {
  const v = formObject(formData);
  for (const k of Object.keys(v)) if (k.includes('password')) delete v[k];
  return v;
}
