'use client';

import Link from 'next/link';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Card, ProgressBar, SegmentedControl, Toggle, buttonClasses } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { prefetchVexFlowForOffline } from '@/components/notation/vexflow-loader';
import { formatSeconds } from '@/lib/format';
import { describeAnswer, describeExpected } from '@/lib/exercises/check';
import type { DifficultyOption, ExerciseGenerator } from '@/lib/exercises/generators';
import {
  clearActiveQuiz,
  loadActiveQuiz,
  loadQuizHistory,
  saveActiveQuiz,
  skillStats,
  toStoredQuiz,
  upsertQuizSession,
} from '@/lib/exercises/history';
import {
  type QuizAction,
  type QuizMode,
  type QuizState,
  createQuiz,
  currentQuizQuestion,
  quizReducer,
  quizSummary,
} from '@/lib/exercises/session';
import { skillLabel } from '@/lib/exercises/skills';
import type { Question, QuestionAnswer } from '@/lib/exercises/types';
import { readJson, writeErrorMessage, writeJson, type WriteResult } from '@/lib/storage/safe-storage';
import { QuestionView } from './QuestionView';

interface QuizSettings {
  exerciseIds: string[];
  difficulty: number;
  evaluationLength: 10 | 20;
  autoAdvance: boolean;
}

export interface QuizLabProps {
  labId: string;
  exercises: ExerciseGenerator[];
  difficulties: DifficultyOption[];
  /** Ce que mesurent réellement ces exercices (affiché à l'élève). */
  measures: string;
  /** Outils supplémentaires sous la question (ex. écouter le rythme). */
  renderTools?: (question: Question) => ReactNode;
}

