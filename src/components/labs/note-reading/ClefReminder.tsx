import { FRENCH_NAMES, type NameNotation } from '@/lib/music/pitch';
import { type Clef, CLEFS, pitchAtStep } from '@/lib/music/staff';

/** Repères de lecture : notes des lignes et des interlignes, calculées depuis la logique de la portée. */
export function ClefReminder({ clefs, notation }: { clefs: Clef[]; notation: NameNotation }) {
  const name = (clef: Clef, step: number) => {
    const p = pitchAtStep(step, clef);
    return notation === 'fr' ? FRENCH_NAMES[p.letter] : p.letter;
  };
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
      <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between font-semibold text-slate-800">
        Repères de lecture
        <span className="text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
      </summary>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {clefs.map((clef) => {
          const def = CLEFS[clef];
          return (
            <div key={clef}>
              <p className="font-semibold text-night-800">{def.label}</p>
              <p className="mt-1 text-slate-600">
                La clé indique la note de la {def.referenceLine.line}
                <sup>e</sup> ligne : <strong>{name(clef, (def.referenceLine.line - 1) * 2)}</strong>.
              </p>
              <p className="mt-1 text-slate-600">
                Lignes (de bas en haut) : <strong>{[0, 2, 4, 6, 8].map((s) => name(clef, s)).join(' – ')}</strong>
              </p>
              <p className="text-slate-600">
                Interlignes : <strong>{[1, 3, 5, 7].map((s) => name(clef, s)).join(' – ')}</strong>
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Le do central (Do 3 en notation française, C4 en notation internationale) se trouve sur la 1re ligne
        supplémentaire en dessous de la clé de sol, et au-dessus de la clé de fa.
      </p>
    </details>
  );
}
