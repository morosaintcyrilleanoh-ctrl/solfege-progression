'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ScoreView } from '@/components/notation/ScoreView';
import { Card, SegmentedControl, buttonClasses } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { playSequence } from '@/lib/audio/synth';
import type { Notation } from '@/lib/exercises/types';
import { type Mode, fifthsOf, isStandardKey, keyName, keySignatureAccidentals, relativeKey } from '@/lib/music/keys';
import { type Accidental, type Letter, FRENCH_NAMES, LETTERS, frequency, formatPitch } from '@/lib/music/pitch';
import { type ScaleType, SCALE_NAMES_FR, ScaleSpellingError, arpeggio, buildScale, degreeName, doubleAccidentals, stepPattern } from '@/lib/music/scales';

const TYPES: ScaleType[] = ['major', 'natural-minor', 'harmonic-minor', 'melodic-minor'];

export function ScaleExplorer() {
  const [letter, setLetter] = useState<Letter>('C');
  const [accidental, setAccidental] = useState<Accidental>(0);
  const [type, setType] = useState<ScaleType>('major');
  const [notation, setNotation] = useState<'fr' | 'intl'>('fr');

  const result = useMemo(() => {
    try {
      const octave = LETTERS.indexOf(letter) >= 4 ? 3 : 4;
      // Toutes les gammes : ascendante puis descendante (la mineure mélodique redescend en mineure naturelle).
      const up = buildScale({ letter, accidental }, type, octave);
      const down = buildScale({ letter, accidental }, type, octave, 'down');
      return { up, down, error: null as string | null };
    } catch (e) {
      return { up: null, down: null, error: e instanceof ScaleSpellingError ? e.message : 'Gamme impossible.' };
    }
  }, [letter, accidental, type]);

  const mode: Mode = type === 'major' ? 'major' : 'minor';
  const key = { tonic: { letter, accidental }, mode };
  const standard = isStandardKey(key);
  const fmt = (p: Parameters<typeof formatPitch>[0]) => formatPitch(p, { notation, octave: false });

  // Arpège de la tonique (degrés 1, 3, 5, 8), en montant puis en descendant.
  const arpUp = result.up ? arpeggio(result.up) : null;
  const arpDown = arpUp ? [...arpUp].reverse() : null;

  // Montée puis descente au piano, sans répéter la note du sommet.
  const [playing, setPlaying] = useState<'scale' | 'arpeggio' | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const play = (what: 'scale' | 'arpeggio') => {
    const up = what === 'scale' ? result.up : arpUp;
    const down = what === 'scale' ? result.down : arpDown;
    if (!up || !down || playing) return;
    const seq = [...up, ...down.slice(1)].map((p) => frequency(p));
    const seconds = playSequence(seq, { step: what === 'scale' ? 0.45 : 0.55, last: 1.6 });
    if (!seconds) return;
    setPlaying(what);
    timer.current = window.setTimeout(() => setPlaying(null), seconds * 1000);
  };
  const listenButton = (what: 'scale' | 'arpeggio', label: string) => (
    <button type="button" onClick={() => play(what)} disabled={playing !== null} aria-busy={playing === what} className={`${buttonClasses('secondary')} mt-3`}>
      <Icon name="sound" className="size-4" /> {playing === what ? 'Lecture en cours…' : label}
    </button>
  );

  const staff = (notes: NonNullable<typeof result.up>): Notation => ({
    kind: 'notes',
    clef: 'treble',
    notes,
    layout: 'melodic',
    forceAccidentals: true,
    labels: notes.map((p) => fmt(p)),
  });

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-4">
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold text-slate-700">Note de départ</legend>
            <div className="grid grid-cols-7 gap-1.5">
              {LETTERS.map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={letter === l}
                  onClick={() => setLetter(l)}
                  className={`min-h-11 rounded-xl border text-sm font-bold ${letter === l ? 'border-electric-500 bg-electric-500/10 text-electric-700' : 'border-slate-200 bg-white'}`}
                >
                  {notation === 'fr' ? FRENCH_NAMES[l] : l}
                </button>
              ))}
            </div>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {([-1, 0, 1] as Accidental[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={accidental === a}
                  onClick={() => setAccidental(a)}
                  className={`min-h-11 rounded-xl border text-sm font-semibold ${accidental === a ? 'border-accent-500 bg-accent-600 text-white' : 'border-slate-200 bg-white'}`}
                >
                  {a === -1 ? '♭ bémol' : a === 1 ? '♯ dièse' : '♮ naturel'}
                </button>
              ))}
            </div>
          </fieldset>
          <SegmentedControl
            legend="Type de gamme"
            columns={2}
            options={TYPES.map((t) => ({ value: t, label: SCALE_NAMES_FR[t].replace(/^./, (c) => c.toUpperCase()) }))}
            value={type}
            onChange={setType}
          />
          <SegmentedControl
            legend="Noms"
            options={[
              { value: 'fr', label: 'Do Ré Mi' },
              { value: 'intl', label: 'C D E' },
            ]}
            value={notation}
            onChange={setNotation}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-night-800">
          Gamme de {fmt({ letter, accidental, octave: 4 })} {SCALE_NAMES_FR[type]}
        </h2>
        {result.error ? (
          <p className="mt-2 text-sm text-danger-700" role="alert">{result.error}</p>
        ) : (
          <>
            {result.up && result.down && (
              <>
                <h3 className="mt-3 text-sm font-bold text-slate-700">↗ Gamme ascendante</h3>
                <ScoreView notation={staff(result.up)} label="Gamme ascendante sur la portée" className="mt-1" />
                <h3 className="mt-3 text-sm font-bold text-slate-700">↘ Gamme descendante</h3>
                <ScoreView notation={staff(result.down)} label="Gamme descendante sur la portée" className="mt-1" />
                {listenButton('scale', 'Écouter la gamme (montée et descente)')}
              </>
            )}
            {arpUp && arpDown && (
              <section className="mt-5 border-t border-slate-100 pt-4" aria-labelledby="arpege-titre">
                <h2 id="arpege-titre" className="text-lg font-bold text-night-800">
                  Arpège de {fmt({ letter, accidental, octave: 4 })} {mode === 'major' ? 'majeur' : 'mineur'}
                </h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  Les degrés I, III, V et VIII de la gamme : {arpUp.map((p) => fmt(p)).join(' – ')}.
                </p>
                <h3 className="mt-3 text-sm font-bold text-slate-700">↗ Arpège ascendant</h3>
                <ScoreView notation={staff(arpUp)} sizeAs={result.up ? staff(result.up) : undefined} label="Arpège ascendant sur la portée" className="mt-1" />
                <h3 className="mt-3 text-sm font-bold text-slate-700">↘ Arpège descendant</h3>
                <ScoreView notation={staff(arpDown)} sizeAs={result.up ? staff(result.up) : undefined} label="Arpège descendant sur la portée" className="mt-1" />
                {listenButton('arpeggio', 'Écouter l’arpège (montée et descente)')}
              </section>
            )}
            <ol className="mt-3 flex flex-wrap gap-1.5" aria-label="Écarts entre les degrés">
              {stepPattern(type).map((s, i) => (
                <li key={i} className={`rounded-full px-2.5 py-1 text-xs font-bold ${s === '½' ? 'bg-accent-600/10 text-accent-700' : s === 'T' ? 'bg-electric-500/10 text-electric-700' : 'bg-amber-100 text-amber-800'}`}>
                  {i + 1}→{i + 2} : {s === '½' ? '½ ton' : s === 'T' ? '1 ton' : '1 ton ½'}
                </li>
              ))}
            </ol>
            <table className="mt-3 w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {result.up?.slice(0, 7).map((p, i) => (
                  <tr key={i}>
                    <td className="py-1.5 pr-2 font-semibold text-slate-500">{['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][i]}</td>
                    <td className="py-1.5 pr-2 font-bold text-ink">{fmt(p)}</td>
                    <td className="py-1.5 text-slate-600">{degreeName(result.up ?? [], i + 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {type === 'melodic-minor' && result.down && (
              <p className="mt-3 text-sm text-slate-700">
                En descendant, la gamme mineure mélodique reprend la forme naturelle : {result.down.map((p) => fmt(p)).join(' – ')}.
              </p>
            )}
            <div className="mt-3 rounded-xl bg-mist p-3 text-sm text-slate-700">
              {standard ? (
                <>
                  <p>
                    <strong>Armure de {keyName(key, notation)} :</strong>{' '}
                    {keySignatureAccidentals(fifthsOf(key)).map((a) => fmt({ ...a, octave: 4 })).join(', ') || 'aucune altération'}.
                  </p>
                  <p>
                    Relatif {mode === 'major' ? 'mineur' : 'majeur'} : {keyName(relativeKey(key), notation)}.
                    {type === 'harmonic-minor' && ' La sensible élevée s’écrit comme altération accidentelle, pas à l’armure.'}
                    {type === 'melodic-minor' && ' Les 6e et 7e degrés élevés s’écrivent comme altérations accidentelles.'}
                  </p>
                </>
              ) : (
                <p>
                  Tonalité théorique : son armure aurait plus de 7 altérations
                  {result.up && doubleAccidentals(result.up) > 0 ? ' et la gamme contient des doubles altérations' : ''}. On utilise en pratique la tonalité enharmonique.
                </p>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
