'use server';

/**
 * Actions du formateur (et de l'administrateur). Chaque action :
 *  1. vérifie le rôle côté serveur ;
 *  2. valide les données (zod) ;
 *  3. agit avec la session de l'utilisateur : la base applique ses règles (RLS) ;
 *  4. vérifie qu'une ligne a réellement été modifiée avant d'annoncer un succès.
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireRole } from '@/lib/auth/session';
import { rowsFromForm, rowsFromQuestion } from '@/lib/content/questions';
import type { ExerciseGenerator } from '@/lib/exercises/generators';
import { RHYTHM_EXERCISES } from '@/lib/rhythm/questions';
import { INTERVAL_EXERCISES } from '@/lib/theory/interval-questions';
import { noteIdentificationQuestion } from '@/lib/theory/note-questions';
import { SCALE_EXERCISES } from '@/lib/theory/scale-questions';
import {
  assignmentSchema,
  commentSchema,
  courseSchema,
  emailOnlySchema,
  exerciseSchema,
  fileResourceSchema,
  groupSchema,
  lessonSchema,
  linkResourceSchema,
  moduleSchema,
  questionSchema,
  reviewSchema,
  slugify,
} from '@/lib/validation/academy';
import { type ActionResult, fieldErrors, formObject, keepValues } from '@/lib/validation/forms';

const uuid = z.string().uuid();

async function staff(path: string) {
  return requireRole(['trainer', 'admin'], path);
}

function invalid(error: z.ZodError, formData: FormData): ActionResult {
  return { ok: false, fieldErrors: fieldErrors(error), message: 'Corrige les champs indiqués.', values: keepValues(formData) };
}

const REFUSED = 'Modification refusée ou élément introuvable (vérifie que tu en es bien responsable).';

/** Message lisible pour une erreur de la base, sans détails techniques. */
function dbMessage(error: { code?: string; message?: string } | null): string {
  if (!error) return REFUSED;
  if (error.code === '42501') return error.message && !error.message.includes('row-level') ? error.message : 'Action non autorisée.';
  if (error.code === '23505') return 'Cet élément existe déjà.';
  if (error.code === '23503') return 'Élément lié introuvable.';
  if (error.code === 'P0002') return error.message ?? 'Introuvable.';
  return 'L’enregistrement a échoué. Réessaie.';
}

// =============================================================================
// Cours
// =============================================================================
export async function createCourseAction(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase, userId } = await staff('/espace/formateur/cours');
  const parsed = courseSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const base = slugify(parsed.data.title) || 'cours';
  let id: string | null = null;
  for (let attempt = 0; attempt < 4 && !id; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase.from('courses').insert({ ...parsed.data, slug, owner_id: userId }).select('id').single();
    if (data) id = data.id;
    else if (error?.code !== '23505') return { ok: false, message: dbMessage(error), values: keepValues(formData) };
  }
  if (!id) return { ok: false, message: 'Impossible de créer un identifiant unique pour ce cours.' };
  revalidatePath('/espace/formateur/cours');
  redirect(`/espace/formateur/cours/${id}`);
}

export async function updateCourseAction(courseId: string, _p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase } = await staff(`/espace/formateur/cours/${courseId}`);
  if (!uuid.safeParse(courseId).success) return { ok: false, message: REFUSED };
  const parsed = courseSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const { data, error } = await supabase.from('courses').update(parsed.data).eq('id', courseId).select('id');
  if (error || !data?.length) return { ok: false, message: dbMessage(error), values: keepValues(formData) };
  revalidatePath(`/espace/formateur/cours/${courseId}`);
  revalidatePath('/cours');
  return { ok: true, message: parsed.data.status === 'published' ? 'Cours enregistré et publié.' : 'Cours enregistré (brouillon).' };
}

export async function deleteCourseAction(courseId: string) {
  const { supabase } = await staff('/espace/formateur/cours');
  const { data, error } = await supabase.from('courses').delete().eq('id', courseId).select('id');
  if (error || !data?.length) throw new Error(dbMessage(error));
  revalidatePath('/espace/formateur/cours');
  redirect('/espace/formateur/cours');
}

// =============================================================================
// Modules et leçons
// =============================================================================
export async function createModuleAction(courseId: string, _p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase } = await staff(`/espace/formateur/cours/${courseId}`);
  const parsed = moduleSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const { data, error } = await supabase.from('modules').insert({ ...parsed.data, course_id: courseId }).select('id').single();
  if (error || !data) return { ok: false, message: dbMessage(error), values: keepValues(formData) };
  revalidatePath(`/espace/formateur/cours/${courseId}`);
  return { ok: true, message: 'Module ajouté.' };
}

