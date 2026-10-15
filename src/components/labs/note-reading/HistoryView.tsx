'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Card, ProgressBar, buttonClasses } from '@/components/ui/primitives';
import { formatDateTime, formatSeconds } from '@/lib/format';
import { formatPitch } from '@/lib/music/pitch';
import { CLEFS } from '@/lib/music/staff';
import { type StoredSession, allAttemptRecords, clearHistory, loadHistory } from '@/lib/note-reading/history';
import { CLEF_CHOICES, LEVELS } from '@/lib/note-reading/levels';
import { aggregateNoteStats, weakNotes } from '@/lib/note-reading/stats';
import { writeErrorMessage } from '@/lib/storage/safe-storage';

/** Score des dernières séances, une barre par séance (la plus ancienne à gauche). */
function ScoreChart({ sessions }: { sessions: StoredSession[] }) {
  const data = sessions.slice(0, 12).reverse();
  const [hover, setHover] = useState<number | null>(null);
  const W = 320;
  const H = 120;
  const pad = { top: 8, bottom: 18, left: 26 };
  const slot = (W - pad.left) / Math.max(data.length, 1);
  const barW = Math.min(22, slot - 4);
  const y = (pct: number) => pad.top + (1 - pct / 100) * (H - pad.top - pad.bottom);
  const hovered = hover != null ? data[hover] : null;

  return (
    <figure>
      <figcaption className="mb-1 text-sm font-semibold text-slate-700">Score des dernières séances (%)</figcaption>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Graphique du score de chaque séance">
          {[0, 50, 100].map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={W} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeWidth={1} />
              <text x={pad.left - 4} y={y(t) + 3} textAnchor="end" fontSize={9} fill="#64748b">
                {t}
              </text>
            </g>
          ))}
          {data.map((s, i) => {
            const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
            const x = pad.left + i * slot + (slot - barW) / 2;
            const top = y(pct);
            const base = y(0);
            const h = Math.max(0, base - top);
            const r = Math.min(4, h);
            return (
              <g key={s.id} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                {/* Zone de survol plus large que la barre */}
                <rect x={pad.left + i * slot} y={pad.top} width={slot} height={base - pad.top} fill="transparent" />
                <path
                  d={`M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${base} Z`}
                  fill={hover === i ? '#1f63e6' : '#2f7bff'}
                />
              </g>
            );
          })}
        </svg>
        {hovered && (
          <div className="pointer-events-none absolute right-0 top-0 rounded-lg bg-night-900 px-2.5 py-1.5 text-xs text-white shadow">
            {formatDateTime(hovered.startedAt)} · {hovered.correct}/{hovered.total} ·{' '}
            {hovered.mode === 'training' ? 'entraînement' : 'évaluation'}
          </div>
        )}
      </div>
    </figure>
  );
}

export function HistoryView() {
  const [history, setHistory] = useState<StoredSession[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage du navigateur
    setHistory(loadHistory());
  }, []);

  const stats = useMemo(() => aggregateNoteStats(allAttemptRecords(history ?? [])), [history]);
  const weak = useMemo(() => weakNotes(stats), [stats]);

  if (history == null) {
    return <p className="py-12 text-center text-slate-500">Chargement de l’historique…</p>;
  }

  if (history.length === 0) {
    return (
      <Card className="text-center">
        <p className="font-semibold text-night-800">Aucune séance enregistrée sur cet appareil.</p>
        <p className="mt-1 text-sm text-slate-500">Tes résultats apparaîtront ici après ton premier exercice.</p>
        <Link href="/laboratoires/lecture-des-notes" className={`${buttonClasses('primary')} mt-4`}>
          Commencer un exercice
        </Link>
      </Card>
    );
  }

  const byClef = (['treble', 'bass'] as const).map((clef) => {
    const s = stats.filter((x) => x.clef === clef);
    const attempts = s.reduce((n, x) => n + x.attempts, 0);
    const correct = s.reduce((n, x) => n + x.correct, 0);
    return { clef, attempts, correct };
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {byClef.map(({ clef, attempts, correct }) => (
          <Card key={clef}>
            <p className="text-sm font-semibold text-slate-600">{CLEFS[clef].label}</p>
            {attempts > 0 ? (
              <>
                <p className="mt-1 text-2xl font-extrabold text-ink">
                  {Math.round((correct / attempts) * 100)} %
                  <span className="ml-2 text-sm font-medium text-slate-500">
                    {correct}/{attempts} réponses justes
                  </span>
                </p>
                <div className="mt-2">
                  <ProgressBar value={correct} max={attempts} label={`Réussite en ${CLEFS[clef].label.toLowerCase()}`} tone="success" />
                </div>
              </>
            ) : (
              <p className="mt-1 text-sm text-slate-500">Pas encore pratiquée.</p>
            )}
          </Card>
        ))}
      </div>

      <Card>
        <ScoreChart sessions={history} />
      </Card>

      <Card>
        <h2 className="font-bold text-night-800">Notes à revoir</h2>
        {weak.length > 0 ? (
          <>
            <p className="mt-1 text-sm text-slate-500">Notes réussies moins de 7 fois sur 10 (au moins 2 essais). Elles reviennent plus souvent en entraînement.</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {weak.map((w) => (
                <li key={w.key} className="rounded-xl border border-danger-500/30 bg-danger-50 px-3 py-1.5 text-sm">
                  <span className="font-semibold text-danger-700">{formatPitch(w.pitch)}</span>
                  <span className="text-slate-600">
                    {' '}
                    · {CLEFS[w.clef].label} · {w.correct}/{w.attempts}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-1 text-sm text-slate-500">Aucune note en difficulté pour l’instant. Continue ainsi !</p>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 font-bold text-night-800">Séances</h2>
        <ul className="divide-y divide-slate-100">
          {history.map((s) => {
            const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
            return (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <div>
                  <p className="font-semibold text-ink">
                    {formatDateTime(s.startedAt)}{' '}
                    <Badge tone={s.mode === 'training' ? 'electric' : 'accent'}>{s.mode === 'training' ? 'Entraînement' : 'Évaluation'}</Badge>
                  </p>
                  <p className="text-xs text-slate-500">
                    {CLEF_CHOICES.find((c) => c.id === s.clefChoice)?.label} · {LEVELS[s.level].label} · temps moyen{' '}
                    {formatSeconds(s.averageMs)}
                  </p>
                </div>
                <p className={`text-base font-bold ${pct >= 70 ? 'text-success-700' : 'text-slate-700'}`}>
                  {s.correct}/{s.total} <span className="text-xs font-medium text-slate-500">({pct} %)</span>
                </p>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="flex flex-col items-center gap-2">
        <p className="text-center text-xs text-slate-500">
          Cet historique est enregistré uniquement sur cet appareil. La synchronisation avec ton compte arrivera avec la connexion.
        </p>
        <button
          type="button"
          className={buttonClasses('ghost')}
          onClick={() => {
            if (!window.confirm('Effacer tout l’historique de lecture de notes sur cet appareil ?')) return;
            const result = clearHistory();
            if (result.ok) setHistory([]);
            setMessage(writeErrorMessage(result) ?? null);
          }}
        >
          Effacer l’historique
        </button>
        {message && <p role="alert" className="text-sm text-danger-700">{message}</p>}
      </div>
    </div>
  );
}
