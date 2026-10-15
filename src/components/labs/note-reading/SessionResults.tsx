'use client';

import Link from 'next/link';
import { Badge, Card, buttonClasses } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { formatSeconds } from '@/lib/format';
import { formatPitch } from '@/lib/music/pitch';
import { CLEFS, staffPosition } from '@/lib/music/staff';
import { LEVELS } from '@/lib/note-reading/levels';
import { type LabelOptions, answerLabel, explainQuestion, questionKey } from '@/lib/note-reading/questions';
import { type SessionState, summarize } from '@/lib/note-reading/session';

interface SessionResultsProps {
  session: SessionState;
  labelOptions: LabelOptions;
  saveError: string | null;
  onRestart: () => void;
  onSettings: () => void;
}

function verdict(percent: number, total: number): string {
  if (total === 0) return 'Aucune réponse enregistrée pour cette séance.';
  if (percent >= 90) return 'Excellente lecture ! Tu peux passer au niveau suivant.';
  if (percent >= 70) return 'Bonne lecture. Encore un peu d’entraînement pour être tout à fait sûr.';
  if (percent >= 50) return 'C’est un début. Revois les repères de la clé puis réessaie.';
  return 'Prends ton temps : repars des notes de référence de la clé et entraîne-toi en mode entraînement.';
}

export function SessionResults({ session, labelOptions, saveError, onRestart, onSettings }: SessionResultsProps) {
  const summary = summarize(session);
  const { config } = session;
  const fmt = { notation: labelOptions.notation, octave: labelOptions.octaveConvention } as const;

  // Notes manquées pendant cette séance (sans doublon).
  const missed = new Map<string, (typeof session.items)[number]>();
  for (const item of session.items) if (!item.correct) missed.set(questionKey(item.question), item);

  return (
    <div className="space-y-4">
      <Card className="animate-pop overflow-hidden !p-0">
        <div className="bg-night-900 px-5 py-6 text-white">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={config.mode === 'training' ? 'electric' : 'accent'}>
              {config.mode === 'training' ? 'Entraînement terminé' : 'Évaluation terminée'}
            </Badge>
            <span className="text-sm text-white/70">{LEVELS[config.level].label}</span>
          </div>
          <p className="mt-3 text-5xl font-extrabold tracking-tight">
            {summary.percent}
            <span className="text-2xl text-white/60"> %</span>
          </p>
          <p className="mt-1 text-white/80">{verdict(summary.percent, summary.total)}</p>
        </div>
        <dl className="grid grid-cols-3 divide-x divide-slate-200 text-center">
          <div className="p-3">
            <dt className="text-xs text-slate-500">Bonnes réponses</dt>
            <dd className="text-lg font-bold text-ink">
              {summary.correct}/{summary.total}
            </dd>
          </div>
          <div className="p-3">
            <dt className="text-xs text-slate-500">Temps moyen</dt>
            <dd className="text-lg font-bold text-ink">{formatSeconds(summary.averageMs)}</dd>
          </div>
          <div className="p-3">
            <dt className="text-xs text-slate-500">Meilleure série</dt>
            <dd className="text-lg font-bold text-ink">{summary.bestStreak}</dd>
          </div>
        </dl>
      </Card>

      {saveError ? (
        <p role="alert" className="rounded-xl bg-danger-50 p-3 text-sm text-danger-700">{saveError}</p>
      ) : (
        summary.total > 0 && <p className="text-center text-xs text-slate-500">✓ Résultats enregistrés sur cet appareil.</p>
      )}

      {config.mode === 'evaluation' ? (
        <Card>
          <h2 className="mb-3 font-bold text-night-800">Correction</h2>
          <ol className="divide-y divide-slate-100">
            {session.items.map((item, i) => (
              <li key={item.question.id} className="flex items-start gap-3 py-2.5 text-sm">
                <span className="w-6 shrink-0 pt-0.5 text-right text-slate-400">{i + 1}.</span>
                <span className={`mt-0.5 shrink-0 ${item.correct ? 'text-success-600' : 'text-danger-600'}`}>
                  <Icon name={item.correct ? 'check' : 'x'} className="size-4" />
                </span>
                <span className="flex-1">
                  <span className="font-semibold text-ink">{formatPitch(item.question.pitch, fmt)}</span>
                  <span className="text-slate-500">
                    {' '}
                    · {CLEFS[item.question.clef].label}, {staffPosition(item.question.pitch, item.question.clef).description}
                  </span>
                  {!item.correct && <span className="block text-danger-700">Ta réponse : {answerLabel(item.answer, labelOptions)}</span>}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      ) : (
        missed.size > 0 && (
          <Card>
            <h2 className="mb-3 font-bold text-night-800">À revoir</h2>
            <ul className="space-y-2 text-sm text-slate-700">
              {[...missed.values()].map((item) => (
                <li key={questionKey(item.question)} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-danger-500" />
                  {explainQuestion(item.question, labelOptions)}
                </li>
              ))}
            </ul>
          </Card>
        )
      )}

      <p className="flex gap-2 rounded-xl bg-white p-3 text-xs text-slate-500">
        <Icon name="info" className="size-4 shrink-0" />
        Cet exercice mesure la reconnaissance visuelle des notes sur la portée. Il n’évalue ni la justesse de la voix, ni
        le rythme, ni l’oreille.
      </p>

      <div className="grid gap-2 sm:grid-cols-3">
        <button type="button" onClick={onRestart} className={`${buttonClasses('primary', 'lg')} w-full`}>
          Recommencer
        </button>
        <button type="button" onClick={onSettings} className={`${buttonClasses('secondary', 'lg')} w-full`}>
          Changer les réglages
        </button>
        <Link href="/laboratoires/lecture-des-notes/historique" className={`${buttonClasses('ghost', 'lg')} w-full`}>
          Mon historique
        </Link>
      </div>
    </div>
  );
}
