import { describe, expect, it } from 'vitest';
import { parsePitchKey } from '@/lib/music/pitch';
import type { NoteQuestion } from './questions';
import { type SessionConfig, createSession, currentQuestion, sessionReducer, summarize } from './session';

const q = (key: string, id = key): NoteQuestion => ({ id, clef: 'treble', pitch: parsePitchKey(key) });
const training: SessionConfig = { mode: 'training', clefChoice: 'treble', level: 1, answerMode: 'buttons', evaluationLength: 10 };
const evaluation: SessionConfig = { ...training, mode: 'evaluation', evaluationLength: 3 };

describe('séance d’entraînement', () => {
  it('corrige immédiatement puis passe à la question suivante', () => {
    let s = createSession('s1', training, [q('G4')], 1000);
    s = sessionReducer(s, { type: 'answer', answer: { kind: 'name', letter: 'G', accidental: 0 }, now: 3500 });
    expect(s.phase).toBe('feedback');
    expect(s.items[0]).toMatchObject({ correct: true, ms: 2500 });
    expect(s.streak).toBe(1);

    // Une deuxième réponse pendant la correction est ignorée (double clic).
    const again = sessionReducer(s, { type: 'answer', answer: { kind: 'name', letter: 'A', accidental: 0 }, now: 3600 });
    expect(again).toBe(s);

    s = sessionReducer(s, { type: 'next', question: q('E4'), now: 4000 });
    expect(s.phase).toBe('question');
    expect(currentQuestion(s)?.pitch.letter).toBe('E');
    s = sessionReducer(s, { type: 'answer', answer: { kind: 'name', letter: 'F', accidental: 0 }, now: 5000 });
    expect(s.items[1]?.correct).toBe(false);
    expect(s.streak).toBe(0);
    expect(s.bestStreak).toBe(1);

    s = sessionReducer(s, { type: 'finish', now: 6000 });
    expect(s.phase).toBe('finished');
    expect(summarize(s)).toEqual({ total: 2, correct: 1, percent: 50, averageMs: 1750, bestStreak: 1 });
  });
});

describe('séance d’évaluation', () => {
  it('enchaîne sans correction et se termine après la dernière question', () => {
    let s = createSession('s2', evaluation, [q('E4', 'a'), q('G4', 'b'), q('B4', 'c')], 0);
    s = sessionReducer(s, { type: 'answer', answer: { kind: 'name', letter: 'E', accidental: 0 }, now: 1000 });
    expect(s.phase).toBe('question');
    expect(s.index).toBe(1);
    s = sessionReducer(s, { type: 'answer', answer: { kind: 'name', letter: 'G', accidental: 0 }, now: 2000 });
    s = sessionReducer(s, { type: 'answer', answer: { kind: 'name', letter: 'C', accidental: 0 }, now: 4000 });
    expect(s.phase).toBe('finished');
    expect(s.finishedAt).toBe(new Date(4000).toISOString());
    expect(summarize(s)).toMatchObject({ total: 3, correct: 2, percent: 67 });
    // Plus aucune réponse acceptée.
    expect(sessionReducer(s, { type: 'answer', answer: { kind: 'name', letter: 'C', accidental: 0 }, now: 5000 })).toBe(s);
  });

  it('refuse une série incohérente', () => {
    expect(() => createSession('x', evaluation, [q('E4')], 0)).toThrow();
    expect(() => createSession('x', training, [], 0)).toThrow();
  });

  it('peut être interrompue avant la fin', () => {
    let s = createSession('s3', evaluation, [q('E4', 'a'), q('G4', 'b'), q('B4', 'c')], 0);
    s = sessionReducer(s, { type: 'answer', answer: { kind: 'name', letter: 'E', accidental: 0 }, now: 1000 });
    s = sessionReducer(s, { type: 'finish', now: 2000 });
    expect(summarize(s)).toMatchObject({ total: 1, correct: 1 });
  });
});
