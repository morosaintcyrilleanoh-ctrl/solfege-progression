'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PianoKeyboard, type KeyStatus } from '@/components/instruments/PianoKeyboard';
import { Staff, type StaffStatus } from '@/components/notation/Staff';
import { prefetchVexFlowForOffline } from '@/components/notation/vexflow-loader';
import { Badge, ProgressBar, buttonClasses } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { isAudioSupported, playTone } from '@/lib/audio/synth';
import { formatPitch, frequency, midiNumber, pitchFromMidi } from '@/lib/music/pitch';
import { CLEFS, staffPosition } from '@/lib/music/staff';
import {
  type StoredSession,
  allAttemptRecords,
  clearActiveEvaluation,
  loadActiveEvaluation,
  loadHistory,
  saveActiveEvaluation,
  toStoredSession,
  upsertSession,
} from '@/lib/note-reading/history';
import { CLEF_CHOICES, LEVELS, clefsFor } from '@/lib/note-reading/levels';
import {
  type NoteAnswer,
  answerLabel,
  candidatesFor,
  explainQuestion,
  generateQuestion,
  generateSeries,
  questionKey,
} from '@/lib/note-reading/questions';
import {
  type SessionAction,
  type SessionMode,
  type SessionState,
  createSession,
  currentQuestion,
  sessionReducer,
} from '@/lib/note-reading/session';
import { type NoteLabSettings, DEFAULT_SETTINGS, loadSettings, saveSettings } from '@/lib/note-reading/settings';
import { aggregateNoteStats, focusWeights } from '@/lib/note-reading/stats';
import { type WriteResult, writeErrorMessage } from '@/lib/storage/safe-storage';
import { ClefReminder } from './ClefReminder';
import { AnswerPad } from './AnswerPad';
import { SessionResults } from './SessionResults';
import { SetupPanel } from './SetupPanel';

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

const AUTO_ADVANCE_MS = 900;