function settingsKey(labId: string) {
  return `solfege-progression:quiz:${labId}:settings:v1`;
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

export function QuizLab({ labId, exercises, difficulties, measures, renderTools }: QuizLabProps) {
  const defaults: QuizSettings = {
    exerciseIds: exercises.map((e) => e.id),
    difficulty: difficulties[0]?.value ?? 1,
    evaluationLength: 10,
    autoAdvance: false,
  };
  const [settings, setSettings] = useState<QuizSettings>(defaults);
  const [loaded, setLoaded] = useState(false);
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [paused, setPaused] = useState<QuizState | null>(null);
  const [saveResult, setSaveResult] = useState<WriteResult | null>(null);
  const weakRef = useRef<Record<string, number>>({});

  useEffect(() => prefetchVexFlowForOffline(), []);

  useEffect(() => {
    const saved = readJson(settingsKey(labId), (v): v is Partial<QuizSettings> => typeof v === 'object' && v !== null);
    /* eslint-disable react-hooks/set-state-in-effect -- synchronisation unique avec le stockage du navigateur */
    if (saved) {
      setSettings((d) => ({
        exerciseIds: Array.isArray(saved.exerciseIds) ? saved.exerciseIds.filter((id) => exercises.some((e) => e.id === id)) : d.exerciseIds,
        difficulty: difficulties.some((x) => x.value === saved.difficulty) ? (saved.difficulty as number) : d.difficulty,
        evaluationLength: saved.evaluationLength === 20 ? 20 : 10,
        autoAdvance: typeof saved.autoAdvance === 'boolean' ? saved.autoAdvance : d.autoAdvance,
      }));
    }
    setPaused(loadActiveQuiz(labId));
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    const weights: Record<string, number> = {};
    for (const s of skillStats(loadQuizHistory(labId))) if (s.attempts >= 2) weights[s.skill] = 1 - s.accuracy;
    weakRef.current = weights;
  }, [labId, exercises, difficulties]);

  const update = (patch: Partial<QuizSettings>) =>
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeJson(settingsKey(labId), next);
      return next;
    });

  const available = exercises.filter((e) => e.minDifficulty <= settings.difficulty && settings.exerciseIds.includes(e.id));

  /**
   * Choisit un type d'exercice au hasard. En entraînement, une question portant sur
   * une compétence déjà bien maîtrisée est parfois remplacée, pour revoir plus
   * souvent les points faibles.
   */
  const generate = useCallback((pool: ExerciseGenerator[], difficulty: number, weighted: boolean): Question => {
    const pickGen = () => pool[Math.floor(Math.random() * pool.length)] as ExerciseGenerator;
    const q = pickGen().generate(difficulty);
    if (weighted && (weakRef.current[q.skill] ?? 0.5) < 0.2 && Math.random() < 0.4) return pickGen().generate(difficulty);
    return q;
  }, []);

  useEffect(() => {
    if (!quiz) return;
    let result: WriteResult | null = null;
    if (quiz.config.mode === 'training') {
      if (quiz.items.length > 0) result = upsertQuizSession(toStoredQuiz(quiz));
    } else if (quiz.phase === 'finished') {
      result = quiz.items.length > 0 ? upsertQuizSession(toStoredQuiz(quiz)) : { ok: true };
      clearActiveQuiz(labId);
    } else {
      result = saveActiveQuiz(quiz);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflète le résultat réel de l'écriture
    if (result) setSaveResult(result);
  }, [quiz, labId]);

  const dispatch = useCallback((a: QuizAction) => setQuiz((q) => (q ? quizReducer(q, a) : q)), []);

  const start = (mode: QuizMode) => {
    if (available.length === 0) return;
    const config = {
      labId,
      mode,
      exerciseIds: available.map((e) => e.id),
      difficulty: settings.difficulty,
      evaluationLength: settings.evaluationLength,
    };
    const questions =
      mode === 'evaluation'
        ? Array.from({ length: settings.evaluationLength }, () => generate(available, settings.difficulty, false))
        : [generate(available, settings.difficulty, true)];
    if (mode === 'evaluation') {
      clearActiveQuiz(labId);
      setPaused(null);
    }
    setSaveResult(null);
    setQuiz(createQuiz(newId(), config, questions, Date.now()));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const question = quiz ? currentQuizQuestion(quiz) : null;
  const last = quiz?.items.at(-1) ?? null;
  const inFeedback = quiz?.phase === 'feedback';

  const next = useCallback(() => {
    if (!quiz || quiz.phase !== 'feedback') return;
    const pool = exercises.filter((e) => quiz.config.exerciseIds.includes(e.id));
    dispatch({ type: 'next', question: generate(pool, quiz.config.difficulty, true), now: Date.now() });
  }, [quiz, exercises, dispatch, generate]);

  useEffect(() => {
    if (!inFeedback) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName !== 'INPUT') {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    const t = settings.autoAdvance && last?.correct ? window.setTimeout(next, 1200) : null;
    return () => {
      window.removeEventListener('keydown', onKey);
      if (t) window.clearTimeout(t);
    };
  }, [inFeedback, next, settings.autoAdvance, last]);

  const answer = useCallback((a: QuestionAnswer) => dispatch({ type: 'answer', answer: a, now: Date.now() }), [dispatch]);

  if (!loaded) {
    return <p className="py-16 text-center text-slate-500">Préparation du laboratoire…</p>;
  }

  // ---------------------------------------------------------------- Réglages
  if (!quiz) {
    return (
      <div className="space-y-4">
        {paused && (
          <div className="flex flex-col gap-3 rounded-2xl border border-accent-300 bg-accent-600/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-night-800">Une évaluation est en cours</p>
              <p className="text-sm text-slate-600">
                Question {paused.index + 1} sur {paused.questions.length}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className={buttonClasses('primary')}
                onClick={() => {
                  setQuiz({ ...paused, questionShownAt: Date.now() });
                  setPaused(null);
                }}
              >
                Reprendre
              </button>
              <button
                type="button"
                className={buttonClasses('secondary')}
                onClick={() => {
                  clearActiveQuiz(labId);
                  setPaused(null);
                }}
              >
                Abandonner
              </button>
            </div>
          </div>
        )}
        <Card>
          <div className="space-y-5">
            <SegmentedControl
              legend="Niveau"
              options={difficulties.map((d) => ({ value: d.value, label: d.label }))}
              value={settings.difficulty}
              onChange={(difficulty) => update({ difficulty })}
            />
            <p className="-mt-3 text-xs text-slate-500">{difficulties.find((d) => d.value === settings.difficulty)?.description}</p>
            <fieldset>
              <legend className="mb-1.5 text-sm font-semibold text-slate-700">Exercices</legend>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {exercises.map((e) => {
                  const locked = e.minDifficulty > settings.difficulty;
                  const checked = settings.exerciseIds.includes(e.id);
                  return (
                    <label
                      key={e.id}
                      className={`flex min-h-11 items-start gap-2.5 rounded-xl border px-3 py-2 ${
                        locked ? 'border-dashed border-slate-200 opacity-60' : checked ? 'border-electric-500 bg-electric-500/5' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 size-4 accent-electric-500"
                        disabled={locked}
                        checked={checked && !locked}
                        onChange={(ev) =>
                          update({
                            exerciseIds: ev.target.checked ? [...settings.exerciseIds, e.id] : settings.exerciseIds.filter((x) => x !== e.id),
                          })
                        }
                      />
                      <span>
                        <span className="block text-sm font-semibold text-slate-800">{e.label}</span>
                        <span className="block text-xs text-slate-500">
                          {locked ? `À partir du niveau ${difficulties.find((d) => d.value === e.minDifficulty)?.label ?? e.minDifficulty}` : e.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <Toggle
              label="Enchaîner après une bonne réponse"
              checked={settings.autoAdvance}
              onChange={(autoAdvance) => update({ autoAdvance })}
            />
          </div>
        </Card>
        {available.length === 0 && <p className="text-sm text-danger-700">Choisis au moins un exercice disponible à ce niveau.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" disabled={!available.length} onClick={() => start('training')} className={`${buttonClasses('primary', 'lg')} w-full`}>
            <Icon name="play" /> Commencer l’entraînement
          </button>
          <div className="flex gap-2">
            <button type="button" disabled={!available.length} onClick={() => start('evaluation')} className={`${buttonClasses('secondary', 'lg')} flex-1`}>
              <Icon name="target" /> Évaluation
            </button>
            <label className="sr-only" htmlFor={`${labId}-len`}>
              Nombre de questions
            </label>
            <select
              id={`${labId}-len`}
              value={settings.evaluationLength}
              onChange={(e) => update({ evaluationLength: Number(e.target.value) === 20 ? 20 : 10 })}
              className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold"
            >
              <option value={10}>10 questions</option>
              <option value={20}>20 questions</option>
            </select>
          </div>
        </div>
        <p className="flex gap-2 text-xs text-slate-500">
          <Icon name="info" className="size-4 shrink-0" /> {measures}
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------- Résultats
  if (quiz.phase === 'finished') {
    const s = quizSummary(quiz);
    const bySkill = new Map<string, { c: number; t: number }>();
    for (const i of quiz.items) {
      const v = bySkill.get(i.question.skill) ?? { c: 0, t: 0 };
      v.t += 1;
      if (i.correct) v.c += 1;
      bySkill.set(i.question.skill, v);
    }
    const saveError = saveResult ? writeErrorMessage(saveResult) : null;
    return (
      <div className="space-y-4">
        <Card className="animate-pop overflow-hidden !p-0">
          <div className="bg-night-900 px-5 py-6 text-white">
            <Badge tone={quiz.config.mode === 'training' ? 'electric' : 'accent'}>
              {quiz.config.mode === 'training' ? 'Entraînement terminé' : 'Évaluation terminée'}
            </Badge>
            <p className="mt-3 text-5xl font-extrabold tracking-tight">
              {s.percent}
              <span className="text-2xl text-white/60"> %</span>
            </p>
            <p className="mt-1 text-white/80">
              {s.correct} bonne{s.correct > 1 ? 's' : ''} réponse{s.correct > 1 ? 's' : ''} sur {s.total} · temps moyen {formatSeconds(s.averageMs)}
            </p>
          </div>
          <ul className="divide-y divide-slate-100 px-5 py-2">
            {[...bySkill].map(([skill, v]) => (
              <li key={skill} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">{skillLabel(skill)}</span>
                <span className={`font-semibold ${v.c / v.t >= 0.7 ? 'text-success-700' : 'text-danger-700'}`}>
                  {v.c}/{v.t}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        {saveError ? (
          <p role="alert" className="rounded-xl bg-danger-50 p-3 text-sm text-danger-700">{saveError}</p>
        ) : (
          s.total > 0 && <p className="text-center text-xs text-slate-500">✓ Résultats enregistrés sur cet appareil.</p>
        )}
        {quiz.items.some((i) => !i.correct) && (
          <Card>
            <h2 className="mb-2 font-bold text-night-800">Correction</h2>
            <ol className="space-y-3 text-sm">
              {quiz.items.map((i, k) =>
                i.correct ? null : (
                  <li key={i.question.id} className="rounded-xl bg-mist p-3">
                    <p className="font-semibold text-ink">
                      {k + 1}. {i.question.prompt}
                    </p>
                    <p className="text-danger-700">Ta réponse : {describeAnswer(i.question, i.answer)}</p>
                    <p className="text-success-700">Réponse attendue : {describeExpected(i.question)}</p>
                    <p className="mt-1 text-slate-600">{i.question.explanation}</p>
                  </li>
                ),
              )}
            </ol>
          </Card>
        )}
        <p className="flex gap-2 rounded-xl bg-white p-3 text-xs text-slate-500">
          <Icon name="info" className="size-4 shrink-0" /> {measures}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => start(quiz.config.mode)} className={`${buttonClasses('primary', 'lg')} w-full`}>
            Recommencer
          </button>
          <button type="button" onClick={() => setQuiz(null)} className={`${buttonClasses('secondary', 'lg')} w-full`}>
            Changer les réglages
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- Question
  const correctCount = quiz.items.filter((i) => i.correct).length;
  const saveError = saveResult ? writeErrorMessage(saveResult) : null;
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={quiz.config.mode === 'training' ? 'electric' : 'accent'}>{quiz.config.mode === 'training' ? 'Entraînement' : 'Évaluation'}</Badge>
          {question && <Badge>{skillLabel(question.skill)}</Badge>}
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-slate-700" aria-live="polite">
            {quiz.config.mode === 'training'
              ? `${correctCount}/${quiz.items.length} juste${correctCount > 1 ? 's' : ''}`
              : `Question ${quiz.index + 1}/${quiz.questions.length}`}
          </span>
          {quiz.config.mode === 'training' ? (
            <button type="button" className={buttonClasses('secondary')} onClick={() => dispatch({ type: 'finish', now: Date.now() })}>
              Terminer
            </button>
          ) : (
            <button
              type="button"
              className={buttonClasses('secondary')}
              onClick={() => {
                setPaused(quiz);
                setQuiz(null);
              }}
            >
              Pause
            </button>
          )}
        </div>
      </div>
      {quiz.config.mode === 'evaluation' && <ProgressBar value={quiz.index} max={quiz.questions.length} label="Avancement" tone="accent" />}

      {question && (
        <QuestionView
          key={question.id}
          question={question}
          disabled={quiz.phase !== 'question'}
          feedback={inFeedback && last ? { answer: last.answer, correct: last.correct } : null}
          onAnswer={answer}
        />
      )}
      {question && renderTools?.(question)}

      <div aria-live="polite">
        {inFeedback && last && (
          <div
            data-testid="quiz-feedback"
            className={`animate-fade-in flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between ${
              last.correct ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <Icon name={last.correct ? 'check' : 'x'} className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-semibold">{last.correct ? 'Bonne réponse !' : `Réponse attendue : ${describeExpected(last.question)}`}</p>
                <p className="text-sm text-slate-700">{last.question.explanation}</p>
              </div>
            </div>
            <button type="button" onClick={next} className={`${buttonClasses(last.correct ? 'success' : 'primary')} shrink-0`}>
              Question suivante <Icon name="arrowRight" className="size-4" />
            </button>
          </div>
        )}
      </div>
      <p className={`text-center text-xs ${saveError ? 'text-danger-700' : 'text-slate-500'}`} role={saveError ? 'alert' : undefined}>
        {saveError ?? (saveResult?.ok && quiz.items.length > 0 ? '✓ Réponses enregistrées sur cet appareil.' : '')}
      </p>
      <div className="text-center">
        <Link href="/laboratoires" className="text-sm font-semibold text-electric-600 hover:underline">
          Autres laboratoires
        </Link>
      </div>
    </div>
  );
}
