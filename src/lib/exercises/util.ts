import { type Rng, defaultRng } from '@/lib/random';

export function pick<T>(list: readonly T[], rng: Rng = defaultRng): T {
  if (list.length === 0) throw new Error('Liste vide');
  return list[Math.floor(rng() * list.length)] as T;
}

export function shuffle<T>(list: readonly T[], rng: Rng = defaultRng): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

let counter = 0;
export function questionId(prefix: string, rng: Rng = defaultRng): string {
  counter = (counter + 1) % 1_000_000;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}-${Math.floor(rng() * 1e9).toString(36)}`;
}

/** Choix de QCM à partir de libellés ; le premier libellé est la bonne réponse. */
export function mcqChoices(correct: string, distractors: string[], rng: Rng = defaultRng) {
  const unique = [...new Set(distractors.filter((d) => d !== correct))];
  const all = shuffle([correct, ...unique], rng).map((label, i) => ({ id: `c${i}`, label }));
  return { choices: all, correct: all.filter((c) => c.label === correct).map((c) => c.id) };
}
