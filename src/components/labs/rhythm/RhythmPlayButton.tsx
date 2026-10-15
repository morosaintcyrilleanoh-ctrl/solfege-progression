'use client';

import { useEffect, useRef, useState } from 'react';
import { buttonClasses } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { playRhythm } from '@/lib/audio/rhythm-player';
import type { RhythmEvent, TimeSignature } from '@/lib/rhythm';

/** Écouter un rythme (après une mesure de décompte). Facultatif : l'exercice se fait sans le son. */
export function RhythmPlayButton({ measures, timeSignature }: { measures: RhythmEvent[][]; timeSignature: TimeSignature }) {
  const [bpm, setBpm] = useState(72);
  const [playing, setPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  const timer = useRef<number | null>(null);

  const stop = () => {
    stopRef.current?.();
    stopRef.current = null;
    if (timer.current) window.clearTimeout(timer.current);
    setPlaying(false);
  };

  useEffect(() => () => stop(), []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className={buttonClasses('secondary')}
        onClick={() => {
          if (playing) return stop();
          const p = playRhythm(measures, timeSignature, bpm);
          if (!p) return setUnavailable(true);
          stopRef.current = p.stop;
          setPlaying(true);
          timer.current = window.setTimeout(() => setPlaying(false), (p.duration + 0.3) * 1000);
        }}
      >
        <Icon name={playing ? 'mute' : 'sound'} className="size-4" /> {playing ? 'Arrêter' : 'Écouter le rythme'}
      </button>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        Tempo
        <select value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="min-h-11 rounded-lg border border-slate-300 bg-white px-2">
          {[52, 60, 72, 88, 100, 120].map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>
      {unavailable && <span className="text-sm text-danger-700">Le son n’est pas disponible sur cet appareil.</span>}
    </div>
  );
}
