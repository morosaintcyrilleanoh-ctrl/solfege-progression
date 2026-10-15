/**
 * Petit synthétiseur Web Audio, sans fichier son à télécharger (connexion limitée).
 * Toutes les fonctions échouent silencieusement si l'audio n'est pas disponible :
 * l'application reste utilisable sans son.
 */
import { getAudioContext } from './context';

export function isAudioSupported(): boolean {
  return typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);
}

/** Joue une note (fréquence en Hz) avec une enveloppe douce, proche d'un piano électrique. */
export function playTone(frequency: number, durationSec = 0.9, volume = 0.25): boolean {
  const ac = getAudioContext();
  if (!ac) return false;
  try {
    const t = ac.currentTime;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + durationSec);
    gain.connect(ac.destination);

    for (const [mult, level, type] of [
      [1, 1, 'triangle'],
      [2, 0.25, 'sine'],
    ] as const) {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency * mult, t);
      g.gain.value = level;
      osc.connect(g).connect(gain);
      osc.start(t);
      osc.stop(t + durationSec + 0.05);
    }
    return true;
  } catch {
    return false;
  }
}
