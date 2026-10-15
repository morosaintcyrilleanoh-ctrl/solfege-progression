'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, buttonClasses } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { getAudioContext, scheduleClick } from '@/lib/audio/context';
import { beatSeconds } from '@/lib/audio/metronome';
import { type PulseAnalysis, analyzeTaps } from '@/lib/rhythm/pulse-analysis';

const COUNT_IN = 4;
const MEASURED = 12;

/**
 * Exercice de pulsation : 4 clics de décompte, puis l'élève frappe sur les
 * 12 temps suivants (clics audibles ou visuels). On mesure les écarts.
 */
export function PulseExercise() {
  const [bpm, setBpm] = useState(80);
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [beatIndex, setBeatIndex] = useState<number | null>(null);
  const [result, setResult] = useState<PulseAnalysis | null>(null);
  const [withAudio, setWithAudio] = useState(true);
  const beats = useRef<number[]>([]);
  const taps = useRef<number[]>([]);
  const timers = useRef<number[]>([]);
  const clock = useRef<() => number>(() => performance.now());

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const start = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    taps.current = [];
    setResult(null);
    const ac = getAudioContext();
    setWithAudio(!!ac);
    const step = beatSeconds(bpm) * 1000;
    let t0: number;
    if (ac) {
      // Horloge audio en millisecondes : clics et frappes sont mesurés sur la même horloge.
      clock.current = () => ac.currentTime * 1000;
      t0 = clock.current() + 300;
    } else {
      clock.current = () => performance.now();
      t0 = clock.current() + 300;
    }
    const all = Array.from({ length: COUNT_IN + MEASURED }, (_, i) => t0 + i * step);
    beats.current = all.slice(COUNT_IN);
    all.forEach((t, i) => {
      if (ac) scheduleClick(ac, t / 1000, i % 4 === 0, i < COUNT_IN ? 0.6 : 0.4);
      const delay = t - clock.current();
      timers.current.push(window.setTimeout(() => setBeatIndex(i), Math.max(0, delay)));
    });
    const end = (all.at(-1) as number) + step / 2 - clock.current();
    timers.current.push(
      window.setTimeout(() => {
        setResult(analyzeTaps(beats.current, taps.current));
        setPhase('done');
        setBeatIndex(null);
      }, end),
    );
    setPhase('running');
  };

  const tap = () => {
    if (phase !== 'running') return;
    taps.current.push(clock.current());
  };

  useEffect(() => {
    if (phase !== 'running') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        tap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const counting = beatIndex != null && beatIndex < COUNT_IN;

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm text-slate-600">
          Écoute les {COUNT_IN} clics de départ, puis frappe le gros bouton (ou la barre d’espace) sur chacun des {MEASURED} temps
          suivants.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-700" htmlFor="pulse-bpm">
            Tempo
          </label>
          <select
            id="pulse-bpm"
            value={bpm}
            disabled={phase === 'running'}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-2"
          >
            {[60, 72, 80, 92, 100, 120].map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <button type="button" onClick={start} disabled={phase === 'running'} className={buttonClasses('primary')}>
            <Icon name="play" className="size-4" /> {phase === 'done' ? 'Recommencer' : 'Commencer'}
          </button>
        </div>
      </Card>

      <button
        type="button"
        onPointerDown={tap}
        disabled={phase !== 'running'}
        className={`flex h-44 w-full select-none flex-col items-center justify-center rounded-3xl text-xl font-bold text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-60 ${
          beatIndex != null && beatIndex % 4 === 0 ? 'bg-accent-600' : 'bg-electric-500'
        }`}
      >
        {phase !== 'running' ? 'Frappe ici' : counting ? `Décompte… ${(beatIndex ?? 0) + 1}` : `Frappe ! Temps ${(beatIndex ?? COUNT_IN) - COUNT_IN + 1}/${MEASURED}`}
        {!withAudio && phase === 'running' && <span className="mt-1 text-sm font-medium">(sans son : suis les flashs)</span>}
      </button>

      {result && (
        <Card>
          <h3 className="font-bold text-night-800">Résultat</h3>
          <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div>
              <dt className="text-xs text-slate-500">Temps frappés</dt>
              <dd className="text-xl font-bold">
                {MEASURED - result.missed}/{MEASURED}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Écart moyen</dt>
              <dd className="text-xl font-bold">{result.meanAbsMs != null ? `${result.meanAbsMs} ms` : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Bien placés (±80 ms)</dt>
              <dd className="text-xl font-bold">{result.onTime}</dd>
            </div>
          </dl>
          {result.meanSignedMs != null && Math.abs(result.meanSignedMs) > 40 && (
            <p className="mt-2 text-sm text-slate-700">
              Tendance : tu frappes plutôt {result.meanSignedMs < 0 ? 'en avance' : 'en retard'} (≈ {Math.abs(result.meanSignedMs)} ms).
            </p>
          )}
          {result.extra > 0 && <p className="text-sm text-slate-700">{result.extra} frappe(s) en dehors des temps.</p>}
          <p className="mt-3 flex gap-2 text-xs text-slate-500">
            <Icon name="info" className="size-4 shrink-0" />
            Mesure indicative de la régularité de tes frappes. Le délai de l’écran tactile et du haut-parleur de ton appareil peut
            ajouter quelques dizaines de millisecondes. Ce résultat n’est pas enregistré comme une évaluation.
          </p>
        </Card>
      )}
    </div>
  );
}
