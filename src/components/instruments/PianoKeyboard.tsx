'use client';

import { useEffect, useRef } from 'react';

const BLACK_PCS = new Set([1, 3, 6, 8, 10]);

export type KeyStatus = 'correct' | 'wrong' | 'expected';

interface PianoKeyboardProps {
  /** Première touche (sera arrondie au Do inférieur). */
  lowMidi: number;
  /** Dernière touche (sera arrondie au Si supérieur). */
  highMidi: number;
  onPress: (midi: number) => void;
  disabled?: boolean;
  marks?: Partial<Record<number, KeyStatus>>;
  /** Libellé affiché sur les Do pour se repérer, ex. « Do 3 ». */
  cLabel: (midi: number) => string;
  /** Nom accessible de chaque touche. */
  keyLabel: (midi: number) => string;
}

const MARK_CLASSES: Record<KeyStatus, { white: string; black: string }> = {
  correct: { white: 'bg-success-500 text-white', black: 'bg-success-600' },
  wrong: { white: 'bg-danger-500 text-white', black: 'bg-danger-600' },
  expected: { white: 'bg-success-50 ring-4 ring-inset ring-success-500', black: 'bg-success-600 ring-2 ring-success-300' },
};

export function PianoKeyboard({ lowMidi, highMidi, onPress, disabled, marks = {}, cLabel, keyLabel }: PianoKeyboardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const start = lowMidi - (((lowMidi % 12) + 12) % 12);
  const end = highMidi + (11 - (((highMidi % 12) + 12) % 12));

  const whites: number[] = [];
  const blacks: { midi: number; whiteIndex: number }[] = [];
  for (let m = start; m <= end; m++) {
    if (BLACK_PCS.has(m % 12)) blacks.push({ midi: m, whiteIndex: whites.length });
    else whites.push(m);
  }

  // Centre le clavier au chargement (sans jamais centrer sur la réponse attendue).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [start, end]);

  const widthPct = 100 / whites.length;

  return (
    <div ref={scrollRef} className="overflow-x-auto overscroll-x-contain rounded-xl bg-night-900 p-1.5 [scrollbar-width:thin]">
      <div className="relative h-36 select-none sm:h-40" style={{ minWidth: `${whites.length * 2.6}rem` }}>
        <div className="flex h-full gap-px">
          {whites.map((m) => {
            const mark = marks[m];
            return (
              <button
                key={m}
                type="button"
                disabled={disabled}
                aria-label={keyLabel(m)}
                onClick={() => onPress(m)}
                className={`flex h-full flex-1 items-end justify-center rounded-b-md pb-1.5 text-[10px] font-semibold text-slate-400 transition-colors disabled:cursor-default ${
                  mark ? MARK_CLASSES[mark].white : 'bg-white active:bg-electric-300/40 enabled:hover:bg-slate-100'
                }`}
              >
                {m % 12 === 0 ? cLabel(m) : ''}
              </button>
            );
          })}
        </div>
        {blacks.map(({ midi, whiteIndex }) => {
          const mark = marks[midi];
          return (
            <button
              key={midi}
              type="button"
              disabled={disabled}
              aria-label={keyLabel(midi)}
              onClick={() => onPress(midi)}
              className={`absolute top-0 h-[60%] rounded-b-md transition-colors disabled:cursor-default ${
                mark ? MARK_CLASSES[mark].black : 'bg-night-950 active:bg-electric-600 enabled:hover:bg-night-700'
              }`}
              style={{ left: `calc(${whiteIndex * widthPct}% - ${widthPct * 0.3}%)`, width: `${widthPct * 0.6}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
