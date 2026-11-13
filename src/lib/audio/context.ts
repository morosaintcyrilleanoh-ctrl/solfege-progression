import { schedulePianoSample } from './piano-samples';
/** Contexte Web Audio partagé ; null si le navigateur ne le permet pas. */
let ctx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      // iPhone : jouer même si le bouton silencieux est activé
      try {
        const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
        if (session) session.type = 'playback';
      } catch {
        /* non pris en charge */
      }
      ctx = new Ctor({ latencyHint: 'interactive' });
      keepAwake(ctx);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Sortie commune : volume → compresseur → plafond doux → haut-parleurs.
// Sons forts et réguliers (casque Bluetooth, téléphone), jamais saturés.
// ---------------------------------------------------------------------------
const outputs = new WeakMap<BaseAudioContext, AudioNode>();

export function masterOutput(ac: BaseAudioContext): AudioNode {
  let out = outputs.get(ac);
  if (!out) {
    const input = ac.createGain();
    input.gain.value = 1.8;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 6;
    comp.ratio.value = 12;
    comp.attack.value = 0.002;
    comp.release.value = 0.2;
    const master = ac.createGain();
    master.gain.value = 1.3; // le compresseur ajoute déjà un gain automatique ; le plafond doux protège
    // Plafond doux : rien ne change sous 80 % du maximum, au-dessus le son est arrondi
    const n = 4096;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = ((i / (n - 1)) * 2 - 1) * 2;
      const a = Math.abs(x);
      curve[i] = a < 0.8 ? x : Math.sign(x) * (0.8 + 0.2 * Math.tanh((a - 0.8) / 0.2));
    }
    const half = ac.createGain();
    half.gain.value = 0.5; // ramène −2…+2 dans l'entrée −1…+1 de la courbe
    const shaper = ac.createWaveShaper();
    shaper.curve = curve;
    shaper.oversample = '2x';
    input.connect(comp).connect(master).connect(half).connect(shaper).connect(ac.destination);
    out = input;
    outputs.set(ac, out);
  }
  return out;
}

// Casques et enceintes Bluetooth : ils se mettent en veille dans le silence et coupent
// le début des sons. Un souffle inaudible (−80 dB) les garde éveillés tant que la page est affichée.
function keepAwake(ac: AudioContext) {
  try {
    const buf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.0001;
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(ac.destination);
    src.start();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void ac.suspend().catch(() => undefined);
      else void ac.resume().catch(() => undefined);
    });
  } catch {
    /* sans gravité */
  }
}

/** Petit « clic » de métronome (bois), plus aigu pour le premier temps. */
export function scheduleClick(ac: AudioContext, time: number, accent: boolean, volume = 0.5, dest: AudioNode = masterOutput(ac)) {
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

/** Note brève (lecture d'un rythme) : piano enregistré s'il est chargé, sinon son synthétisé. */
export function scheduleNote(ac: AudioContext, time: number, duration: number, frequency = 523.25, volume = 0.3, dest: AudioNode = masterOutput(ac)) {
  if (schedulePianoSample(ac, dest, frequency, time, Math.min(duration * 0.9, 1.5), volume * 1.6)) return;
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
