/**
 * Analyse d'un exercice de pulsation : l'élève frappe sur chaque temps.
 * On associe chaque temps à la frappe la plus proche (fenêtre de ± la moitié
 * d'un temps) et on mesure l'écart. C'est une mesure indicative : le délai
 * de l'écran tactile et du son de l'appareil s'y ajoute.
 */
export interface PulseAnalysis {
  /** Écart de chaque temps (ms, négatif = en avance), null si pas de frappe. */
  offsets: (number | null)[];
  missed: number;
  /** Frappes qui ne correspondent à aucun temps. */
  extra: number;
  /** Écart absolu moyen (ms) sur les temps frappés. */
  meanAbsMs: number | null;
  /** Tendance moyenne (ms) : négative = en avance, positive = en retard. */
  meanSignedMs: number | null;
  /** Nombre de frappes à moins de `toleranceMs` du temps. */
  onTime: number;
}

export function analyzeTaps(beatsMs: number[], tapsMs: number[], toleranceMs = 80): PulseAnalysis {
  if (beatsMs.length === 0) return { offsets: [], missed: 0, extra: tapsMs.length, meanAbsMs: null, meanSignedMs: null, onTime: 0 };
  const interval = beatsMs.length > 1 ? (beatsMs[1] as number) - (beatsMs[0] as number) : 1000;
  const window = interval / 2;
  const used = new Set<number>();
  const offsets = beatsMs.map((b): number | null => {
    let bestIdx = -1;
    for (let i = 0; i < tapsMs.length; i++) {
      if (used.has(i)) continue;
      const d = (tapsMs[i] as number) - b;
      if (Math.abs(d) <= window && (bestIdx < 0 || Math.abs(d) < Math.abs((tapsMs[bestIdx] as number) - b))) bestIdx = i;
    }
    if (bestIdx < 0) return null;
    used.add(bestIdx);
    return (tapsMs[bestIdx] as number) - b;
  });
  const hits = offsets.filter((o): o is number => o != null);
  return {
    offsets,
    missed: offsets.length - hits.length,
    extra: tapsMs.length - used.size,
    meanAbsMs: hits.length ? Math.round(hits.reduce((s, o) => s + Math.abs(o), 0) / hits.length) : null,
    meanSignedMs: hits.length ? Math.round(hits.reduce((s, o) => s + o, 0) / hits.length) : null,
    onTime: hits.filter((o) => Math.abs(o) <= toleranceMs).length,
  };
}