export async function updateModuleAction(moduleId: string, _p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase } = await staff('/espace/formateur/cours');
  const parsed = moduleSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const { data, error } = await supabase.from('modules').update(parsed.data).eq('id', moduleId).select('id, course_id');
  if (error || !data?.length) return { ok: false, message: dbMessage(error), values: keepValues(formData) };
  revalidatePath(`/espace/formateur/cours/${data[0]!.course_id}`);
  return { ok: true, message: 'Module enregistré.' };
}

export async function deleteModuleAction(moduleId: string) {
  const { supabase } = await staff('/espace/formateur/cours');
  const { data, error } = await supabase.from('modules').delete().eq('id', moduleId).select('course_id');
  if (error || !data?.length) throw new Error(dbMessage(error));
  revalidatePath(`/espace/formateur/cours/${data[0]!.course_id}`);
}

export async function createLessonAction(moduleId: string, _p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase } = await staff('/espace/formateur/cours');
  const parsed = lessonSchema.safeParse({ summary: '', content: '', video_url: '', duration_minutes: '', status: 'draft', position: '0', ...formObject(formData) });
  if (!parsed.success) return invalid(parsed.error, formData);
  const { data, error } = await supabase.from('lessons').insert({ ...parsed.data, module_id: moduleId }).select('id').single();
  if (error || !data) return { ok: false, message: dbMessage(error), values: keepValues(formData) };
  redirect(`/espace/formateur/lecons/${data.id}`);
}

export async function updateLessonAction(lessonId: string, _p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase } = await staff(`/espace/formateur/lecons/${lessonId}`);
  const parsed = lessonSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const { data, error } = await supabase.from('lessons').update(parsed.data).eq('id', lessonId).select('id');
  if (error || !data?.length) return { ok: false, message: dbMessage(error), values: keepValues(formData) };
  revalidatePath(`/espace/formateur/lecons/${lessonId}`);
  return { ok: true, message: parsed.data.status === 'published' ? 'Leçon enregistrée et publiée.' : 'Leçon enregistrée (brouillon).' };
}

export async function deleteLessonAction(lessonId: string, courseId: string) {
  const { supabase } = await staff('/espace/formateur/cours');
  // Fichiers privés de la leçon : supprimés du stockage avec elle.
  const files = await supabase.from('lesson_resources').select('storage_path').eq('lesson_id', lessonId).not('storage_path', 'is', null);
  const { data, error } = await supabase.from('lessons').delete().eq('id', lessonId).select('id');
  if (error || !data?.length) throw new Error(dbMessage(error));
  const paths = (files.data ?? []).map((f) => f.storage_path).filter((p): p is string => !!p);
  if (paths.length) await supabase.storage.from('course-files').remove(paths);
  redirect(`/espace/formateur/cours/${courseId}`);
}

// =============================================================================
// Ressources
// =============================================================================
export async function addLinkResourceAction(lessonId: string, _p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase } = await staff(`/espace/formateur/lecons/${lessonId}`);
  const parsed = linkResourceSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const { data, error } = await supabase.from('lesson_resources').insert({ ...parsed.data, lesson_id: lessonId }).select('id');
  if (error || !data?.length) return { ok: false, message: dbMessage(error), values: keepValues(formData) };
  revalidatePath(`/espace/formateur/lecons/${lessonId}`);
  return { ok: true, message: 'Lien ajouté.' };
}

/** Enregistre un fichier déjà déposé dans le stockage (chemin vérifié). */
export async function registerFileResourceAction(lessonId: string, courseId: string, input: unknown): Promise<ActionResult> {
  const { supabase } = await staff(`/espace/formateur/lecons/${lessonId}`);
  const parsed = fileResourceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Fichier invalide.' };
  if (!parsed.data.storage_path.startsWith(`${courseId}/${lessonId}/`)) return { ok: false, message: 'Chemin de fichier invalide.' };
  const { data, error } = await supabase.from('lesson_resources').insert({ ...parsed.data, lesson_id: lessonId }).select('id');
  if (error || !data?.length) {
    await supabase.storage.from('course-files').remove([parsed.data.storage_path]);
    return { ok: false, message: dbMessage(error) };
  }
  revalidatePath(`/espace/formateur/lecons/${lessonId}`);
  return { ok: true, message: 'Fichier ajouté.' };
}

