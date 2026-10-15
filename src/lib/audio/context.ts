/** Contexte Web Audio partagé ; null si le navigateur ne le permet pas. */
let ctx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Petit « clic » de métronome (bois), plus aigu pour le premier temps. */
export function scheduleClick(ac: AudioContext, time: number, accent: boolean, volume = 0.5, dest: AudioNode = ac.destination) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(accent ? 1760 : 1175, time);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(volume * (accent ? 1 : 0.6), time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
  osc.connect(gain).connect(dest);
  osc.start(time);
  osc.stop(time + 0.06);
}

/** Note brève (lecture d'un rythme). */
export function scheduleNote(ac: AudioContext, time: number, duration: number, frequency = 523.25, volume = 0.3, dest: AudioNode = ac.destination) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(frequency, time);
  const end = time + Math.max(0.05, Math.min(duration * 0.9, 1.5));
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(volume, time + 0.01);
  gain.gain.setValueAtTime(volume, Math.max(time + 0.011, end - 0.04));
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(gain).connect(dest);
  osc.start(time);
  osc.stop(end + 0.02);
}
