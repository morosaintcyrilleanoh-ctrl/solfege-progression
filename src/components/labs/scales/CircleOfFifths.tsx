'use client';

import { useState } from 'react';
import { ScoreView } from '@/components/notation/ScoreView';
import { Card } from '@/components/ui/primitives';
import { keyFromFifths, keyName, keySignatureAccidentals, vexflowKeySpec } from '@/lib/music/keys';
import { formatPitch } from '@/lib/music/pitch';

/** Position k (0 = haut, sens horaire) -> armure(s). En bas du cercle, deux tonalités enharmoniques. */
const POSITIONS: number[][] = [[0], [1], [2], [3], [4], [5, -7], [6, -6], [7, -5], [-4], [-3], [-2], [-1]];

function short(fifths: number, mode: 'major' | 'minor') {
  const k = keyFromFifths(fifths, mode);
  const n = formatPitch({ ...k.tonic, octave: 4 }, { octave: false });
  return mode === 'major' ? n : `${n}m`;
}

export function CircleOfFifths() {
  const [selected, setSelected] = useState(0);
  const size = 320;
  const c = size / 2;
  const major = keyFromFifths(selected, 'major');
  const minor = keyFromFifths(selected, 'minor');
  const accidentals = keySignatureAccidentals(selected).map((a) => formatPitch({ ...a, octave: 4 }, { octave: false }));

  return (
    <div className="space-y-4">
      <Card>
        <p className="mb-2 text-sm text-slate-600">
          Dans le sens des aiguilles d’une montre, chaque tonalité est une quinte plus haut et prend un dièse de plus. Dans l’autre sens, un
          bémol de plus. Touche une tonalité.
        </p>
        <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-sm" role="group" aria-label="Cycle des quintes">
          <circle cx={c} cy={c} r={150} fill="#0b1230" />
          <circle cx={c} cy={c} r={92} fill="#121b45" />
          <circle cx={c} cy={c} r={52} fill="#0b1230" />
          {POSITIONS.map((fifthsList, k) => {
            const angle = (k / 12) * 2 * Math.PI - Math.PI / 2;
            const xo = c + Math.cos(angle) * 122;
            const yo = c + Math.sin(angle) * 122;
            const xi = c + Math.cos(angle) * 72;
            const yi = c + Math.sin(angle) * 72;
            const active = fifthsList.includes(selected);
            return (
              <g
                key={k}
                role="button"
                tabIndex={0}
                aria-label={fifthsList.map((f) => keyName(keyFromFifths(f, 'major'))).join(' ou ')}
                aria-pressed={active}
                onClick={() => setSelected(fifthsList[0] as number)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelected(fifthsList[0] as number)}
                className="cursor-pointer focus:outline-none"
              >
                <circle cx={xo} cy={yo} r={24} fill={active ? '#7c3aed' : 'transparent'} />
                <text x={xo} y={yo + (fifthsList.length > 1 ? -2 : 5)} textAnchor="middle" fontSize={fifthsList.length > 1 ? 11 : 15} fontWeight={700} fill="white">
                  {short(fifthsList[0] as number, 'major')}
                </text>
                {fifthsList.length > 1 && (
                  <text x={xo} y={yo + 11} textAnchor="middle" fontSize={10} fill="#c4b5fd">
                    {short(fifthsList[1] as number, 'major')}
                  </text>
                )}
                <text x={xi} y={yi + 4} textAnchor="middle" fontSize={11} fill={active ? '#93c5fd' : '#cbd5e1'}>
                  {short(fifthsList[0] as number, 'minor')}
                </text>
              </g>
            );
          })}
          <text x={c} y={c + 4} textAnchor="middle" fontSize={11} fill="#c4b5fd">
            quintes
          </text>
        </svg>
        {(POSITIONS.find((p) => p.includes(selected))?.length ?? 0) > 1 && (
          <div className="mt-2 flex justify-center gap-2 text-sm">
            {POSITIONS.find((p) => p.includes(selected))
              ?.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSelected(f)}
                  className={`rounded-lg border px-3 py-1.5 font-semibold ${f === selected ? 'border-accent-500 bg-accent-600 text-white' : 'border-slate-300'}`}
                >
                  {keyName(keyFromFifths(f, 'major'))}
                </button>
              ))}
          </div>
        )}
      </Card>
      <Card>
        <h2 className="text-lg font-bold text-night-800">
          {keyName(major)} · {keyName(minor)}
        </h2>
        <ScoreView notation={{ kind: 'keySignature', clef: 'treble', keySignature: vexflowKeySpec(selected) }} label={`Armure de ${keyName(major)}`} />
        <p className="text-sm text-slate-700">
          {accidentals.length ? `${accidentals.length} ${selected > 0 ? 'dièse' : 'bémol'}${accidentals.length > 1 ? 's' : ''} : ${accidentals.join(', ')}.` : 'Aucune altération à l’armure.'}{' '}
          {keyName(minor)} est le relatif mineur de {keyName(major)} : même armure.
        </p>
      </Card>
    </div>
  );
}
