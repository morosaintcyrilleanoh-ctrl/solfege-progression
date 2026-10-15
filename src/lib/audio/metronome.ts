/**
 * Métronome précis : les clics sont programmés à l'avance sur l'horloge audio
 * (et non avec setInterval, qui dérive). Sans audio, il continue de battre
 * visuellement avec l'horloge du navigateur.
 */
import { getAudioContext, scheduleClick } from './context';

export const MIN_TEMPO = 30;
export const MAX_TEMPO = 240;

export function clampTempo(bpm: number): number {
  if (!Number.isFinite(bpm)) return 60;
  return Math.min(MAX_TEMPO, Math.max(MIN_TEMPO, Math.round(bpm)));
}

/** Durée d'un temps en secondes. */
export function beatSeconds(bpm: number): number {
  return 60 / clampTempo(bpm);
}

/** Tempo moyen à partir des instants de frappe (« tap tempo »), en ignorant les écarts aberrants. */
export function tempoFromTaps(timesMs: number[]): number | null {
  if (timesMs.length < 2) return null;
  const gaps = timesMs.slice(1).map((t, i) => t - (timesMs[i] as number)).filter((g) => g > 200 && g < 2500);
  if (gaps.length === 0) return null;
  const avg = gaps.reduce((s, g) => s + g, 0) / gaps.length;
  return clampTempo(60000 / avg);
}

export interface MetronomeOptions {
  bpm: number;
  beatsPerMeasure: number;
  accent: boolean;
  sound: boolean;
  onBeat: (beatIndex: number) => void;
}

export class Metronome {
  private timer: number | null = null;
  private nextTime = 0;
  private beat = 0;
  private visualTimers: number[] = [];
  private startedWithAudio = false;

  constructor(private options: MetronomeOptions) {}

  update(options: Partial<MetronomeOptions>) {
    this.options = { ...this.options, ...options };
  }

  get running() {
    return this.timer != null;
  }

  start() {
    if (this.timer != null) return;
    const ac = this.options.sound ? getAudioContext() : null;
    this.startedWithAudio = !!ac;
    this.beat = 0;
    if (ac) {
      this.nextTime = ac.currentTime + 0.1;
      this.timer = window.setInterval(() => this.scheduleAudio(ac), 25);
      this.scheduleAudio(ac);
    } else {
      this.nextTime = performance.now() + 100;
      this.timer = window.setInterval(() => this.tickVisual(), 10);
    }
  }

  stop() {
    if (this.timer != null) window.clearInterval(this.timer);
    this.timer = null;
    this.visualTimers.forEach((t) => window.clearTimeout(t));
    this.visualTimers = [];
  }

  /** Programme les clics des 120 prochaines millisecondes. */
  private scheduleAudio(ac: AudioContext) {
    while (this.nextTime < ac.currentTime + 0.12) {
      const beatIndex = this.beat % this.options.beatsPerMeasure;
      scheduleClick(ac, this.nextTime, this.options.accent && beatIndex === 0);
      const delay = Math.max(0, (this.nextTime - ac.currentTime) * 1000);
      this.visualTimers.push(window.setTimeout(() => this.options.onBeat(beatIndex), delay));
      if (this.visualTimers.length > 32) this.visualTimers.splice(0, 16);
      this.nextTime += beatSeconds(this.options.bpm);
      this.beat += 1;
    }
  }

  private tickVisual() {
    const now = performance.now();
    if (now >= this.nextTime) {
      this.options.onBeat(this.beat % this.options.beatsPerMeasure);
      this.beat += 1;
      this.nextTime += beatSeconds(this.options.bpm) * 1000;
    }
  }

  get usesAudio() {
    return this.startedWithAudio;
  }
}
