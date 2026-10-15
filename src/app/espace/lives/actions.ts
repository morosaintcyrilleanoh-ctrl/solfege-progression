'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/session';
import { announcementSchema, liveSchema } from '@/lib/validation/academy';
import { type ActionResult, fieldErrors, formObject, keepValues } from '@/lib/validation/forms';

function failed(error: { code?: string } | null): string {
  return error?.code === '42501' || !error ? 'Action non autorisée pour ce public (vérifie le cours ou le groupe choisi).' : 'L’enregistrement a échoué. Réessaie.';
}

export async function saveLiveAction(liveId: string | null, _p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase, userId } = await requireRole(['trainer', 'admin'], '/espace/lives');
  const parsed = liveSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error), values: keepValues(formData) };
  const row = {
    ...parsed.data,
    course_id: parsed.data.audience === 'course' ? parsed.data.course_id : null,
    group_id: parsed.data.audience === 'group' ? parsed.data.group_id : null,
  };
  const res = liveId
    ? await supabase.from('live_sessions').update(row).eq('id', liveId).select('id')
    : await supabase.from('live_sessions').insert({ ...row, trainer_id: userId }).select('id');
  if (res.error || !res.data?.length) return { ok: false, message: failed(res.error), values: keepValues(formData) };
  revalidatePath('/espace/lives');
  redirect(`/espace/lives/${res.data[0]!.id}`);
}

export async function registerReplayFileAction(liveId: string, path: string): Promise<ActionResult> {
  const { supabase } = await requireRole(['trainer', 'admin'], `/espace/lives/${liveId}`);
  if (!path.startsWith(`${liveId}/`)) return { ok: false, message: 'Chemin invalide.' };
  const { data, error } = await supabase.from('live_sessions').update({ replay_path: path, status: 'completed' }).eq('id', liveId).select('id');
  if (error || !data?.length) {
    await supabase.storage.from('replays').remove([path]);
    return { ok: false, message: failed(error) };
  }
  revalidatePath(`/espace/lives/${liveId}`);
  return { ok: true, message: 'Replay ajouté.' };
}

export async function deleteLiveAction(liveId: string) {
  const { supabase } = await requireRole(['trainer', 'admin'], '/espace/lives');
  const { data, error } = await supabase.from('live_sessions').delete().eq('id', liveId).select('replay_path');
  if (error || !data?.length) throw new Error(failed(error));
  if (data[0]?.replay_path) await supabase.storage.from('replays').remove([data[0].replay_path]);
  redirect('/espace/lives');
}

export async function saveAnnouncementAction(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase, userId } = await requireRole(['trainer', 'admin'], '/espace/annonces');
  const parsed = announcementSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error), values: keepValues(formData) };
  const row = {
    ...parsed.data,
    author_id: userId,
    course_id: parsed.data.audience === 'course' ? parsed.data.course_id : null,
    group_id: parsed.data.audience === 'group' ? parsed.data.group_id : null,
  };
  const { data, error } = await supabase.from('announcements').insert(row).select('id');
  if (error || !data?.length) return { ok: false, message: failed(error), values: keepValues(formData) };
  revalidatePath('/espace/annonces');
  return { ok: true, message: parsed.data.status === 'published' ? 'Annonce publiée.' : 'Annonce enregistrée en brouillon.' };
}

export async function setAnnouncementStatusAction(id: string, status: 'draft' | 'published') {
  const { supabase } = await requireRole(['trainer', 'admin'], '/espace/annonces');
  const { data, error } = await supabase.from('announcements').update({ status }).eq('id', id).select('id');
  if (error || !data?.length) throw new Error(failed(error));
  revalidatePath('/espace/annonces');
}

export async function deleteAnnouncementAction(id: string) {
  const { supabase } = await requireRole(['trainer', 'admin'], '/espace/annonces');
  const { data, error } = await supabase.from('announcements').delete().eq('id', id).select('id');
  if (error || !data?.length) throw new Error(failed(error));
  revalidatePath('/espace/annonces');
}