export async function deleteResourceAction(resourceId: string) {
  const { supabase } = await staff('/espace/formateur/cours');
  const { data, error } = await supabase.from('lesson_resources').delete().eq('id', resourceId).select('lesson_id, storage_path');
  if (error || !data?.length) throw new Error(dbMessage(error));
  const row = data[0]!;
  if (row.storage_path) await supabase.storage.from('course-files').remove([row.storage_path]);
  revalidatePath(`/espace/formateur/lecons/${row.lesson_id}`);
}

// =============================================================================
// Inscriptions
// =============================================================================
export async function enrollByEmailAction(courseId: string, _p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase } = await staff(`/espace/formateur/cours/${courseId}`);
  const parsed = emailOnlySchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const { error } = await supabase.rpc('enroll_student', { p_course: courseId, p_email: parsed.data.email });
  if (error) return { ok: false, message: dbMessage(error), values: keepValues(formData) };
  revalidatePath(`/espace/formateur/cours/${courseId}`);
  return { ok: true, message: 'Élève inscrit.' };
}

export async function enrollGroupAction(courseId: string, _p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase } = await staff(`/espace/formateur/cours/${courseId}`);
  const groupId = String(formData.get('group_id') ?? '');
  if (!uuid.safeParse(groupId).success) return { ok: false, fieldErrors: { group_id: 'Choisis un groupe.' } };
  const { data, error } = await supabase.rpc('enroll_group', { p_course: courseId, p_group: groupId });
  if (error) return { ok: false, message: dbMessage(error) };
  revalidatePath(`/espace/formateur/cours/${courseId}`);
  return { ok: true, message: `${data ?? 0} nouvelle(s) inscription(s).` };
}

export async function removeEnrollmentAction(enrollmentId: string, courseId: string) {
  const { supabase } = await staff(`/espace/formateur/cours/${courseId}`);
  const { data, error } = await supabase.from('enrollments').delete().eq('id', enrollmentId).select('id');
  if (error || !data?.length) throw new Error(dbMessage(error));
  revalidatePath(`/espace/formateur/cours/${courseId}`);
}

// =============================================================================
// Exercices
// =============================================================================
export async function createExerciseAction(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase, userId } = await staff('/espace/formateur/exercices');
  const parsed = exerciseSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const { data, error } = await supabase.from('exercises').insert({ ...parsed.data, owner_id: userId }).select('id').single();
  if (error || !data) return { ok: false, message: dbMessage(error), values: keepValues(formData) };
  redirect(`/espace/formateur/exercices/${data.id}`);
}

export async function updateExerciseAction(exerciseId: string, _p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase } = await staff(`/espace/formateur/exercices/${exerciseId}`);
  const parsed = exerciseSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  if (parsed.data.status === 'published') {
    const { count } = await supabase.from('exercise_questions').select('id', { count: 'exact', head: true }).eq('exercise_id', exerciseId);
    if (!count) return { ok: false, message: 'Ajoute au moins une question avant de publier.', values: keepValues(formData) };
  }
  const { data, error } = await supabase.from('exercises').update(parsed.data).eq('id', exerciseId).select('id');
  if (error || !data?.length) return { ok: false, message: dbMessage(error), values: keepValues(formData) };
  revalidatePath(`/espace/formateur/exercices/${exerciseId}`);
  return { ok: true, message: 'Exercice enregistré.' };
}

export async function deleteExerciseAction(exerciseId: string) {
  const { supabase } = await staff('/espace/formateur/exercices');
  const { data, error } = await supabase.from('exercises').delete().eq('id', exerciseId).select('id');
  if (error || !data?.length) throw new Error(dbMessage(error));
  redirect('/espace/formateur/exercices');
}

async function insertQuestion(
  supabase: Awaited<ReturnType<typeof staff>>['supabase'],
  exerciseId: string,
  rows: ReturnType<typeof rowsFromForm>,
  position: number,
): Promise<boolean> {
  const { data, error } = await supabase.from('exercise_questions').insert({ ...rows.question, exercise_id: exerciseId, position }).select('id').single();
  if (error || !data) return false;
  const key = await supabase.from('exercise_question_keys').insert({ question_id: data.id, ...rows.key }).select('question_id');
  if (key.error || !key.data?.length) {
    // Pas de question sans corrigé : on annule.
    await supabase.from('exercise_questions').delete().eq('id', data.id);
    return false;
  }
  return true;
}

