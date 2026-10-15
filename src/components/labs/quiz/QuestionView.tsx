'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ScoreView } from '@/components/notation/ScoreView';
import { buttonClasses } from '@/components/ui/primitives';
import { shuffle } from '@/lib/exercises/util';
import type { McqQuestion, MatchQuestion, Question, QuestionAnswer, ShortQuestion } from '@/lib/exercises/types';

export interface FeedbackInfo {
  answer: QuestionAnswer;
  correct: boolean;
}

interface QuestionViewProps {
  question: Question;
  disabled: boolean;
  feedback: FeedbackInfo | null;
  onAnswer: (answer: QuestionAnswer) => void;
}

export function QuestionView({ question, disabled, feedback, onAnswer }: QuestionViewProps) {
  return (
    <div className="space-y-3">
      <p className="text-lg font-bold leading-snug text-night-800 sm:text-xl">{question.prompt}</p>
      {question.notation && (
        <div className="rounded-2xl border border-slate-200 bg-white px-2 py-2 shadow-sm sm:px-4">
          <ScoreView notation={question.notation} label="Notation de la question" />
        </div>
      )}
      {question.type === 'mcq' && <McqAnswer question={question} disabled={disabled} feedback={feedback} onAnswer={onAnswer} />}
      {question.type === 'short' && <ShortAnswer question={question} disabled={disabled} feedback={feedback} onAnswer={onAnswer} />}
      {question.type === 'match' && <MatchAnswer question={question} disabled={disabled} feedback={feedback} onAnswer={onAnswer} />}
    </div>
  );
}

function McqAnswer({ question, disabled, feedback, onAnswer }: { question: McqQuestion } & Omit<QuestionViewProps, 'question'>) {
  // Raccourcis clavier : 1, 2, 3…
  useEffect(() => {
    if (disabled) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      const i = Number(e.key) - 1;
      const choice = question.choices[i];
      if (choice) {
        e.preventDefault();
        onAnswer({ type: 'mcq', choiceId: choice.id });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [disabled, question, onAnswer]);

  const chosen = feedback?.answer.type === 'mcq' ? feedback.answer.choiceId : null;
  return (
    <div className={`grid gap-2 ${question.choices.length > 3 ? 'sm:grid-cols-2' : ''}`} role="group" aria-label="Choix de réponse">
      {question.choices.map((c, i) => {
        let tone = 'border-slate-200 bg-white text-ink enabled:hover:border-electric-400 enabled:hover:bg-electric-500/5';
        if (feedback) {
          if (question.correct.includes(c.id)) tone = 'border-success-600 bg-success-600 text-white';
          else if (c.id === chosen) tone = 'border-danger-600 bg-danger-600 text-white';
          else tone = 'border-slate-200 bg-white text-slate-400';
        }
        return (
          <button
            key={c.id}
            type="button"
            disabled={disabled}
            onClick={() => onAnswer({ type: 'mcq', choiceId: c.id })}
            className={`flex min-h-13 items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left text-[15px] font-semibold transition-colors ${tone} disabled:cursor-default`}
          >
            <span className="hidden w-4 shrink-0 text-xs font-medium opacity-50 lg:inline">{i + 1}</span>
            {c.glyph && (
              <span className="w-10 shrink-0 text-center text-3xl leading-[1.7]" style={{ fontFamily: 'Bravura, serif' }} aria-hidden="true">
                {c.glyph}
              </span>
            )}
            <span>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ShortAnswer({ question, disabled, feedback, onAnswer }: { question: ShortQuestion } & Omit<QuestionViewProps, 'question'>) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!disabled) inputRef.current?.focus({ preventScroll: true });
  }, [disabled]);
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled && text.trim()) onAnswer({ type: 'short', text });
      }}
    >
      <label className="sr-only" htmlFor={`short-${question.id}`}>
        Ta réponse
      </label>
      <input
        ref={inputRef}
        id={`short-${question.id}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        inputMode={question.answerKind === 'number' ? 'decimal' : 'text'}
        autoComplete="off"
        maxLength={60}
        placeholder={question.placeholder ?? 'Ta réponse'}
        className={`min-h-12 flex-1 rounded-xl border-2 px-3 text-lg font-semibold outline-none focus:border-electric-500 ${
          feedback ? (feedback.correct ? 'border-success-600 bg-success-50' : 'border-danger-600 bg-danger-50') : 'border-slate-300 bg-white'
        }`}
      />
      <button type="submit" disabled={disabled || !text.trim()} className={buttonClasses('primary', 'lg')}>
        Valider
      </button>
    </form>
  );
}

function MatchAnswer({ question, disabled, feedback, onAnswer }: { question: MatchQuestion } & Omit<QuestionViewProps, 'question'>) {
  // Mélange stable pour cette question.
  const rights = useMemo(() => shuffle(question.pairs.map((p) => p.right)), [question]);
  const [mapping, setMapping] = useState<string[]>(() => question.pairs.map(() => ''));
  const given = feedback?.answer.type === 'match' ? feedback.answer.mapping : null;
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled && mapping.every(Boolean)) onAnswer({ type: 'match', mapping });
      }}
    >
      {question.pairs.map((p, i) => {
        const ok = given ? given[i] === p.right : null;
        return (
          <div key={p.left} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <label htmlFor={`m-${question.id}-${i}`} className="font-semibold text-ink sm:w-1/2">
              {p.left}
            </label>
            <select
              id={`m-${question.id}-${i}`}
              disabled={disabled}
              value={mapping[i]}
              onChange={(e) => setMapping((m) => m.map((v, k) => (k === i ? e.target.value : v)))}
              className={`min-h-11 flex-1 rounded-xl border-2 bg-white px-3 ${
                ok == null ? 'border-slate-300' : ok ? 'border-success-600 bg-success-50' : 'border-danger-600 bg-danger-50'
              }`}
            >
              <option value="">Choisir…</option>
              {rights.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        );
      })}
      <button type="submit" disabled={disabled || !mapping.every(Boolean)} className={`${buttonClasses('primary', 'lg')} w-full`}>
        Valider
      </button>
    </form>
  );
}
