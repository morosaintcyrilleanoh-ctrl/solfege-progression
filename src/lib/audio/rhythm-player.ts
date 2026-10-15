/** Lecture sonore d'un rythme : une mesure de décompte, puis les figures (les silences restent muets). */
import { toNumber } from '@/lib/music/fraction';
import { type RhythmEvent, type TimeSignature, eventDuration, onsets, pulse } from '@/lib/rhythm';
import { getAudioContext, scheduleClick, scheduleNote } from './context';
import { beatSeconds } from './metronome';

export interface PlaybackPlan {
  countIn: number[];
  notes: { time: number; duration: number }[];
  totalSeconds: number;
}

/** Calcule les instants (en secondes) — séparé de l'audio pour être testé. */
export function planRhythm(measures: RhythmEvent[][], ts: TimeSignature, bpm: number): PlaybackPlan {
  const p = pulse(ts);
  const beatSec = beatSeconds(bpm);
  // Secondes par ronde : un temps (p.beatDuration de ronde) dure beatSec.
  const wholeSec = beatSec / toNumber(p.beatDuration);
  const countIn = Array.from({ length: p.beatsPerMeasure }, (_, i) => i * beatSec);
  const startAt = p.beatsPerMeasure * beatSec;
  const notes: PlaybackPlan['notes'] = [];
  let measureStart = startAt;
  for (const m of measures) {
    const starts = onsets(m);
    m.forEach((e, i) => {
      const prev = m[i - 1];
      if (e.rest || prev?.tie) return; // note liée : prolonge la précédente
      let d = toNumber(eventDuration(e));
      let j = i;
      while (m[j]?.tie && m[j + 1]) {
        j += 1;
        d += toNumber(eventDuration(m[j] as RhythmEvent));
      }
      notes.push({ time: measureStart + toNumber(starts[i]!) * wholeSec, duration: d * wholeSec });
    });
    measureStart += toNumber(eventDuration({ value: 'whole' })) * wholeSec * (ts.beats / ts.unit);
  }
  return { countIn, notes, totalSeconds: measureStart };
}

/** Joue le rythme ; renvoie une fonction d'arrêt, ou null si l'audio est indisponible. */
export function playRhythm(measures: RhythmEvent[][], ts: TimeSignature, bpm: number): { stop: () => void; duration: number } | null {
  const ac = getAudioContext();
  if (!ac) return null;
  const plan = planRhythm(measures, ts, bpm);
  const t0 = ac.currentTime + 0.1;
  const master = ac.createGain();
  master.connect(ac.destination);
  plan.countIn.forEach((t, i) => scheduleClick(ac, t0 + t, i === 0, 0.35, master));
  plan.notes.forEach((n) => scheduleNote(ac, t0 + n.time, n.duration, 523.25, 0.3, master));
  return {
    duration: plan.totalSeconds,
    // Tous les sons passent par `master` : le débrancher coupe aussi ceux déjà programmés.
    stop: () => master.disconnect(),
  };
}