async function nextPosition(supabase: Awaited<ReturnType<typeof staff>>['supabase'], exerciseId: string): Promise<number> {
  const { data } = await supabase.from('exercise_questions').select('position').eq('exercise_id', exerciseId).order('position', { ascending: false }).limit(1);
  return (data?.[0]?.position ?? 0) + 1;
}

export async function addQuestionAction(exerciseId: string, _p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase } = await staff(`/espace/formateur/exercices/${exerciseId}`);
  const parsed = questionSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const ok = await insertQuestion(supabase, exerciseId, rowsFromForm(parsed.data), await nextPosition(supabase, exerciseId));
  if (!ok) return { ok: false, message: REFUSED, values: keepValues(formData) };
  revalidatePath(`/espace/formateur/exercices/${exerciseId}`);
  return { ok: true, message: 'Question ajoutée.' };
}

const GENERATORS: Record<string, ExerciseGenerator> = Object.fromEntries(
  [
    ...RHYTHM_EXERCISES.map((g) => ({ ...g, id: `rythme:${g.id}` })),
    ...SCALE_EXERCISES.map((g) => ({ ...g, id: `tonalites:${g.id}` })),
    ...INTERVAL_EXERCISES.map((g) => ({ ...g, id: `intervalles:${g.id}` })),
    { id: 'lecture:notes', label: 'Lecture de notes', description: '', minDifficulty: 1, generate: noteIdentificationQuestion },
  ].map((g) => [g.id, g]),
);

const generateSchema = z.object({
  generator: z.string().refine((g) => g in GENERATORS, 'Choisis un type de question.'),
  difficulty: z.coerce.number().int().min(1).max(3),
  count: z.coerce.number().int().min(1, 'Au moins 1.').max(20, '20 au maximum.'),
});

/** Ajoute des questions générées par les laboratoires (notation et corrigé vérifiés par les tests). */
export async function generateQuestionsAction(exerciseId: string, _p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase } = await staff(`/espace/formateur/exercices/${exerciseId}`);
  const parsed = generateSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const gen = GENERATORS[parsed.data.generator] as ExerciseGenerator;
  let position = await nextPosition(supabase, exerciseId);
  let added = 0;
  for (let i = 0; i < parsed.data.count; i++) {
    if (await insertQuestion(supabase, exerciseId, rowsFromQuestion(gen.generate(parsed.data.difficulty)), position++)) added++;
  }
  revalidatePath(`/espace/formateur/exercices/${exerciseId}`);
  if (added === 0) return { ok: false, message: REFUSED };
  return { ok: added === parsed.data.count, message: `${added} question(s) ajoutée(s) sur ${parsed.data.count}.` };
}

export async function deleteQuestionAction(questionId: string, exerciseId: string) {
  const { supabase } = await staff(`/espace/formateur/exercices/${exerciseId}`);
  const { data, error } = await supabase.from('exercise_questions').delete().eq('id', questionId).select('id');
  if (error || !data?.length) throw new Error(dbMessage(error));
  revalidatePath(`/espace/formateur/exercices/${exerciseId}`);
}

// =============================================================================
// Groupes et élèves
// =============================================================================
export async function createGroupAction(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase, userId } = await staff('/espace/formateur/groupes');
  const parsed = groupSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const { data, error } = await supabase.from('groups').insert({ ...parsed.data, trainer_id: userId }).select('id').single();
  if (error || !data) return { ok: false, message: dbMessage(error), values: keepValues(formData) };
  redirect(`/espace/formateur/groupes/${data.id}`);
}

export async function deleteGroupAction(groupId: string) {
  const { supabase } = await staff('/espace/formateur/groupes');
  const { data, error } = await supabase.from('groups').delete().eq('id', groupId).select('id');
  if (error || !data?.length) throw new Error(dbMessage(error));
  redirect('/espace/formateur/groupes');
}

export async function addMemberAction(groupId: string, _p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase } = await staff(`/espace/formateur/groupes/${groupId}`);
  const parsed = emailOnlySchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const { error } = await supabase.rpc('add_student_to_group', { p_group: groupId, p_email: parsed.data.email });
  if (error) return { ok: false, message: dbMessage(error), values: keepValues(formData) };
  revalidatePath(`/espace/formateur/groupes/${groupId}`);
  return { ok: true, message: 'Élève ajouté au groupe.' };
}

