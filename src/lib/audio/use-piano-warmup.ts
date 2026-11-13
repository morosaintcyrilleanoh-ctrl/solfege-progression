import { useEffect } from 'react';
import { preloadPiano } from './synth';

/** Au premier appui sur la page (geste de l'utilisateur), prépare l'audio et charge le piano. */
export function usePianoWarmup(): void {
  useEffect(() => {
    const warm = () => preloadPiano();
    window.addEventListener('pointerdown', warm, { once: true, capture: true });
    return () => window.removeEventListener('pointerdown', warm, { capture: true });
  }, []);
}
