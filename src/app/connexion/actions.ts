'use server';

import { redirect } from 'next/navigation';
import { authErrorMessage } from '@/lib/auth/errors';
import { safeNextPath } from '@/lib/auth/redirects';
import { siteUrl } from '@/lib/auth/site-url';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  type ActionResult,
  fieldErrors,
  formObject,
  keepValues,
  newPasswordSchema,
  resetRequestSchema,
  signInSchema,
  signUpSchema,
} from '@/lib/validation/forms';

const NOT_CONFIGURED: ActionResult = { ok: false, message: 'La connexion n’est pas encore configurée sur ce site.' };

export async function signInAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error), values: keepValues(formData) };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, message: authErrorMessage(error), values: keepValues(formData) };
  redirect(safeNextPath(String(formData.get('suivant') ?? '')));
}

export async function signUpAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error), values: keepValues(formData) };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;
  // Réglage de la plateforme (à doubler par le réglage « Allow new users to sign up » de Supabase Auth).
  const { data: setting } = await supabase.from('platform_settings').select('value').eq('key', 'signup.open').maybeSingle();
  if (setting && setting.value === false) return { ok: false, message: 'Les inscriptions sont fermées pour le moment. Contacte ton formateur.' };
  const { email, password, first_name, last_name } = parsed.data;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Seuls le prénom et le nom sont transmis ; le rôle est toujours « élève » (fixé par la base).
      data: { first_name, last_name },
      emailRedirectTo: `${await siteUrl()}/auth/confirmation?suivant=/profil`,
    },
  });
  if (error) return { ok: false, message: authErrorMessage(error), values: keepValues(formData) };
  if (data.session) redirect('/profil?bienvenue=1');
  return { ok: true, message: `Compte créé. Un e-mail de confirmation a été envoyé à ${email} : clique sur le lien qu’il contient pour activer ton compte.` };
}

export async function resetRequestAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = resetRequestSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error), values: keepValues(formData) };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteUrl()}/auth/confirmation?suivant=/nouveau-mot-de-passe`,
  });
  // Même réponse que l'adresse existe ou non (ne pas révéler les comptes existants).
  if (error && error.status === 429) return { ok: false, message: authErrorMessage(error) };
  return { ok: true, message: 'Si un compte existe avec cette adresse, un e-mail de réinitialisation vient d’être envoyé.' };
}

export async function newPasswordAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = newPasswordSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error), values: keepValues(formData) };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, message: authErrorMessage(error), values: keepValues(formData) };
  return { ok: true, message: 'Mot de passe modifié.' };
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect('/');
}
