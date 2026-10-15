import { type Accidental, type Letter, type Pitch, ACCIDENTAL_NAMES_FR, FRENCH_NAMES, formatPitch } from '@/lib/music/pitch';
import type { Key } from '@/lib/music/keys';

/** « Fa♯ » */
export function noteName(p: Pick<Pitch, 'letter' | 'accidental'>): string {
  return formatPitch({ ...p, octave: 4 }, { octave: false });
}

/** Écritures acceptées pour une réponse courte : « Fa♯ », « fa# », « fa dièse », « sib », « si b »… */
export function noteAnswerVariants(p: Pick<Pitch, 'letter' | 'accidental'>): string[] {
  const name = FRENCH_NAMES[p.letter];
  if (p.accidental === 0) return [name, `${name} naturel`, `${name} bécarre`];
  const word = ACCIDENTAL_NAMES_FR[p.accidental];
  const v = [noteName(p), `${name} ${word}`];
  if (p.accidental === -1) v.push(`${name}b`, `${name} b`);
  return v;
}

export function tonicOf(key: Key): { letter: Letter; accidental: Accidental } {
  return key.tonic;
}

/** Distracteurs plausibles pour une note : voisins enharmoniques et altérations voisines. */
export function noteDistractors(p: Pick<Pitch, 'letter' | 'accidental'>): Pick<Pitch, 'letter' | 'accidental'>[] {
  const letters: Letter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const i = letters.indexOf(p.letter);
  const up = letters[(i + 1) % 7] as Letter;
  const down = letters[(i + 6) % 7] as Letter;
  const list: Pick<Pitch, 'letter' | 'accidental'>[] = [
    { letter: p.letter, accidental: (p.accidental === 0 ? 1 : 0) as Accidental },
    { letter: p.letter, accidental: (p.accidental === 0 ? -1 : -p.accidental) as Accidental },
    { letter: up, accidental: (p.accidental === 1 ? 0 : -1) as Accidental },
    { letter: down, accidental: (p.accidental === -1 ? 0 : 1) as Accidental },
    { letter: up, accidental: p.accidental },
    { letter: down, accidental: p.accidental },
  ];
  return list.filter((d) => Math.abs(d.accidental) <= 1 && !(d.letter === p.letter && d.accidental === p.accidental));
}