export function NoteReadingLab() {
  const [settings, setSettings] = useState<NoteLabSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [audioOk, setAudioOk] = useState(false);
  const [session, setSession] = useState<SessionState | null>(null);
  const [pausedEvaluation, setPausedEvaluation] = useState<SessionState | null>(null);
  const [saveResult, setSaveResult] = useState<WriteResult | null>(null);
  const historyRef = useRef<StoredSession[]>([]);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => prefetchVexFlowForOffline(), []);

  // Lecture du stockage local après le montage (le serveur ne le connaît pas).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- synchronisation unique avec le stockage du navigateur */
    setSettings(loadSettings());
    setPausedEvaluation(loadActiveEvaluation());
    setAudioOk(isAudioSupported());
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    historyRef.current = loadHistory();
  }, []);

  const updateSettings = useCallback((patch: Partial<NoteLabSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const dispatch = useCallback((action: SessionAction) => {
    setSession((prev) => (prev ? sessionReducer(prev, action) : prev));
  }, []);

  // Sauvegarde après chaque réponse : rien n'est perdu si la page se ferme ou si la connexion coupe.
  useEffect(() => {
    if (!session) return;
    let result: WriteResult | null = null;
    if (session.config.mode === 'training') {
      if (session.items.length > 0) result = upsertSession(toStoredSession(session));
    } else if (session.phase === 'finished') {
      result = session.items.length > 0 ? upsertSession(toStoredSession(session)) : { ok: true };
      clearActiveEvaluation();
    } else {
      result = saveActiveEvaluation(session);
    }
    if (result) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reflète le résultat réel de l'écriture
      setSaveResult(result);
      if (result.ok) historyRef.current = loadHistory();
    }
  }, [session]);

  const focusFor = useCallback((current: SessionState | null) => {
    const past = historyRef.current.filter((s) => s.id !== current?.id);
    const records = allAttemptRecords(past).concat(
      (current?.items ?? []).map((i) => ({ k: questionKey(i.question), c: i.correct })),
    );
    return focusWeights(aggregateNoteStats(records));
  }, []);

  const start = useCallback(
    (mode: SessionMode) => {
      const options = { clefChoice: settings.clefChoice, level: settings.level };
      const questions =
        mode === 'evaluation'
          ? generateSeries(settings.evaluationLength, options)
          : [generateQuestion({ ...options, focus: focusFor(null) })];
      if (mode === 'evaluation') {
        clearActiveEvaluation();
        setPausedEvaluation(null);
      }
      setSaveResult(null);
      setSession(
        createSession(
          newId(),
          {
            mode,
            clefChoice: settings.clefChoice,
            level: settings.level,
            answerMode: settings.answerMode,
            evaluationLength: settings.evaluationLength,
          },
          questions,
          Date.now(),
        ),
      );
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [settings, focusFor],
  );

  const resumeEvaluation = useCallback(() => {
    if (!pausedEvaluation) return;
    // Le temps passé hors de l'exercice n'est pas compté.
    setSession({ ...pausedEvaluation, questionShownAt: Date.now() });
    setPausedEvaluation(null);
    setSaveResult(null);
  }, [pausedEvaluation]);

  const abandonEvaluation = useCallback(() => {
    clearActiveEvaluation();
    setPausedEvaluation(null);
  }, []);

  const question = session ? currentQuestion(session) : null;
  const lastItem = session?.items.at(-1) ?? null;
  const inFeedback = session?.phase === 'feedback';

  const answer = useCallback(
    (a: NoteAnswer) => {
      if (!session || session.phase !== 'question' || !question) return;
      dispatch({ type: 'answer', answer: a, now: Date.now() });
      if (settings.sound && session.config.mode === 'training') playTone(frequency(question.pitch));
    },
    [session, question, dispatch, settings.sound],
  );

  const next = useCallback(() => {
    if (!session || session.phase !== 'feedback') return;
    dispatch({
      type: 'next',
      question: generateQuestion({
        clefChoice: session.config.clefChoice,
        level: session.config.level,
        previous: question,
        focus: focusFor(session),
      }),
      now: Date.now(),
    });
  }, [session, question, dispatch, focusFor]);

  // Enchaînement automatique après une bonne réponse.
  useEffect(() => {
    if (!inFeedback || !lastItem?.correct || !settings.autoAdvance) return;
    const t = window.setTimeout(next, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(t);
  }, [inFeedback, lastItem, settings.autoAdvance, next]);

  // Entrée ou espace : question suivante.
  useEffect(() => {
    if (!inFeedback) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inFeedback, next]);

  const pianoRange = useMemo(() => {
    const config = session?.config ?? settings;
    const midis = candidatesFor(config.clefChoice, config.level).map((c) => midiNumber(c.pitch));
    return { low: Math.min(...midis), high: Math.max(...midis) };
  }, [session?.config, settings]);

  const labelOptions = { notation: settings.notation, octaveConvention: settings.octaveConvention };

  if (!loaded) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500" aria-busy="true">
        <span className="mr-2 inline-block size-5 animate-spin rounded-full border-2 border-slate-300 border-t-electric-500" />
        Préparation du laboratoire…
      </div>
    );
  }

  if (!session) {
    return (
      <div ref={topRef} className="space-y-4">
        {pausedEvaluation && (
          <div className="flex flex-col gap-3 rounded-2xl border border-accent-300 bg-accent-600/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-night-800">Une évaluation est en cours</p>
              <p className="text-sm text-slate-600">
                {CLEF_CHOICES.find((c) => c.id === pausedEvaluation.config.clefChoice)?.label} ·{' '}
                {LEVELS[pausedEvaluation.config.level].label} · question {pausedEvaluation.index + 1} sur{' '}
                {pausedEvaluation.questions.length}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" className={buttonClasses('primary')} onClick={resumeEvaluation}>
                Reprendre
              </button>
              <button type="button" className={buttonClasses('secondary')} onClick={abandonEvaluation}>
                Abandonner
              </button>
            </div>
          </div>
        )}
        <SetupPanel settings={settings} onChange={updateSettings} onStart={start} audioSupported={audioOk} />
        <ClefReminder clefs={clefsFor(settings.clefChoice)} notation={settings.notation} />
      </div>
    );
  }

  if (session.phase === 'finished') {
    return (
      <div ref={topRef}>
        <SessionResults
          session={session}
          labelOptions={labelOptions}
          saveError={saveResult ? writeErrorMessage(saveResult) : null}
          onRestart={() => start(session.config.mode)}
          onSettings={() => setSession(null)}
        />
      </div>
    );
  }

  const { config } = session;
  const correctCount = session.items.filter((i) => i.correct).length;
  const withAccidentals = LEVELS[config.level].accidentals;

  let staffStatus: StaffStatus = 'neutral';
  if (inFeedback && lastItem) staffStatus = lastItem.correct ? 'correct' : 'wrong';

  const pianoMarks: Partial<Record<number, KeyStatus>> = {};
  if (inFeedback && lastItem && lastItem.answer.kind === 'key') {
    const expected = midiNumber(lastItem.question.pitch);
    if (lastItem.correct) pianoMarks[expected] = 'correct';
    else {
      pianoMarks[lastItem.answer.midi] = 'wrong';
      pianoMarks[expected] = 'expected';
    }
  }

  const saveError = saveResult ? writeErrorMessage(saveResult) : null;

  return (
    <div ref={topRef} className="space-y-3 sm:space-y-4">
      {/* Barre d'état de la séance */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={config.mode === 'training' ? 'electric' : 'accent'}>
            {config.mode === 'training' ? 'Entraînement' : 'Évaluation'}
          </Badge>
          <Badge>{LEVELS[config.level].label.split(' · ')[0]}</Badge>
          {question && <Badge tone="neutral">{CLEFS[question.clef].label}</Badge>}
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          {config.mode === 'training' ? (
            <span className="font-semibold text-slate-700" aria-live="polite">
              {correctCount}/{session.items.length} juste{correctCount > 1 ? 's' : ''}
              {session.streak >= 2 && <span className="ml-2 text-success-700">· série de {session.streak}</span>}
            </span>
          ) : (
            <span className="font-semibold text-slate-700">
              Question {session.index + 1}/{session.questions.length}
            </span>
          )}
          {config.mode === 'training' ? (
            <button type="button" className={buttonClasses('secondary')} onClick={() => dispatch({ type: 'finish', now: Date.now() })}>
              Terminer
            </button>
          ) : (
            <button
              type="button"
              className={buttonClasses('secondary')}
              onClick={() => {
                // Gardée en mémoire même si le stockage de l'appareil est indisponible.
                setPausedEvaluation(session);
                setSession(null);
              }}
            >
              Pause
            </button>
          )}
        </div>
      </div>
      {config.mode === 'evaluation' && (
        <ProgressBar value={session.index} max={session.questions.length} label="Avancement de l’évaluation" tone="accent" />
      )}

      {/* Portée */}
      <div
        className={`rounded-2xl border-2 bg-white px-2 py-1 shadow-sm transition-colors sm:px-4 ${
          staffStatus === 'correct' ? 'border-success-500' : staffStatus === 'wrong' ? 'border-danger-500 animate-shake' : 'border-slate-200'
        }`}
      >
        {question && (
          <Staff
            key={question.id}
            clef={question.clef}
            pitch={question.pitch}
            status={staffStatus}
            range={LEVELS[config.level]}
            label={`Portée en ${CLEFS[question.clef].label.toLowerCase()} avec une note à identifier`}
          />
        )}
      </div>

      {/* Correction immédiate (entraînement) */}
      <div aria-live="polite" className="min-h-[4.5rem]">
        {inFeedback && lastItem && (
          <div
            className={`animate-fade-in flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between ${
              lastItem.correct ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <Icon name={lastItem.correct ? 'check' : 'x'} className="mt-0.5 size-5 shrink-0" />
              <div>
                {lastItem.correct ? (
                  <p className="font-semibold">
                    Bravo ! C’est bien {formatPitch(lastItem.question.pitch, { notation: settings.notation, octave: settings.octaveConvention })}
                    <span className="font-normal"> — {staffPosition(lastItem.question.pitch, lastItem.question.clef).description}.</span>
                  </p>
                ) : (
                  <>
                    <p className="font-semibold">
                      {lastItem.wrongOctaveOnly
                        ? `Bon nom, mais pas la bonne octave (${answerLabel(lastItem.answer, labelOptions)}).`
                        : `Ce n’est pas ${answerLabel(lastItem.answer, labelOptions)}.`}
                    </p>
                    <p className="text-sm text-slate-700">{explainQuestion(lastItem.question, labelOptions)}</p>
                  </>
                )}
              </div>
            </div>
            <button type="button" onClick={next} className={`${buttonClasses(lastItem.correct ? 'success' : 'primary')} shrink-0`}>
              Question suivante <Icon name="arrowRight" className="size-4" />
            </button>
          </div>
        )}
        {!inFeedback && (
          <p className="pt-1 text-center text-sm text-slate-500">
            {config.answerMode === 'piano'
              ? 'Touche la note sur le clavier : le nom et l’octave sont vérifiés.'
              : withAccidentals
                ? 'Choisis l’altération (si besoin), puis le nom de la note.'
                : 'Quel est le nom de cette note ?'}
          </p>
        )}
      </div>

      {/* Réponse */}
      {config.answerMode === 'piano' ? (
        <PianoKeyboard
          lowMidi={pianoRange.low}
          highMidi={pianoRange.high}
          disabled={session.phase !== 'question'}
          onPress={(midi) => answer({ kind: 'key', midi })}
          marks={pianoMarks}
          cLabel={(m) => formatPitch(pitchFromMidi(m), { notation: settings.notation, octave: settings.octaveConvention })}
          keyLabel={(m) => formatPitch(pitchFromMidi(m), { notation: settings.notation, octave: settings.octaveConvention })}
        />
      ) : (
        <AnswerPad
          key={question?.id}
          notation={settings.notation}
          withAccidentals={withAccidentals}
          disabled={session.phase !== 'question'}
          onAnswer={answer}
          result={
            inFeedback && lastItem && lastItem.answer.kind === 'name'
              ? { chosen: lastItem.answer.letter, expected: lastItem.question.pitch.letter, correct: lastItem.correct }
              : null
          }
        />
      )}

      <p className={`text-center text-xs ${saveError ? 'text-danger-700' : 'text-slate-500'}`} role={saveError ? 'alert' : undefined}>
        {saveError ??
          (saveResult?.ok && session.items.length > 0
            ? config.mode === 'evaluation'
              ? '✓ Avancement sauvegardé sur cet appareil : tu peux faire une pause et reprendre plus tard.'
              : '✓ Réponses enregistrées sur cet appareil.'
            : 'Clavier d’ordinateur : touches 1 à 7 (Do à Si) ou C D E F G A B.')}
      </p>

      <div className="text-center">
        <Link href="/laboratoires/lecture-des-notes/historique" className="text-sm font-semibold text-electric-600 hover:underline">
          Voir mon historique
        </Link>
      </div>
    </div>
  );
}
