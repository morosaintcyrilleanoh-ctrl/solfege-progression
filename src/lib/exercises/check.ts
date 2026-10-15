import type { Question, QuestionAnswer, QuestionCheck } from './types';

/** Minuscules, sans accents ni ponctuation superflue, espaces réduits ; ♯/♭ écrits en toutes lettres. */
export function normalizeText(s: string): string {
  return s
    .replace(/♯|#/g, ' diese')
    .replace(/♭/g, ' bemol')
    .replace(/𝄪/g, ' double diese')
    .replace(/𝄫/g, ' double bemol')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'`.,;:!?«»"()]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** « 1,5 », « 1.5 », « 3/2 », « 1 1/2 » → 1.5 ; null si illisible. */
export function parseNumber(s: string): number | null {
  const t = s.trim().replace(',', '.').replace(/\s+/g, ' ');
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  let m = /^(-?\d+)\s*\/\s*(\d+)$/.exec(t);
  if (m) return Number(m[2]) === 0 ? null : Number(m[1]) / Number(m[2]);
  m = /^(\d+) (\d+)\/(\d+)$/.exec(t);
  if (m) return Number(m[3]) === 0 ? null : Number(m[1]) + Number(m[2]) / Number(m[3]);
  return null;
}

export function checkQuestion(question: Question, answer: QuestionAnswer): QuestionCheck {
  if (question.type === 'mcq' && answer.type === 'mcq') {
    return { correct: question.correct.includes(answer.choiceId) };
  }
  if (question.type === 'short' && answer.type === 'short') {
    if (question.answerKind === 'number') {
      const value = parseNumber(answer.text);
      if (value == null) return { correct: false };
      return { correct: question.accepted.some((a) => Math.abs((parseNumber(a) ?? Number.NaN) - value) < 1e-9) };
    }
    const given = normalizeText(answer.text);
    return { correct: given.length > 0 && question.accepted.some((a) => normalizeText(a) === given) };
  }
  if (question.type === 'match' && answer.type === 'match') {
    const right = question.pairs.filter((p, i) => answer.mapping[i] === p.right).length;
    return { correct: right === question.pairs.length, partial: { right, total: question.pairs.length } };
  }
  return { correct: false };
}

/** Libellé lisible d'une réponse donnée, pour la correction. */
export function describeAnswer(question: Question, answer: QuestionAnswer): string {
  if (question.type === 'mcq' && answer.type === 'mcq') {
    return question.choices.find((c) => c.id === answer.choiceId)?.label ?? '—';
  }
  if (answer.type === 'short') return answer.text.trim() || '(vide)';
  if (question.type === 'match' && answer.type === 'match') {
    return question.pairs.map((p, i) => `${p.left} → ${answer.mapping[i] ?? '?'}`).join(' ; ');
  }
  return '—';
}

/** Bonne réponse lisible. */
export function describeExpected(question: Question): string {
  if (question.type === 'mcq') {
    return question.choices.filter((c) => question.correct.includes(c.id)).map((c) => c.label).join(' ou ');
  }
  if (question.type === 'short') return question.accepted[0] ?? '';
  return question.pairs.map((p) => `${p.left} → ${p.right}`).join(' ; ');
}
