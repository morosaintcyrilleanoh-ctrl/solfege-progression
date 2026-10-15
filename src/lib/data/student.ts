import 'server-only';
import type { ServerSupabase } from '@/lib/supabase/server';

/** Données du tableau de bord élève. Chaque requête passe par le RLS (session de l'élève). */
export async function loadStudentDashboard(supabase: ServerSupabase, userId: string) {
  const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();
  const nowIso = new Date().toISOString();

  const [enrollments, lastProgress, attempts, lives, announcements, assignments, submissions, comments] = await Promise.all([
    supabase.from('enrollments').select('course_id, status').eq('user_id', userId),
    supabase.from('learning_progress').select('lesson_id, status, updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(200),
    supabase.from('exercise_attempts').select('*').eq('user_id', userId).gte('created_at', since30).order('created_at', { ascending: false }).limit(300),
    supabase.from('live_sessions').select('*').gte('starts_at', new Date(Date.now() - 2 * 3600_000).toISOString()).neq('status', 'cancelled').order('starts_at').limit(3),
    supabase.from('announcements').select('*').eq('status', 'published').order('published_at', { ascending: false }).limit(3),
    supabase.from('assignments').select('*').eq('status', 'published').order('due_at', { ascending: true, nullsFirst: false }).limit(20),
    supabase.from('assignment_submissions').select('assignment_id, status, score').eq('student_id', userId),
    supabase.from('pedagogical_comments').select('*').eq('student_id', userId).order('created_at', { ascending: false }).limit(3),
  ]);

  const courseIds = (enrollments.data ?? []).map((e) => e.course_id);
  const [courses, modules] = await Promise.all([
    courseIds.length ? supabase.from('courses').select('id, title, slug').in('id', courseIds) : Promise.resolve({ data: [], error: null }),
    courseIds.length ? supabase.from('modules').select('id, course_id, title, position').in('course_id', courseIds) : Promise.resolve({ data: [], error: null }),
  ]);
  const moduleIds = (modules.data ?? []).map((m) => m.id);
  // Seules les leçons accessibles à l'élève sont renvoyées (RLS).
  const lessons = moduleIds.length
    ? await supabase.from('lessons').select('id, module_id, title, position').in('module_id', moduleIds)
    : { data: [], error: null };

  const lastLessonId = lastProgress.data?.[0]?.lesson_id;
  const lastLesson = (lessons.data ?? []).find((l) => l.id === lastLessonId) ?? null;
  const moduleById = new Map((modules.data ?? []).map((m) => [m.id, m]));
  const courseById = new Map((courses.data ?? []).map((c) => [c.id, c]));

  const lessonsByCourse: Record<string, string[]> = Object.fromEntries(courseIds.map((id) => [id, [] as string[]]));
  for (const l of lessons.data ?? []) {
    const m = moduleById.get(l.module_id);
    if (m) (lessonsByCourse[m.course_id] ??= []).push(l.id);
  }

  const submitted = new Set((submissions.data ?? []).map((s) => s.assignment_id));
  const pendingAssignments = (assignments.data ?? []).filter((a) => !submitted.has(a.id));

  const error = [enrollments, lastProgress, attempts, lives, announcements, assignments, submissions, comments, courses, modules, lessons].some((r) => r.error);

  return {
    error,
    courses: courses.data ?? [],
    courseById,
    lessonsByCourse,
    progress: lastProgress.data ?? [],
    lastLesson: lastLesson ? { ...lastLesson, course: courseById.get(moduleById.get(lastLesson.module_id)?.course_id ?? '') ?? null } : null,
    attempts: attempts.data ?? [],
    lives: lives.data ?? [],
    announcements: announcements.data ?? [],
    pendingAssignments,
    comments: comments.data ?? [],
    nowIso,
  };
}
