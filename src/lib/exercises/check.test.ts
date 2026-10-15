import { describe, expect, it } from 'vitest';
import { checkQuestion, normalizeText, parseNumber } from './check';
import { createQuiz, quizReducer, quizSummary } from './session';
import type { McqQuestion, ShortQuestion } from './types';

describe('normalisation des réponses', () => {
  it('ignore accents, majuscules et ponctuation', () => {
    expect(normalizeText('  Ré Majeur ! ')).toBe('re majeur');
    expect(normalizeText('Fa♯')).toBe('fa diese');
    expect(normalizeText('sous-dominante')).toBe('sous dominante');
  });
  it('lit les nombres écrits de différentes façons', () => {
    expect(parseNumber('1,5')).toBe(1.5);
    expect(parseNumber('3/2')).toBe(1.5);
    expect(parseNumber('1 1/2')).toBe(1.5);
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('1/0')).toBeNull();
  });
});

const mcq: McqQuestion = {
  type: 'mcq', id: 'q1', skill: 's', prompt: 'p', explanation: 'e',
  choices: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], correct: ['b'],
};
const short: ShortQuestion = { type: 'short', id: 'q2', skill: 's', prompt: 'p', explanation: 'e', accepted: ['6'], answerKind: 'number' };

describe('correction', () => {
  it('corrige QCM, réponse courte et association', () => {
    expect(checkQuestion(mcq, { type: 'mcq', choiceId: 'b' }).correct).toBe(true);
    expect(checkQuestion(mcq, { type: 'mcq', choiceId: 'a' }).correct).toBe(false);
    expect(checkQuestion(short, { type: 'short', text: ' 6 ' }).correct).toBe(true);
    expect(checkQuestion(short, { type: 'short', text: '12/2' }).correct).toBe(true);
    expect(checkQuestion(short, { type: 'short', text: '' }).correct).toBe(false);
    const text: ShortQuestion = { ...short, answerKind: 'text', accepted: ['Ré majeur'] };
    expect(checkQuestion(text, { type: 'short', text: 're majeur' }).correct).toBe(true);
    expect(checkQuestion(text, { type: 'short', text: '' }).correct).toBe(false);
    const match = { type: 'match' as const, id: 'm', skill: 's', prompt: 'p', explanation: 'e', pairs: [{ left: 'ronde', right: '4' }, { left: 'blanche', right: '2' }] };
    expect(checkQuestion(match, { type: 'match', mapping: ['4', '2'] })).toEqual({ correct: true, partial: { right: 2, total: 2 } });
    expect(checkQuestion(match, { type: 'match', mapping: ['2', '2'] })).toEqual({ correct: false, partial: { right: 1, total: 2 } });
    // Type de réponse incohérent : jamais juste.
    expect(checkQuestion(mcq, { type: 'short', text: 'B' }).correct).toBe(false);
  });

  it('déroule une évaluation générique', () => {
    const config = { labId: 'x', mode: 'evaluation' as const, exerciseIds: ['a'], difficulty: 1, evaluationLength: 2 };
    let s = createQuiz('s', config, [mcq, { ...mcq, id: 'q3' }], 0);
    s = quizReducer(s, { type: 'answer', answer: { type: 'mcq', choiceId: 'b' }, now: 1000 });
    expect(s.phase).toBe('question');
    s = quizReducer(s, { type: 'answer', answer: { type: 'mcq', choiceId: 'a' }, now: 3000 });
    expect(s.phase).toBe('finished');
    expect(quizSummary(s)).toMatchObject({ total: 2, correct: 1, percent: 50, averageMs: 1500 });
  });
});
