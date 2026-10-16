'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth/session';
import type { Json } from '@/lib/supabase/database.types';
import { type ActionResult } from '@/lib/validation/forms';

const roleSchema = z.enum(['admin', 'trainer', 'student']);

function message(error: { code?: string; message?: string } | null) {
  return error?.code === '42501' || error?.code === 'P0002' ? error.message ?? 'Action refusée.' : 'L’opération a échoué. Réessaie.';
}

export async function setRoleAction(userId: string, _p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireRole(['admin'], '/espace/admin/comptes');
  const role = roleSchema.safeParse(formData.get('role'));
  if (!role.success) return { ok: false, message: 'Rôle invalide.' };
  const { error } = await supabase.rpc('set_user_role', { p_user: userId, p_role: role.data });
  if (error) return { ok: false, message: message(error) };
  revalidatePath('/espace/admin/comptes');
  return { ok: true, message: 'Rôle mis à jour.' };
}

export async function setActiveAction(userId: string, active: boolean) {
  const { supabase } = await requireRole(['admin'], '/espace/admin/comptes');
  const { error } = await supabase.rpc('set_user_active', { p_user: userId, p_active: active });
  if (error) throw new Error(message(error));
  revalidatePath('/espace/admin/comptes');
}

const settingsSchema = z.object({
  site_name: z.string().trim().min(2, 'Au moins 2 caractères.').max(80),
  signup_open: z.preprocess((v) => v === 'on', z.boolean()),
  default_weekly_goal: z.coerce.number().int().min(10).max(2000),
});

export async function saveInviteCodeAction(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireRole(['admin'], '/espace/admin/parametres');
  const code = z.string().max(60).safeParse(formData.get('invite_code') ?? '');
  if (!code.success) return { ok: false, fieldErrors: { invite_code: '60 caractères maximum.' } };
  const { data, error } = await supabase.rpc('set_invite_code', { p_code: code.data });
  if (error) {
    const invalid = error.code === '22023';
    return { ok: false, fieldErrors: invalid ? { invite_code: error.message } : undefined, message: invalid ? undefined : message(error), values: { invite_code: code.data } };
  }
  revalidatePath('/espace/admin/parametres');
  return {
    ok: true,
    message: data ? `Code enregistré : ${data}. Il est désormais obligatoire pour créer un compte.` : 'Code supprimé : l’inscription ne demande plus de code.',
  };
}

export async function saveSettingsAction(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase, userId } = await requireRole(['admin'], '/espace/admin/parametres');
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: 'Paramètres invalides.', fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
  const rows: { key: string; value: Json; updated_by: string }[] = [
    { key: 'site.name', value: parsed.data.site_name, updated_by: userId },
    { key: 'signup.open', value: parsed.data.signup_open, updated_by: userId },
    { key: 'student.default_weekly_goal', value: parsed.data.default_weekly_goal, updated_by: userId },
  ];
  const { data, error } = await supabase.from('platform_settings').upsert(rows, { onConflict: 'key' }).select('key');
  if (error || (data?.length ?? 0) !== rows.length) return { ok: false, message: 'Les paramètres n’ont pas été enregistrés.' };
  revalidatePath('/espace/admin/parametres');
  return { ok: true, message: 'Paramètres enregistrés.' };
}
