'use client';

import { loadPlacement } from '@/lib/access/learner-level';
import { loadQuizHistory } from '@/lib/exercises/history';
import { loadHistory } from '@/lib/note-reading/history';
import type { ImportPayload } from '@/lib/validation/import';

/** Rassemble les résultats enregistrés sur cet appareil, au format d'import. */
export function collectLocalResults(): ImportPayload {
  const sessions: ImportPayload['sessions'] = [];
  for (const s of loadHistory()) {
    const skills: Record<string, { c: number; t: number }> = { 'lecture.notes': { c: s.correct, t: s.total } };
    if (s.total > 0)
      sessions.push({
        client_session_id: `notes-${s.id}`,
        lab_id: 'lecture-des-notes',
        mode: s.mode,
        score: s.correct,
        max_score: s.total,
        started_at: s.startedAt,
        completed_at: s.finishedAt,
        skills,
      });
  }
  for (const lab of ['rythme', 'tonalites', 'intervalles'] as const) {
    for (const s of loadQuizHistory(lab)) {
      if (s.total === 0) continue;
      const skills: Record<string, { c: number; t: number }> = {};
      for (const i of s.items) {
        const v = (skills[i.s] ??= { c: 0, t: 0 });
        v.t += 1;
        if (i.c) v.c += 1;
      }
      sessions.push({
        client_session_id: `${lab}-${s.id}`,
        lab_id: lab,
        mode: s.mode,
        score: s.correct,
        max_score: s.total,
        started_at: s.startedAt,
        completed_at: s.finishedAt,
        skills,
      });
    }
  }
  const p = loadPlacement();
  return { sessions: sessions.slice(0, 300), placement: p ? { level: p.level, takenAt: p.takenAt, scores: p.scores } : null };
}
