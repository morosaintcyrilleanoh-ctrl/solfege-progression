'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Card, ProgressBar, buttonClasses } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { formatDateTime } from '@/lib/format';
import { formatPitch } from '@/lib/music/pitch';
import { CLEFS } from '@/lib/music/staff';
import { type StoredSession, allAttemptRecords, loadActiveEvaluation, loadHistory } from '@/lib/note-reading/history';
import { LEVELS, LEVEL_IDS } from '@/lib/note-reading/levels';
import { aggregateNoteStats, weakNotes } from '@/lib/note-reading/stats';

/** Objectif par défaut, en attendant que le formateur puisse le personnaliser. */
const WEEKLY_GOAL_ANSWERS = 100;

function startOfWeek(now: Date): Date {
  const d = new Date(now);
  const day = (d.getDay() + 6) % 7; // lundi = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

export function StudentDashboard() {
  const [data, setData] = useState<{ history: StoredSession[]; hasPausedEvaluation: boolean; weekStart: number } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage du navigateur
    setData({ history: loadHistory(), hasPausedEvaluation: loadActiveEvaluation() != null, weekStart: startOfWeek(new Date()).getTime() });
  }, []);

  const derived = useMemo(() => {
    if (!data) return null;
    const { history, weekStart } = data;
    const weak = weakNotes(aggregateNoteStats(allAttemptRecords(history)), 4);
    const weekAnswers = history.filter((s) => new Date(s.startedAt).getTime() >= weekStart).reduce((n, s) => n + s.total, 0);
    const levels = LEVEL_IDS.map((id) => {
      const sessions = history.filter((s) => s.level === id);
      const total = sessions.reduce((n, s) => n + s.total, 0);
      const correct = sessions.reduce((n, s) => n + s.correct, 0);
      return { id, total, correct };
    });
    return { weak, weekAnswers, levels, last: history[0] ?? null, recent: history.slice(0, 3) };
  }, [data]);

  if (!data || !derived) return <p className="py-12 text-center text-slate-500">Chargement…</p>;

  const { weak, weekAnswers, levels, last, recent } = derived;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2 !bg-night-900 !border-night-700 text-white">
        <p className="text-sm text-accent-300">Bonjour !</p>
        <h2 className="mt-1 text-xl font-bold">
          {last ? 'Prêt à continuer ta lecture de notes ?' : 'Commence ton premier exercice de lecture'}
        </h2>
        {last && (
          <p className="mt-1 text-sm text-white/70">
            Dernière séance : {formatDateTime(last.startedAt)} · {LEVELS[last.level].label} · {last.correct}/{last.total}
          </p>
        )}
        <Link href="/laboratoires/lecture-des-notes" className={`${buttonClasses('primary', 'lg')} mt-4`}>
          <Icon name="play" /> {data.hasPausedEvaluation ? 'Reprendre mon évaluation' : 'Reprendre mon apprentissage'}
        </Link>
      </Card>

      <Card>
        <h2 className="flex items-center gap-2 font-bold text-night-800">
          <Icon name="target" className="size-5 text-accent-600" /> Objectif de la semaine
        </h2>
        <p className="mt-2 text-2xl font-extrabold text-ink">
          {Math.min(weekAnswers, WEEKLY_GOAL_ANSWERS)}
          <span className="text-base font-medium text-slate-500"> / {WEEKLY_GOAL_ANSWERS} notes lues</span>
        </p>
        <div className="mt-2">
          <ProgressBar value={Math.min(weekAnswers, WEEKLY_GOAL_ANSWERS)} max={WEEKLY_GOAL_ANSWERS} label="Objectif de la semaine" tone="success" />
        </div>
        <p className="mt-2 text-xs text-slate-500">Objectif par défaut. Il pourra être fixé par ton formateur.</p>
      </Card>

      <Card className="lg:col-span-2">
        <h2 className="font-bold text-night-800">Lecture des notes · progression par niveau</h2>
        <ul className="mt-3 space-y-3">
          {levels.map(({ id, total, correct }) => (
            <li key={id}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-slate-700">{LEVELS[id].label}</span>
                <span className="text-slate-500">{total ? `${Math.round((correct / total) * 100)} % · ${total} réponses` : 'non commencé'}</span>
              </div>
              <ProgressBar value={correct} max={total || 1} label={LEVELS[id].label} tone={total && correct / total >= 0.8 ? 'success' : 'electric'} />
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="font-bold text-night-800">Exercices recommandés</h2>
        {weak.length ? (
          <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
            {weak.map((w) => (
              <li key={w.key}>
                Revoir <strong>{formatPitch(w.pitch)}</strong> en {CLEFS[w.clef].label.toLowerCase()} ({w.correct}/{w.attempts})
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            {last ? 'Aucune note en difficulté. Essaie le niveau suivant !' : 'Les recommandations apparaîtront après tes premiers exercices.'}
          </p>
        )}
      </Card>

      <Card className="lg:col-span-2">
        <h2 className="font-bold text-night-800">Résultats récents</h2>
        {recent.length ? (
          <ul className="mt-2 divide-y divide-slate-100">
            {recent.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {formatDateTime(s.startedAt)} <Badge tone={s.mode === 'training' ? 'electric' : 'accent'}>{s.mode === 'training' ? 'Entraînement' : 'Évaluation'}</Badge>
                </span>
                <span className="font-semibold">{s.correct}/{s.total}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Aucun résultat pour l’instant.</p>
        )}
      </Card>

      <Card>
        <h2 className="font-bold text-night-800">Prochain cours en direct</h2>
        <p className="mt-2 text-sm text-slate-500">
          Le calendrier des lives sera disponible avec les comptes élèves et l’espace live.
        </p>
      </Card>
    </div>
  );
}
