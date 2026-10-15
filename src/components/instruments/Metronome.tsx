'use client';

import { useEffect, useRef, useState } from 'react';
import { Toggle, buttonClasses } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { MAX_TEMPO, MIN_TEMPO, Metronome as MetronomeEngine, clampTempo, tempoFromTaps } from '@/lib/audio/metronome';

const TEMPO_MARKS: [number, string][] = [
  [40, 'Largo'],
  [60, 'Adagio'],
  [76, 'Andante'],
  [108, 'Moderato'],
  [120, 'Allegro'],
  [168, 'Presto'],
];

export function tempoMark(bpm: number): string {
  let label = 'Grave';
  for (const [min, name] of TEMPO_MARKS) if (bpm >= min) label = name;
  return label;
}

export function Metronome({ initialBpm = 80 }: { initialBpm?: number }) {
  const [bpm, setBpm] = useState(initialBpm);
  const [beats, setBeats] = useState(4);
  const [accent, setAccent] = useState(true);
  const [sound, setSound] = useState(true);
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState<number | null>(null);
  const [silent, setSilent] = useState(false);
  const engine = useRef<MetronomeEngine | null>(null);
  const taps = useRef<number[]>([]);

  useEffect(() => {
    engine.current?.update({ bpm, beatsPerMeasure: beats, accent });
  }, [bpm, beats, accent]);

  useEffect(() => () => engine.current?.stop(), []);

  const toggle = () => {
    if (running) {
      engine.current?.stop();
      setRunning(false);
      setCurrent(null);
      return;
    }
    const m = new MetronomeEngine({ bpm, beatsPerMeasure: beats, accent, sound, onBeat: setCurrent });
    engine.current = m;
    m.start();
    setSilent(sound && !m.usesAudio);
    setRunning(true);
  };

  const tap = () => {
    const now = performance.now();
    taps.current = [...taps.current.filter((t) => now - t < 4000), now].slice(-6);
    const t = tempoFromTaps(taps.current);
    if (t) setBpm(t);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 py-2" aria-hidden="true">
        {Array.from({ length: beats }, (_, i) => (
          <span
            key={i}
            className={`rounded-full transition-all duration-75 ${i === 0 && accent ? 'size-6' : 'size-5'} ${
              current === i ? (i === 0 && accent ? 'scale-125 bg-accent-500' : 'scale-125 bg-electric-500') : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <p className="text-center text-sm font-semibold text-slate-600" aria-live="off">
        {current != null ? `Temps ${current + 1} sur ${beats}` : 'Arrêté'}
      </p>

      <div className="flex items-center justify-center gap-3">
        <button type="button" className={buttonClasses('secondary')} aria-label="Ralentir de 1" onClick={() => setBpm((b) => clampTempo(b - 1))}>
          −
        </button>
        <div className="min-w-28 text-center">
          <p className="text-4xl font-extrabold tabular-nums text-ink">{bpm}</p>
          <p className="text-xs text-slate-500">
            battements/min · {tempoMark(bpm)}
          </p>
        </div>
        <button type="button" className={buttonClasses('secondary')} aria-label="Accélérer de 1" onClick={() => setBpm((b) => clampTempo(b + 1))}>
          +
        </button>
      </div>
      <label className="block">
        <span className="sr-only">Tempo</span>
        <input
          type="range"
          min={MIN_TEMPO}
          max={MAX_TEMPO}
          value={bpm}
          onChange={(e) => setBpm(clampTempo(Number(e.target.value)))}
          className="h-11 w-full accent-electric-500"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={toggle} className={`${buttonClasses(running ? 'secondary' : 'primary', 'lg')} w-full`}>
          {running ? 'Arrêter' : (<><Icon name="play" /> Démarrer</>)}
        </button>
        <button type="button" onClick={tap} className={`${buttonClasses('secondary', 'lg')} w-full`}>
          Taper le tempo
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Temps par mesure</span>
          <select
            value={beats}
            onChange={(e) => setBeats(Number(e.target.value))}
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div>
          <Toggle label="Accentuer le 1er temps" checked={accent} onChange={setAccent} />
          <Toggle
            label="Son"
            description={running ? 'Arrête puis redémarre pour appliquer.' : 'Le métronome bat aussi en silence.'}
            checked={sound}
            onChange={setSound}
          />
        </div>
      </div>
      {silent && <p className="text-sm text-danger-700">Le son n’est pas disponible sur cet appareil : le métronome bat en silence.</p>}
    </div>
  );
}
