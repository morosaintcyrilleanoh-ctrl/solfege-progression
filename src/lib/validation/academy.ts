/** Validation des formulaires de l'académie (mêmes limites que la base). */
import { z } from 'zod';

const text = (max: number) => z.string().trim().max(max, `${max} caractères maximum.`);
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https:\/\/[^\s]+$/.test(v), 'Lien invalide : il doit commencer par https://')
  .transform((v) => v || null);
const optionalUuid = z
  .string()
  .trim()
  .refine((v) => v === '' || /^[0-9a-f-]{36}$/i.test(v), 'Sélection invalide.')
  .transform((v) => v || null);
const status = z.enum(['draft', 'published']);
const level = z.enum(['debutant', 'intermediaire', 'avance']);
const checkbox = z.preprocess((v) => v === 'on' || v === 'true', z.boolean());
const optionalDate = z
  .string()
  .trim()
  .refine((v) => v === '' || !Number.isNaN(Date.parse(v)), 'Date invalide.')
  .transform((v) => (v ? new Date(v).toISOString() : null));

export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const courseSchema = z.object({
  title: text(160).min(3, 'Au moins 3 caractères.'),
  description: text(4000),
  level,
  status,
  is_open: checkbox,
});

export const moduleSchema = z.object({
  title: text(160).min(2, 'Au moins 2 caractères.'),
  description: text(2000),
  required_level: level,
  status,
  position: z.coerce.number().int().min(0).max(999),
});

export const lessonSchema = z.object({
  title: text(160).min(2, 'Au moins 2 caractères.'),
  summary: text(1000),
  content: text(100000),
  video_url: optionalUrl,
  duration_minutes: z.preprocess((v) => (v === '' ? null : v), z.coerce.number().int().min(0).max(600).nullable()),
  status,
  position: z.coerce.number().int().min(0).max(999),
});

export const linkResourceSchema = z.object({
  title: text(160).min(1, 'Titre requis.'),
  kind: z.enum(['pdf', 'audio', 'video', 'image', 'document', 'link']),
  external_url: z.string().trim().regex(/^https:\/\/[^\s]+$/, 'Lien invalide : il doit commencer par https://').max(500),
});

export const fileResourceSchema = z.object({
  title: text(160).min(1, 'Titre requis.'),
  kind: z.enum(['pdf', 'audio', 'video', 'image', 'document']),
  storage_path: z.string().max(500),
  size_bytes: z.coerce.number().int().min(0).max(50 * 1024 * 1024),
  downloadable: checkbox,
});

export const exerciseSchema = z.object({
  title: text(160).min(2, 'Au moins 2 caractères.'),
  description: text(2000),
  kind: z.enum(['practice', 'assessment']),
  course_id: optionalUuid,
  lesson_id: optionalUuid,
  max_attempts: z.preprocess((v) => (v === '' ? null : v), z.coerce.number().int().min(1).max(100).nullable()),
  status,
});

/** Lignes non vides d'un champ texte. */
export function lines(s: string): string[] {
  return s
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

export const questionSchema = z
  .object({
    type: z.enum(['mcq', 'short', 'match']),
    prompt: text(2000).min(1, 'Énoncé requis.'),
    skill: text(80).default('general'),
    explanation: text(2000),
    // QCM : un choix par ligne ; la bonne réponse est indiquée par son numéro.
    choices: text(4000).default(''),
    correct_index: z.string().default(''),
    // Réponse courte : réponses acceptées, une par ligne.
    accepted: text(2000).default(''),
    answer_kind: z.enum(['text', 'number']).default('text'),
    // Association : une paire par ligne, « gauche = droite ».
    pairs: text(4000).default(''),
  })
  .superRefine((q, ctx) => {
    if (q.type === 'mcq') {
      const c = lines(q.choices);
      if (c.length < 2 || c.length > 8) ctx.addIssue({ code: 'custom', path: ['choices'], message: 'Entre 2 et 8 choix, un par ligne.' });
      const nums = q.correct_index.split(/[,\s]+/).filter(Boolean).map(Number);
      if (!nums.length || nums.some((n) => !Number.isInteger(n) || n < 1 || n > c.length))
        ctx.addIssue({ code: 'custom', path: ['correct_index'], message: 'Indique le numéro de la (ou des) bonne(s) réponse(s), ex. 2.' });
    }
    if (q.type === 'short' && !lines(q.accepted).length) ctx.addIssue({ code: 'custom', path: ['accepted'], message: 'Au moins une réponse acceptée.' });
    if (q.type === 'match') {
      const p = lines(q.pairs).map((l) => l.split('='));
      if (p.length < 2 || p.length > 8 || p.some((x) => x.length !== 2 || !x[0]?.trim() || !x[1]?.trim()))
        ctx.addIssue({ code: 'custom', path: ['pairs'], message: 'Entre 2 et 8 paires, une par ligne, au format « gauche = droite ».' });
      else if (new Set(p.map((x) => x[1]!.trim())).size !== p.length)
        ctx.addIssue({ code: 'custom', path: ['pairs'], message: 'Chaque élément de droite doit être différent.' });
    }
  });

export const groupSchema = z.object({ name: text(120).min(2, 'Au moins 2 caractères.'), description: text(1000) });

export const assignmentSchema = z
  .object({
    title: text(160).min(2, 'Au moins 2 caractères.'),
    instructions: text(10000),
    group_id: optionalUuid,
    student_id: optionalUuid,
    exercise_id: optionalUuid,
    lesson_id: optionalUuid,
    due_at: optionalDate,
    status,
  })
  .refine((a) => a.group_id || a.student_id, { message: 'Choisis un groupe ou un élève.', path: ['group_id'] });

export const reviewSchema = z.object({
  score: z.preprocess((v) => (v === '' ? null : v), z.coerce.number().min(0).max(100).nullable()),
  feedback: text(4000),
  status: z.enum(['reviewed', 'returned']),
});

export const submissionSchema = z.object({ content: text(10000) });

export const liveSchema = z
  .object({
    title: text(160).min(2, 'Au moins 2 caractères.'),
    description: text(4000),
    starts_at: z.string().trim().refine((v) => !Number.isNaN(Date.parse(v)), 'Date et heure requises.').transform((v) => new Date(v).toISOString()),
    duration_minutes: z.coerce.number().int().min(5).max(600),
    meeting_url: optionalUrl,
    replay_url: optionalUrl,
    audience: z.enum(['all', 'course', 'group']),
    course_id: optionalUuid,
    group_id: optionalUuid,
    status: z.enum(['scheduled', 'cancelled', 'completed']),
  })
  .refine((l) => l.audience !== 'course' || l.course_id, { message: 'Choisis le cours.', path: ['course_id'] })
  .refine((l) => l.audience !== 'group' || l.group_id, { message: 'Choisis le groupe.', path: ['group_id'] });

export const announcementSchema = z
  .object({
    title: text(160).min(2, 'Au moins 2 caractères.'),
    body: text(8000).min(1, 'Message requis.'),
    audience: z.enum(['all', 'course', 'group']),
    course_id: optionalUuid,
    group_id: optionalUuid,
    status,
  })
  .refine((a) => a.audience !== 'course' || a.course_id, { message: 'Choisis le cours.', path: ['course_id'] })
  .refine((a) => a.audience !== 'group' || a.group_id, { message: 'Choisis le groupe.', path: ['group_id'] });

export const commentSchema = z.object({ body: text(4000).min(1, 'Commentaire vide.'), context: text(160) });

export const emailOnlySchema = z.object({ email: z.string().trim().toLowerCase().email('Adresse e-mail invalide.') });
