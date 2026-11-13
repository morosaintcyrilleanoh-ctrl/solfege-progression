/**
 * Piano enregistré (Salamander Grand Piano, Alexander Holm, CC BY 3.0), partagé avec
 * Music Progression Lab : les fichiers sont servis par le Lab (/assets/piano). Hors
 * du Lab (site Solfège Progression) ou hors connexion, le son synthétisé est utilisé.
 */
const NAMES = ['C', 'Ds', 'Fs', 'A'];
const SAMPLES: { midi: number; file: string }[] = [];
for (let octave = 2; octave <= 6; octave++) NAMES.forEach((n, i) => SAMPLES.push({ midi: 12 * (octave + 1) + i * 3, file: `${n}${octave}` }));
SAMPLES.push({ midi: 96, file: 'C7' });

const buffers = new Map<number, { buffer: AudioBuffer; norm: number }>();
let loading: Promise<void> | null = null;

/** Le volet Solfège est-il servi par Music Progression Lab (dossier /solfege) ? */
export const insideLab = () => typeof window !== 'undefined' && window.location.pathname.startsWith('/solfege');

export function loadPianoSamples(ac: BaseAudioContext): Promise<void> | null {
  if (loading || !insideLab()) return loading;
  loading = Promise.all(
    SAMPLES.map(async (s) => {
      try {
        const res = await fetch(`/assets/piano/${s.file}.mp3`);
        if (!res.ok) return;
        const buffer = await ac.decodeAudioData(await res.arrayBuffer());
        // Toutes les notes au même niveau (les aigus sont enregistrés plus doucement)
        let peak = 0;
        const ch = buffer.getChannelData(0);
        for (let i = 0; i < ch.length; i++) peak = Math.max(peak, Math.abs(ch[i] as number));
        buffers.set(s.midi, { buffer, norm: peak > 0 ? Math.min(6, 0.9 / peak) : 1 });
      } catch {
        /* hors connexion : son synthétisé */
      }
    }),
  ).then(() => undefined);
  return loading;
}

/** Joue une note enregistrée ; false si aucun son n'est chargé pour cette hauteur. */
export function schedulePianoSample(ac: BaseAudioContext, dest: AudioNode, frequency: number, when: number, duration: number, volume: number): boolean {
  loadPianoSamples(ac);
  const midi = 69 + 12 * Math.log2(frequency / 440);
  let best: { midi: number } | null = null;
  for (const s of SAMPLES) if (buffers.has(s.midi) && (!best || Math.abs(s.midi - midi) < Math.abs(best.midi - midi))) best = s;
  if (!best || Math.abs(best.midi - midi) > 6) return false;
  const sample = buffers.get(best.midi)!;
  const src = ac.createBufferSource();
  src.buffer = sample.buffer;
  src.playbackRate.value = Math.pow(2, (midi - best.midi) / 12);
  const env = ac.createGain();
  const level = Math.min(2.5, volume * 2 * sample.norm);
  env.gain.setValueAtTime(level, when);
  env.gain.setValueAtTime(level, when + duration);
  env.gain.exponentialRampToValueAtTime(0.0001, when + duration + 0.35); // étouffoir
  src.connect(env).connect(dest);
  src.start(when);
  src.stop(when + duration + 0.4);
  return true;
}
