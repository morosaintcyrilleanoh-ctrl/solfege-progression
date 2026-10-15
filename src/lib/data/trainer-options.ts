import 'server-only';
import type { ServerSupabase } from '@/lib/supabase/server';

/** Cours, leçons et groupes du formateur, pour les listes de choix. */
export async function trainerOptions(supabase: ServerSupabase, userId: string, isAdmin: boolean) {
  let cq = supabase.from('courses').select('id, title').order('title');
  if (!isAdmin) cq = cq.eq('owner_id', userId);
  const courses = (await cq).data ?? [];
  const modules = courses.length ? ((await supabase.from('modules').select('id, course_id, title').in('course_id', courses.map((c) => c.id))).data ?? []) : [];
  const lessonsRaw = modules.length ? ((await supabase.from('lessons').select('id, module_id, title').in('module_id', modules.map((m) => m.id)).order('position')).data ?? []) : [];
  const courseTitle = new Map(courses.map((c) => [c.id, c.title]));
  const moduleCourse = new Map(modules.map((m) => [m.id, m.course_id]));
  const lessons = lessonsRaw.map((l) => ({ id: l.id, title: `${courseTitle.get(moduleCourse.get(l.module_id) ?? '') ?? ''} — ${l.title}` }));
  let gq = supabase.from('groups').select('id, name').order('name');
  if (!isAdmin) gq = gq.eq('trainer_id', userId);
  const groups = (await gq).data ?? [];
  return { courses, lessons, groups };
}
