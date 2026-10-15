import 'server-only';
import type { ServerSupabase } from '@/lib/supabase/server';

/** Élèves suivis par le formateur connecté (groupes + cours), via le RLS. */
export async function trainerStudentIds(supabase: ServerSupabase, trainerId: string, isAdmin: boolean): Promise<string[]> {
  const groups = await supabase.from('groups').select('id').eq('trainer_id', trainerId);
  const courses = await supabase.from('courses').select('id').eq('owner_id', trainerId);
  const groupIds = (groups.data ?? []).map((g) => g.id);
  const courseIds = (courses.data ?? []).map((c) => c.id);
  const [members, enrolled] = await Promise.all([
    groupIds.length ? supabase.from('group_members').select('user_id').in('group_id', groupIds) : Promise.resolve({ data: [] as { user_id: string }[] }),
    courseIds.length ? supabase.from('enrollments').select('user_id').in('course_id', courseIds) : Promise.resolve({ data: [] as { user_id: string }[] }),
  ]);
  const ids = new Set([...(members.data ?? []), ...(enrolled.data ?? [])].map((r) => r.user_id));
  if (isAdmin && ids.size === 0) return [];
  return [...ids];
}

export async function loadTrainerDashboard(supabase: ServerSupabase, trainerId: string, isAdmin: boolean) {
  const studentIds = await trainerStudentIds(supabase, trainerId, isAdmin);
  const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();
  const [profiles, attempts, submissions, courses, lives, exercises] = await Promise.all([
    studentIds.length ? supabase.from('profiles').select('id, first_name, last_name, level').in('id', studentIds) : Promise.resolve({ data: [], error: null }),
    studentIds.length
      ? supabase.from('exercise_attempts').select('*').in('user_id', studentIds).gte('created_at', since30).order('created_at', { ascending: false }).limit(1000)
      : Promise.resolve({ data: [], error: null }),
    supabase.from('assignment_submissions').select('id, assignment_id, student_id, submitted_at, status').eq('status', 'submitted').order('submitted_at').limit(50),
    supabase.from('courses').select('id, title, slug, status, published_at, updated_at').eq('owner_id', trainerId).order('updated_at', { ascending: false }).limit(5),
    supabase.from('live_sessions').select('*').eq('trainer_id', trainerId).gte('starts_at', new Date().toISOString()).order('starts_at').limit(5),
    supabase.from('exercises').select('id, title, status').eq('owner_id', trainerId).order('updated_at', { ascending: false }).limit(20),
  ]);
  const assignmentIds = [...new Set((submissions.data ?? []).map((s) => s.assignment_id))];
  const assignments = assignmentIds.length
    ? await supabase.from('assignments').select('id, title').in('id', assignmentIds)
    : { data: [] as { id: string; title: string }[], error: null };
  const exerciseIds = (exercises.data ?? []).map((e) => e.id);
  const exerciseAttempts = exerciseIds.length
    ? await supabase.from('exercise_attempts').select('user_id, score, max_score, created_at, exercise_id').in('exercise_id', exerciseIds).limit(2000)
    : { data: [], error: null };
  const error = [profiles, attempts, submissions, courses, lives, exercises, assignments, exerciseAttempts].some((r) => r.error);
  return {
    error,
    since30: new Date(since30),
    studentIds,
    profiles: new Map((profiles.data ?? []).map((p) => [p.id, p])),
    attempts: attempts.data ?? [],
    submissions: submissions.data ?? [],
    assignmentTitles: new Map((assignments.data ?? []).map((a) => [a.id, a.title])),
    courses: courses.data ?? [],
    lives: lives.data ?? [],
    exercises: exercises.data ?? [],
    exerciseAttempts: exerciseAttempts.data ?? [],
  };
}
