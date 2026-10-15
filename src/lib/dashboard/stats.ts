/**
 * Calculs des tableaux de bord, à partir des données réelles (lignes de la base).
 * Fonctions pures, testées.
 */
import { skillLabel } from '@/lib/exercises/skills';

export interface AttemptLike {
  user_id: string;
  score: number;
  max_score: number;
  created_at: string;
  details?: unknown;
  exercise_id?: string | null;
  lab_id?: string | null;
  source?: string;
}

/** Début de la semaine (lundi 0 h, heure locale du serveur ou du navigateur). */
export function startOfWeek(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

/** Nombre de réponses données cette semaine (somme des questions des séances). */
export function answersThisWeek(attempts: AttemptLike[], now = new Date()): number {
  const start = startOfWeek(now).getTime();
  return attempts.filter((a) => new Date(a.created_at).getTime() >= start).reduce((s, a) => s + a.max_score, 0);
}

export interface CourseProgress {
  courseId: string;
  total: number;
  completed: number;
  inProgress: number;
  percent: number;
}

export function courseProgress(
  lessonsByCourse: Record<string, string[]>,
  progress: { lesson_id: string; status: string }[],
): CourseProgress[] {
  const status = new Map(progress.map((p) => [p.lesson_id, p.status]));
  return Object.entries(lessonsByCourse).map(([courseId, lessons]) => {
    const completed = lessons.filter((l) => status.get(l) === 'completed').length;
    const inProgress = lessons.filter((l) => status.get(l) === 'in_progress').length;
    return { courseId, total: lessons.length, completed, inProgress, percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0 };
  });
}

export interface StudentDifficulty {
  userId: string;
  attempts: number;
  accuracy: number;
}

/**
 * Élève en difficulté : au moins `minAttempts` séances sur la période et moins
 * de `threshold` de réussite moyenne. Critère simple et explicable.
 */
export function strugglingStudents(
  attempts: AttemptLike[],
  { since, minAttempts = 3, threshold = 0.6 }: { since: Date; minAttempts?: number; threshold?: number },
): StudentDifficulty[] {
  const by = new Map<string, { s: number; m: number; n: number }>();
  for (const a of attempts) {
    if (new Date(a.created_at) < since) continue;
    const v = by.get(a.user_id) ?? { s: 0, m: 0, n: 0 };
    v.s += a.score;
    v.m += a.max_score;
    v.n += 1;
    by.set(a.user_id, v);
  }
  return [...by]
    .map(([userId, v]) => ({ userId, attempts: v.n, accuracy: v.m ? v.s / v.m : 0 }))
    .filter((d) => d.attempts >= minAttempts && d.accuracy < threshold)
    .sort((a, b) => a.accuracy - b.accuracy);
}

/** Réussite par compétence, à partir du champ details.skills des séances importées. */
export function skillAccuracy(attempts: AttemptLike[]): { skill: string; label: string; correct: number; total: number; accuracy: number }[] {
  const by = new Map<string, { c: number; t: number }>();
  for (const a of attempts) {
    const skills = (a.details as { skills?: Record<string, { c: number; t: number }> } | null)?.skills;
    if (!skills || typeof skills !== 'object') continue;
    for (const [skill, v] of Object.entries(skills)) {
      if (typeof v?.c !== 'number' || typeof v?.t !== 'number') continue;
      const cur = by.get(skill) ?? { c: 0, t: 0 };
      cur.c += v.c;
      cur.t += v.t;
      by.set(skill, cur);
    }
  }
  return [...by].map(([skill, v]) => ({ skill, label: skillLabel(skill), correct: v.c, total: v.t, accuracy: v.t ? v.c / v.t : 0 }));
}

const SKILL_LINKS: [string, string][] = [
  ['lecture.notes', '/laboratoires/lecture-des-notes'],
  ['lecture.', '/laboratoires/intervalles'],
  ['rythme.', '/laboratoires/rythme'],
  ['tonalites.', '/laboratoires/tonalites'],
  ['intervalles.', '/laboratoires/intervalles'],
  ['accords.', '/laboratoires/intervalles'],
];

export function labForSkill(skill: string): string {
  return SKILL_LINKS.find(([prefix]) => skill === prefix || skill.startsWith(prefix))?.[1] ?? '/laboratoires';
}

/** Recommandations : compétences pratiquées au moins 5 fois et réussies à moins de 70 %. */
export function recommendations(attempts: AttemptLike[], limit = 3) {
  return skillAccuracy(attempts)
    .filter((s) => s.total >= 5 && s.accuracy < 0.7)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit)
    .map((s) => ({ ...s, href: labForSkill(s.skill) }));
}

/** Statistiques par exercice (tentatives, score moyen en %). */
export function exerciseStats(attempts: AttemptLike[]): Map<string, { attempts: number; averagePercent: number; students: number }> {
  const by = new Map<string, { n: number; pct: number; users: Set<string> }>();
  for (const a of attempts) {
    if (!a.exercise_id) continue;
    const v = by.get(a.exercise_id) ?? { n: 0, pct: 0, users: new Set<string>() };
    v.n += 1;
    v.pct += a.max_score ? (a.score / a.max_score) * 100 : 0;
    v.users.add(a.user_id);
    by.set(a.exercise_id, v);
  }
  return new Map([...by].map(([id, v]) => [id, { attempts: v.n, averagePercent: Math.round(v.pct / v.n), students: v.users.size }]));
}
