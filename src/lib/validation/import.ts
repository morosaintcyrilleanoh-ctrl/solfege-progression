import { z } from 'zod';

/** Une séance locale importée vers le compte (valeur d'entraînement, corrigée dans le navigateur). */
export const importedSessionSchema = z.object({
  client_session_id: z.string().min(1).max(100),
  lab_id: z.enum(['lecture-des-notes', 'rythme', 'tonalites', 'intervalles']),
  mode: z.enum(['training', 'evaluation']),
  score: z.number().int().min(0),
  max_score: z.number().int().min(1).max(500),
  started_at: z.string().datetime({ offset: true }).or(z.string().datetime()),
  completed_at: z.string().datetime({ offset: true }).or(z.string().datetime()).nullable(),
  skills: z.record(z.string().max(60), z.object({ c: z.number().int().min(0), t: z.number().int().min(1) })),
}).refine((s) => s.score <= s.max_score, { message: 'Score incohérent' });

export const importPayloadSchema = z.object({
  sessions: z.array(importedSessionSchema).max(300),
  placement: z
    .object({
      level: z.enum(['debutant', 'intermediaire', 'avance']),
      takenAt: z.string(),
      scores: z.record(z.string().max(30), z.object({ correct: z.number().int().min(0), total: z.number().int().min(1) })),
    })
    .nullable(),
});

export type ImportPayload = z.infer<typeof importPayloadSchema>;
