'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/session';
import type { Json } from '@/lib/supabase/database.types';
import { submissionSchema } from '@/lib/validation/academy';
import { type ActionResult, fieldErrors, formObject, keepValues } from '@/lib/validation/forms';

const uuid = z.string().uuid();

export async function enrollSelfAction(courseId: string, slug: string) {
  const { supabase, userId } = await requireUser(`/cours/${slug}`);
  // Le RLS n'accepte que les cours publiés et ouverts.
  const { data, error } = await supabase.from('enrollments').insert({ course_id: courseId, user_id: userId }).select('id');
  if (error || !data?.length) throw new Error('Inscription impossible : ce cours n’est pas ouvert à l’inscription libre.');
  revalidatePath(`/cours/${slug}`);
}

const progressSchema = z.object({
  lessonId: z.string().uuid(),
  status: z.enum(['in_progress', 'completed']),
  percent: z.number().int().min(0).max(100),
  scroll: z.number().min(0).max(1).optional(),
});

/** Enregistre où l'élève en est dans une leçon (jamais de retour de « terminé » à « en cours »). */
export async function saveProgressAction(input: unknown): Promise<{ ok: boolean; message?: string }> {
  const parsed = progressSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { supabase, userId } = await requireUser('/cours');
  const { lessonId, status, percent, scroll } = parsed.data;
  const { data: existing } = await supabase.from('learning_progress').select('status, progress_percent').eq('user_id', userId).eq('lesson_id', lessonId).maybeSingle();
  const finalStatus = existing?.status === 'completed' ? 'completed' : status;
  const row = {
    user_id: userId,
    lesson_id: lessonId,
    status: finalStatus,
    progress_percent: finalStatus === 'completed' ? 100 : Math.max(percent, existing?.progress_percent ?? 0),
    last_position: { scroll: scroll ?? 0 } as Json,
    completed_at: finalStatus === 'completed' ? new Date().toISOString() : null,
  };
  const { data, error } = await supabase.from('learning_progress').upsert(row, { onConflict: 'user_id,lesson_id' }).select('status');
  if (error || !data?.length) return { ok: false, message: 'Progression non enregistrée (connexion ?).' };
  if (status === 'completed') revalidatePath('/espace/eleve');
  return { ok: true, message: status === 'completed' ? 'Leçon terminée !' : undefined };
}

const answersSchema = z.record(
  z.string().uuid(),
  z.union([
    z.object({ choiceId: z.string().max(40) }),
    z.object({ text: z.string().max(200) }),
    z.object({ mapping: z.array(z.string().max(200)).max(12) }),
  ]),
);

export type ExerciseResult = {
  ok: boolean;
  message?: string;
  score?: number;
  maxScore?: number;
  results?: { question_id: string; correct: boolean; expected: Json; explanation: string }[];
};

/** Envoie les réponses : la correction est faite par la base (le corrigé n'est jamais envoyé au navigateur avant). */
export async function submitExerciseAction(exerciseId: string, answers: unknown, assignmentId: string | null): Promise<ExerciseResult> {
  const { supabase } = await requireUser(`/espace/eleve/exercices/${exerciseId}`);
  if (!uuid.safeParse(exerciseId).success || (assignmentId && !uuid.safeParse(assignmentId).success)) return { ok: false, message: 'Requête invalide.' };
  const parsed = answersSchema.safeParse(answers);
  if (!parsed.success) return { ok: false, message: 'Réponses illisibles.' };
  const { data, error } = await supabase.rpc('submit_exercise_attempt', { p_exercise_id: exerciseId, p_answers: parsed.data as Json, p_assignment_id: assignmentId });
  if (error) return { ok: false, message: error.code === '42501' ? error.message : 'Envoi impossible. Vérifie ta connexion : tes réponses n’ont pas été enregistrées.' };
  const r = data as { score: number; max_score: number; results: ExerciseResult['results'] };
  if (assignmentId) revalidatePath(`/espace/eleve/devoirs/${assignmentId}`);
  revalidatePath('/espace/eleve');
  return { ok: true, score: r.score, maxScore: r.max_score, results: r.results };
}

export async function submitAssignmentAction(assignmentId: string, _p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase, userId } = await requireUser(`/espace/eleve/devoirs/${assignmentId}`);
  const parsed = submissionSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error), values: keepValues(formData) };
  const { data: existing } = await supabase.from('assignment_submissions').select('id, status').eq('assignment_id', assignmentId).eq('student_id', userId).maybeSingle();
  if (existing?.status === 'reviewed') return { ok: false, message: 'Ce devoir a déjà été corrigé.' };
  const res = existing
    ? await supabase.from('assignment_submissions').update({ content: parsed.data.content }).eq('id', existing.id).select('id')
    : await supabase.from('assignment_submissions').insert({ assignment_id: assignmentId, student_id: userId, content: parsed.data.content }).select('id');
  if (res.error || !res.data?.length) return { ok: false, message: 'Envoi impossible. Ton texte n’a pas été enregistré.', values: keepValues(formData) };
  revalidatePath(`/espace/eleve/devoirs/${assignmentId}`);
  return { ok: true, message: 'Devoir envoyé à ton formateur.' };
}

export async function attachSubmissionFileAction(assignmentId: string, path: string): Promise<{ ok: boolean; message?: string }> {
  const { supabase, userId } = await requireUser(`/espace/eleve/devoirs/${assignmentId}`);
  if (!path.startsWith(`${assignmentId}/${userId}/`)) return { ok: false, message: 'Chemin invalide.' };
  const { data: existing } = await supabase.from('assignment_submissions').select('id, status, attachment_path').eq('assignment_id', assignmentId).eq('student_id', userId).maybeSingle();
  if (existing?.status === 'reviewed') {
    await supabase.storage.from('submissions').remove([path]);
    return { ok: false, message: 'Ce devoir a déjà été corrigé.' };
  }
  const res = existing
    ? await supabase.from('assignment_submissions').update({ attachment_path: path }).eq('id', existing.id).select('id')
    : await supabase.from('assignment_submissions').insert({ assignment_id: assignmentId, student_id: userId, attachment_path: path }).select('id');
  if (res.error || !res.data?.length) {
    await supabase.storage.from('submissions').remove([path]);
    return { ok: false, message: 'Le fichier n’a pas pu être joint.' };
  }
  if (existing?.attachment_path && existing.attachment_path !== path) await supabase.storage.from('submissions').remove([existing.attachment_path]);
  revalidatePath(`/espace/eleve/devoirs/${assignmentId}`);
  return { ok: true, message: 'Fichier joint à ton devoir.' };
}
