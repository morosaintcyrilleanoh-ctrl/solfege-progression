'use client';

import { useEffect, useState } from 'react';
import { type Accidental, type Letter, FRENCH_NAMES, LETTERS, type NameNotation } from '@/lib/music/pitch';
import type { NoteAnswer } from '@/lib/note-reading/questions';

const ACCIDENTAL_CHOICES: { value: Accidental; symbol: string; label: string }[] = [
  { value: -1, symbol: '♭', label: 'Bémol' },
  { value: 0, symbol: '♮', label: 'Naturel' },
  { value: 1, symbol: '♯', label: 'Dièse' },
];

interface AnswerPadProps {
  notation: NameNotation;
  withAccidentals: boolean;
  disabled: boolean;
  onAnswer: (answer: NoteAnswer) => void;
  /** Marque les boutons après correction. */
  result?: { chosen: Letter; expected: Letter; correct: boolean } | null;
}

/**
 * Réponse par boutons, ou au clavier de l'ordinateur :
 * 1 à 7 (Do à Si) ou C D E F G A B ; « + » ou « # » = dièse, « - » = bémol, « 0 » ou « = » = naturel.
 * Le parent remonte le composant à chaque question (prop `key`) pour revenir à « naturel ».
 */
export function AnswerPad({ notation, withAccidentals, disabled, onAnswer, result }: AnswerPadProps) {
  const [accidental, setAccidental] = useState<Accidental>(0);

  useEffect(() => {
    if (disabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      const k = e.key;
      if (withAccidentals) {
        if (k === '+' || k === '#') return void setAccidental(1);
        if (k === '-') return void setAccidental(-1);
        if (k === '0' || k === '=') return void setAccidental(0);
      }
      let letter: Letter | undefined;
      if (/^[1-7]$/.test(k)) letter = LETTERS[Number(k) - 1];
      else if (/^[a-gA-G]$/.test(k)) letter = k.toUpperCase() as Letter;
      if (letter) {
        e.preventDefault();
        onAnswer({ kind: 'name', letter, accidental: withAccidentals ? accidental : 0 });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [disabled, withAccidentals, accidental, onAnswer]);

  return (
    <div className="space-y-2.5">
      {withAccidentals && (
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Altération">
          {ACCIDENTAL_CHOICES.map((a) => (
            <button
              key={a.value}
              type="button"
              disabled={disabled}
              aria-pressed={accidental === a.value}
              onClick={() => setAccidental(a.value)}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition-colors ${
                accidental === a.value
                  ? 'border-accent-500 bg-accent-600 text-white'
                  : 'border-slate-200 bg-white text-slate-700'
              } disabled:opacity-50`}
            >
              <span className="text-xl leading-none">{a.symbol}</span> {a.label}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2" role="group" aria-label="Nom de la note">
        {LETTERS.map((letter, i) => {
          const label = notation === 'fr' ? FRENCH_NAMES[letter] : letter;
          let tone = 'border-slate-200 bg-white text-ink enabled:hover:border-electric-400 enabled:hover:bg-electric-500/5 enabled:active:bg-electric-500/15';
          if (result) {
            if (letter === result.expected) tone = 'border-success-600 bg-success-600 text-white';
            else if (letter === result.chosen && !result.correct) tone = 'border-danger-600 bg-danger-600 text-white';
            else tone = 'border-slate-200 bg-white text-slate-400';
          }
          return (
            <button
              key={letter}
              type="button"
              disabled={disabled}
              onClick={() => onAnswer({ kind: 'name', letter, accidental: withAccidentals ? accidental : 0 })}
              className={`relative flex min-h-14 flex-col items-center justify-center rounded-xl border-2 px-0.5 text-[15px] font-bold transition-colors sm:min-h-16 sm:text-lg ${tone} disabled:cursor-default`}
            >
              {label}
              {withAccidentals && accidental !== 0 && !result && (
                <span className="text-xs font-semibold text-accent-600">{accidental === 1 ? '♯' : '♭'}</span>
              )}
              <span className="absolute right-1 top-0.5 hidden text-[10px] font-medium text-slate-400 lg:block">{i + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
