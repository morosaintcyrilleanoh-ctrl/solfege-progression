/**
 * Petit synthétiseur Web Audio, sans fichier son à télécharger (connexion limitée).
 * Toutes les fonctions échouent silencieusement si l'audio n'est pas disponible :
 * l'application reste utilisable sans son.
 */
import { getAudioContext } from './context';

export function isAudioSupported(): boolean {
  return typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);
}

// ---------------------------------------------------------------------------
// Piano synthétisé : harmoniques légèrement inharmoniques (comme une corde),
// attaque de marteau, extinction naturelle (plus rapide dans l'aigu), timbre qui
// s'adoucit après l'attaque. Un compresseur commun rend le son fort et clair
// sans saturer quand les notes se chevauchent.
// ---------------------------------------------------------------------------
const outputs = new WeakMap<BaseAudioContext, AudioNode>();

function pianoOutput(ac: AudioContext): AudioNode {
  let out = outputs.get(ac);
  if (!out) {
    // Entrée amplifiée → compresseur-limiteur → sortie : fort, sans saturation
    const input = ac.createGain();
    input.gain.value = 1.8;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 6;
    comp.ratio.value = 12;
    comp.attack.value = 0.002;
    comp.release.value = 0.2;
    const master = ac.createGain();
    master.gain.value = 1.05; // le compresseur du navigateur ajoute déjà un gain automatique
    input.connect(comp).connect(master).connect(ac.destination);
    out = input;
    outputs.set(ac, out);
  }
  return out;
}

let noiseBuffer: AudioBuffer | null = null;
function hammerNoise(ac: AudioContext): AudioBuffer {
  if (!noiseBuffer || noiseBuffer.sampleRate !== ac.sampleRate) {
    noiseBuffer = ac.createBuffer(1, Math.round(ac.sampleRate * 0.03), ac.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  return noiseBuffer;
}

/** Programme une note de piano à l'instant `when` (horloge audio). `duration` : touche enfoncée. */
function schedulePiano(ac: AudioContext, frequency: number, when: number, duration: number, volume: number) {
  const out = pianoOutput(ac);
  // Plus la note est aiguë, plus elle s'éteint vite (comme un vrai piano)
  const sustain = Math.min(3.2, Math.max(0.8, 2.2 * Math.pow(261.63 / frequency, 0.45)));
  const release = when + duration;

  const note = ac.createGain();
  note.gain.setValueAtTime(1, when);
  note.gain.setValueAtTime(1, release);
  note.gain.exponentialRampToValueAtTime(0.0001, release + 0.28); // étouffoir
  const tone = ac.createBiquadFilter();
  tone.type = 'lowpass';
  tone.Q.value = 0.7;
  tone.frequency.setValueAtTime(Math.min(14000, frequency * 10), when);
  tone.frequency.exponentialRampToValueAtTime(Math.min(9000, frequency * 4), when + 0.35);
  tone.connect(note).connect(out);

  const partials = [1, 0.55, 0.32, 0.2, 0.12, 0.08, 0.05];
  const B = 0.00035; // inharmonicité
  partials.forEach((level, i) => {
    const n = i + 1;
    const f = frequency * n * Math.sqrt(1 + B * n * n);
    if (f > 16000) return;
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, when);
    const g = ac.createGain();
    const peak = volume * level * (i === 0 ? 1 : 0.9);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(peak, when + 0.004);
    g.gain.exponentialRampToValueAtTime(peak * 0.55, when + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, when + sustain / (1 + 0.45 * i));
    osc.connect(g).connect(tone);
    osc.start(when);
    osc.stop(Math.min(when + sustain + 0.1, release + 0.35));
  });

  // Attaque du marteau : bref bruit filtré autour de la note
  const noise = ac.createBufferSource();
  noise.buffer = hammerNoise(ac);
  const band = ac.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = Math.min(6000, frequency * 6);
  band.Q.value = 1.2;
  const ng = ac.createGain();
  ng.gain.value = volume * 0.18;
  noise.connect(band).connect(ng).connect(out);
  noise.start(when);
}

/** Joue une note de piano (fréquence en Hz), bien audible. */
export function playTone(frequency: number, durationSec = 1.2, volume = 0.5): boolean {
  const ac = getAudioContext();
  if (!ac) return false;
  try {
    schedulePiano(ac, frequency, ac.currentTime + 0.01, durationSec, volume);
    return true;
  } catch {
    return false;
  }
}

/**
 * Joue une suite de notes au piano, en rythme (horloge audio, pas de décalage).
 * Renvoie la durée totale en secondes (0 si l'audio est indisponible).
 */
export function playSequence(frequencies: number[], { step = 0.45, last = 1.6, volume = 0.5 } = {}): number {
  const ac = getAudioContext();
  if (!ac || !frequencies.length) return 0;
  try {
    const start = ac.currentTime + 0.05;
    frequencies.forEach((f, i) => {
      const isLast = i === frequencies.length - 1;
      schedulePiano(ac, f, start + i * step, isLast ? last : step * 0.95, volume);
    });
    return (frequencies.length - 1) * step + last;
  } catch {
    return 0;
  }
}
