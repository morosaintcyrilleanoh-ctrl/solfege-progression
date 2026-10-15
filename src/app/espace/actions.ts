'use server';

import { revalidatePath } from 'next/cache';
import { getSession, requireUser } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { type ActionResult, fieldErrors, formObject, keepValues, profileSchema } from '@/lib/validation/forms';
import { importPayloadSchema } from '@/lib/validation/import';

export async function updateProfileAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase, userId } = await requireUser('/profil');
  const parsed = profileSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error), message: 'Corrige les champs indiqués.', values: keepValues(formData) };
  const v = parsed.data;
  const { data, error } = await supabase
    .from('profiles')
    .update({
      first_name: v.first_name,
      last_name: v.last_name,
      instrument: v.instrument || null,
      country: v.country || null,
      musical_background: v.musical_background || null,
      goals: v.goals || null,
      weekly_goal: v.weekly_goal,
    })
    .eq('id', userId)
    .select('id');
  if (error || !data?.length) return { ok: false, message: 'Le profil n’a pas pu être enregistré. Réessaie.', values: keepValues(formData) };
  revalidatePath('/profil');
  revalidatePath('/espace/eleve');
  return { ok: true, message: 'Profil enregistré.' };
}

/**
 * Importe vers le compte les résultats enregistrés sur l'appareil.
 * Les doublons sont ignorés grâce à l'identifiant de séance.
 */
export async function importLocalResultsAction(payload: unknown): Promise<ActionResult & { imported?: number }> {
  const { supabase, userId, profile } = await requireUser('/espace/eleve');
  const parsed = importPayloadSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, message: 'Données de l’appareil illisibles : import annulé.' };
  const { sessions, placement } = parsed.data;

  let imported = 0;
  if (sessions.length) {
    const rows = sessions.map((s) => ({
      user_id: userId,
      source: 'lab' as const,
      lab_id: s.lab_id,
      mode: s.mode,
      score: s.score,
      max_score: s.max_score,
      details: { skills: s.skills, imported_from: 'device' },
      client_session_id: s.client_session_id,
      started_at: s.started_at,
      completed_at: s.completed_at,
    }));
    const { data, error } = await supabase
      .from('exercise_attempts')
      .upsert(rows, { onConflict: 'user_id,client_session_id', ignoreDuplicates: true })
      .select('id');
    if (error) return { ok: false, message: 'L’import a échoué. Aucune donnée n’a été modifiée sur ton compte.' };
    imported = data?.length ?? 0;
  }
  // Le test de l'appareil ne remplace pas un niveau déjà enregistré sur le compte (ou fixé par le formateur).
  if (placement && !profile.placement) {
    const { error } = await supabase.rpc('record_placement', {
      p_level: placement.level,
      p_scores: placement.scores,
      p_client_session: `placement-${placement.takenAt}`.slice(0, 100),
    });
    if (error) return { ok: false, imported, message: `${imported} séance(s) importée(s), mais le test de positionnement n’a pas pu être enregistré.` };
  }
  revalidatePath('/espace/eleve');
  return {
    ok: true,
    imported,
    message:
      imported === 0 && !placement
        ? 'Rien de nouveau à importer : tes résultats sont déjà sur ton compte.'
        : `${imported} séance(s) importée(s)${placement && !profile.placement ? ' et test de positionnement enregistré' : ''}.`,
  };
}

/** Enregistre le test de positionnement sur le compte, si l'élève est connecté. */
export async function recordPlacementOnAccountAction(input: unknown): Promise<{ saved: boolean; message?: string }> {
  const session = await getSession();
  if (session.status !== 'authenticated') return { saved: false };
  const parsed = importPayloadSchema.shape.placement.unwrap().safeParse(input);
  if (!parsed.success) return { saved: false, message: 'Résultat illisible.' };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { saved: false };
  const { error } = await supabase.rpc('record_placement', {
    p_level: parsed.data.level,
    p_scores: parsed.data.scores,
    p_client_session: `placement-${parsed.data.takenAt}`.slice(0, 100),
  });
  if (error) return { saved: false, message: 'Le résultat n’a pas pu être enregistré sur ton compte.' };
  revalidatePath('/espace/eleve');
  return { saved: true, message: 'Résultat enregistré sur ton compte : ton niveau a été mis à jour.' };
}

/** Accès au module avancé selon le compte : niveau du profil ou déblocage par le formateur. */
export async function advancedAccessForAccountAction(): Promise<{ allowed: boolean; reason?: string }> {
  const session = await getSession();
  if (session.status !== 'authenticated') return { allowed: false };
  if (session.profile.role !== 'student') return { allowed: true, reason: 'Accès formateur.' };
  if (session.profile.level !== 'debutant') return { allowed: true, reason: 'Débloqué par ton niveau enregistré sur ton compte.' };
  const supabase = await createSupabaseServerClient();
  const { data } = (await supabase?.from('module_unlocks').select('id').eq('lab_key', 'intervalles').eq('student_id', session.userId).limit(1)) ?? { data: null };
  if (data?.length) return { allowed: true, reason: 'Débloqué pour toi par ton formateur.' };
  return { allowed: false };
}
