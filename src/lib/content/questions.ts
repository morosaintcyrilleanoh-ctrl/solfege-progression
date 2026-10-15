/**
 * Conversion entre le format des questions du moteur d'exercices et les
 * lignes de la base (énoncé visible / corrigé séparé).
 */
import type { Notation, Question } from '@/lib/exercises/types';
import { shuffle } from '@/lib/exercises/util';
import type { Json } from '@/lib/supabase/database.types';
import { lines } from '@/lib/validation/academy';

export interface QuestionRows {
  question: { type: 'mcq' | 'short' | 'match'; skill: string; prompt: string; notation: Json | null; choices: Json | null; answer_kind: 'text' | 'number' | null };
  key: { correct: Json; explanation: string };
}

/** Question générée par un laboratoire -> lignes à enregistrer. */
export function rowsFromQuestion(q: Question): QuestionRows {
  const base = { skill: q.skill, prompt: q.prompt, notation: (q.notation ?? null) as Json | null };
  if (q.type === 'mcq') {
    return {
      question: { ...base, type: 'mcq', choices: q.choices.map((c) => ({ id: c.id, label: c.label, ...(c.glyph ? { glyph: c.glyph } : {}) })), answer_kind: null },
      key: { correct: q.correct, explanation: q.explanation },
    };
  }
  if (q.type === 'short') {
    return { question: { ...base, type: 'short', choices: null, answer_kind: q.answerKind }, key: { correct: q.accepted, explanation: q.explanation } };
  }
  return {
    question: { ...base, type: 'match', choices: { left: q.pairs.map((p) => p.left), right: shuffle(q.pairs.map((p) => p.right)) }, answer_kind: null },
    key: { correct: q.pairs.map((p) => p.right), explanation: q.explanation },
  };
}

/** Saisie du formateur (formulaire) -> lignes à enregistrer. */
export function rowsFromForm(f: {
  type: 'mcq' | 'short' | 'match';
  prompt: string;
  skill: string;
  explanation: string;
  choices: string;
  correct_index: string;
  accepted: string;
  answer_kind: 'text' | 'number';
  pairs: string;
}): QuestionRows {
  const base = { skill: f.skill || 'general', prompt: f.prompt, notation: null };
  if (f.type === 'mcq') {
    const choices = lines(f.choices).map((label, i) => ({ id: `c${i + 1}`, label }));
    const correct = f.correct_index.split(/[,\s]+/).filter(Boolean).map((n) => `c${Number(n)}`);
    return { question: { ...base, type: 'mcq', choices, answer_kind: null }, key: { correct, explanation: f.explanation } };
  }
  if (f.type === 'short') {
    return { question: { ...base, type: 'short', choices: null, answer_kind: f.answer_kind }, key: { correct: lines(f.accepted), explanation: f.explanation } };
  }
  const pairs = lines(f.pairs).map((l) => l.split('=').map((x) => x.trim()) as [string, string]);
  return {
    question: { ...base, type: 'match', choices: { left: pairs.map((p) => p[0]), right: shuffle(pairs.map((p) => p[1])) }, answer_kind: null },
    key: { correct: pairs.map((p) => p[1]), explanation: f.explanation },
  };
}

/**
 * Ligne de la base (sans corrigé) -> question affichable par le moteur.
 * Les bonnes réponses ne sont pas connues du navigateur : champs vides.
 */
export function questionFromRow(row: {
  id: string;
  type: 'mcq' | 'short' | 'match';
  skill: string;
  prompt: string;
  notation: Json | null;
  choices: Json | null;
  answer_kind: 'text' | 'number' | null;
}): Question {
  const base = { id: row.id, skill: row.skill, prompt: row.prompt, notation: (row.notation ?? undefined) as Notation | undefined, explanation: '' };
  if (row.type === 'mcq') {
    const choices = Array.isArray(row.choices) ? (row.choices as { id: string; label: string; glyph?: string }[]) : [];
    return { ...base, type: 'mcq', choices, correct: [] };
  }
  if (row.type === 'short') return { ...base, type: 'short', accepted: [], answerKind: row.answer_kind ?? 'text' };
  const c = (row.choices ?? { left: [], right: [] }) as { left: string[]; right: string[] };
  // Les éléments de droite sont fournis mélangés ; l'interface les remélange encore.
  return { ...base, type: 'match', pairs: c.left.map((left, i) => ({ left, right: c.right[i] ?? '' })) };
}