export async function removeMemberAction(groupId: string, studentId: string) {
  const { supabase } = await staff(`/espace/formateur/groupes/${groupId}`);
  const { data, error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', studentId).select('user_id');
  if (error || !data?.length) throw new Error(dbMessage(error));
  revalidatePath(`/espace/formateur/groupes/${groupId}`);
}

export async function setLevelAction(studentId: string, _p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase } = await staff(`/espace/formateur/eleves/${studentId}`);
  const level = z.enum(['debutant', 'intermediaire', 'avance']).safeParse(formData.get('level'));
  if (!level.success) return { ok: false, message: 'Niveau invalide.' };
  const { error } = await supabase.rpc('set_student_level', { p_student: studentId, p_level: level.data });
  if (error) return { ok: false, message: dbMessage(error) };
  revalidatePath(`/espace/formateur/eleves/${studentId}`);
  return { ok: true, message: 'Niveau enregistré.' };
}

export async function toggleAdvancedUnlockAction(studentId: string, unlock: boolean) {
  const { supabase, userId } = await staff(`/espace/formateur/eleves/${studentId}`);
  const res = unlock
    ? await supabase.from('module_unlocks').insert({ student_id: studentId, lab_key: 'intervalles', unlocked_by: userId }).select('id')
    : await supabase.from('module_unlocks').delete().eq('student_id', studentId).eq('lab_key', 'intervalles').select('id');
  if (res.error || !res.data?.length) throw new Error(dbMessage(res.error));
  revalidatePath(`/espace/formateur/eleves/${studentId}`);
}

export async function addCommentAction(studentId: string, _p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase, userId } = await staff(`/espace/formateur/eleves/${studentId}`);
  const parsed = commentSchema.safeParse({ context: '', ...formObject(formData) });
  if (!parsed.success) return invalid(parsed.error, formData);
  const { data, error } = await supabase
    .from('pedagogical_comments')
    .insert({ student_id: studentId, author_id: userId, body: parsed.data.body, context: parsed.data.context || null })
    .select('id');
  if (error || !data?.length) return { ok: false, message: dbMessage(error), values: keepValues(formData) };
  revalidatePath(`/espace/formateur/eleves/${studentId}`);
  return { ok: true, message: 'Commentaire enregistré : l’élève le verra sur son tableau de bord.' };
}

// =============================================================================
// Devoirs
// =============================================================================
export async function createAssignmentAction(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase, userId } = await staff('/espace/formateur/devoirs');
  const parsed = assignmentSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const { data, error } = await supabase.from('assignments').insert({ ...parsed.data, created_by: userId }).select('id').single();
  if (error || !data) return { ok: false, message: dbMessage(error), values: keepValues(formData) };
  redirect(`/espace/formateur/devoirs/${data.id}`);
}

export async function updateAssignmentStatusAction(assignmentId: string, status: 'draft' | 'published') {
  const { supabase } = await staff(`/espace/formateur/devoirs/${assignmentId}`);
  const { data, error } = await supabase.from('assignments').update({ status }).eq('id', assignmentId).select('id');
  if (error || !data?.length) throw new Error(dbMessage(error));
  revalidatePath(`/espace/formateur/devoirs/${assignmentId}`);
}

export async function deleteAssignmentAction(assignmentId: string) {
  const { supabase } = await staff('/espace/formateur/devoirs');
  const { data, error } = await supabase.from('assignments').delete().eq('id', assignmentId).select('id');
  if (error || !data?.length) throw new Error(dbMessage(error));
  redirect('/espace/formateur/devoirs');
}

export async function reviewSubmissionAction(submissionId: string, assignmentId: string, _p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase } = await staff(`/espace/formateur/devoirs/${assignmentId}`);
  const parsed = reviewSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const { data, error } = await supabase
    .from('assignment_submissions')
    .update({ score: parsed.data.score, feedback: parsed.data.feedback || null, status: parsed.data.status })
    .eq('id', submissionId)
    .select('id');
  if (error || !data?.length) return { ok: false, message: dbMessage(error), values: keepValues(formData) };
  revalidatePath(`/espace/formateur/devoirs/${assignmentId}`);
  return { ok: true, message: parsed.data.status === 'reviewed' ? 'Correction enregistrée.' : 'Devoir renvoyé à l’élève pour être repris.' };
}
