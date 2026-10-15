'use client';

/**
 * Affichage générique de notation musicale avec VexFlow :
 * cellules rythmiques, suites de notes (gammes, intervalles, accords) et armures.
 */
import { useEffect, useRef, useState } from 'react';
import type { Notation } from '@/lib/exercises/types';
import { accidentalToDraw, fifthsOf } from '@/lib/music/keys';
import type { Pitch } from '@/lib/music/pitch';
import { staffStep } from '@/lib/music/staff';
import { type RhythmEvent, VEXFLOW_DURATION, pulse } from '@/lib/rhythm';
import { type VexFlowModule, loadVexFlow, makeResponsive, zoomFor } from './vexflow-loader';

const ACC_CODE: Record<number, string> = { [-2]: 'bb', [-1]: 'b', 0: 'n', 1: '#', 2: '##' };
const SPACING = 10;

function vfKey(p: Pitch): string {
  return `${p.letter.toLowerCase()}/${p.octave}`;
}

type Ctx = ReturnType<InstanceType<VexFlowModule['Renderer']>['getContext']>;

/** Dessine une ligne de mesures rythmiques ; renvoie la hauteur utilisée. */
function drawRhythm(VF: VexFlowModule, ctx: Ctx, notation: Extract<Notation, { kind: 'rhythm' }>, width: number): number {
  const ts = notation.timeSignature;
  const beat = pulse(ts).beatDuration;
  const rowHeight = 90;
  const top = notation.labels ? 34 : 18;

  // Largeur souhaitée de chaque mesure selon son nombre de figures.
  const desired = notation.measures.map((m, i) => 50 + m.length * 30 + (i === 0 ? 50 : 0) + (notation.missingEnd && i === notation.measures.length - 1 ? 40 : 0));
  const rows: number[][] = [];
  let current: number[] = [];
  let used = 0;
  desired.forEach((w, i) => {
    if (current.length && used + w > width - 12) {
      rows.push(current);
      current = [];
      used = 0;
    }
    current.push(i);
    used += w;
  });
  if (current.length) rows.push(current);

  rows.forEach((row, r) => {
    const total = row.reduce((s, i) => s + (desired[i] as number), 0);
    const scale = (width - 12) / total;
    let x = 6;
    row.forEach((i) => {
      const events = notation.measures[i] as RhythmEvent[];
      const w = (desired[i] as number) * scale;
      const stave = new VF.Stave(x, top + r * rowHeight, w, { spaceAboveStaffLn: 0 });
      if (i === 0 || row[0] === i) stave.addClef('percussion');
      if (i === 0) stave.addTimeSignature(`${ts.beats}/${ts.unit}`);
      stave.setContext(ctx).draw();

      const notes = events.map((e) => {
        const n = new VF.StaveNote({
          keys: ['b/4'],
          duration: VEXFLOW_DURATION[e.value] + (e.rest ? 'r' : ''),
          clef: 'percussion',
          stemDirection: 1,
        });
        if (e.dots) VF.Dot.buildAndAttach([n], { all: true });
        if (e.dots === 2) VF.Dot.buildAndAttach([n], { all: true });
        return n;
      });

      // N-olets : figures consécutives d'un même groupe.
      const tuplets: InstanceType<VexFlowModule['Tuplet']>[] = [];
      let start = 0;
      while (start < events.length) {
        const t = events[start]?.tuplet;
        if (!t) {
          start++;
          continue;
        }
        let end = start;
        while (events[end + 1]?.tuplet?.group === t.group) end++;
        tuplets.push(new VF.Tuplet(notes.slice(start, end + 1), { numNotes: t.actual, notesOccupied: t.normal, bracketed: true }));
        start = end + 1;
      }

      const voice = new VF.Voice({ numBeats: ts.beats, beatValue: ts.unit }).setMode(VF.Voice.Mode.SOFT);
      voice.addTickables(notes);
      const beamGroup = new VF.Fraction(beat.n, beat.d);
      const beams = VF.Beam.generateBeams(notes, { groups: [beamGroup] });
      const reserve = notation.missingEnd && i === notation.measures.length - 1 ? 40 : 0;
      new VF.Formatter().joinVoices([voice]).format([voice], Math.max(40, stave.getNoteEndX() - stave.getNoteStartX() - 14 - reserve));
      voice.draw(ctx, stave);
      beams.forEach((b) => b.setContext(ctx).draw());
      tuplets.forEach((t) => t.setContext(ctx).draw());
      events.forEach((e, k) => {
        if (e.tie && notes[k + 1]) {
          new VF.StaveTie({ firstNote: notes[k], lastNote: notes[k + 1], firstIndexes: [0], lastIndexes: [0] }).setContext(ctx).draw();
        }
      });

      if (reserve) {
        ctx.save();
        ctx.setFont('Inter, sans-serif', 22, 'bold');
        ctx.setFillStyle('#7c3aed');
        ctx.fillText('?', stave.getNoteEndX() - 30, stave.getYForLine(2) + 8);
        ctx.restore();
      }
      if (notation.labels?.[i]) {
        ctx.save();
        ctx.setFont('Inter, sans-serif', 13, 'bold');
        ctx.setFillStyle('#1c2760');
        ctx.fillText(notation.labels[i] as string, x + w / 2 - 4, top + r * rowHeight - 10);
        ctx.restore();
      }
      x += w;
    });
  });
  return top + rows.length * rowHeight - 20;
}

function drawNotes(VF: VexFlowModule, ctx: Ctx, notation: Extract<Notation, { kind: 'notes' | 'keySignature' }>, width: number): number {
  const notes = notation.kind === 'notes' ? notation.notes : [];
  const steps = notes.map((p) => staffStep(p, notation.clef));
  const maxStep = Math.max(8, ...steps);
  const minStep = Math.min(0, ...steps);
  const hasLabels = notation.kind === 'notes' && !!notation.labels?.length;
  const top = Math.max(26, ((maxStep - 8) * SPACING) / 2 + 16);
  const bottom = Math.max(26, (-minStep * SPACING) / 2 + 16) + (hasLabels ? 22 : 0);

  const stave = new VF.Stave(6, top, width - 12, { spaceAboveStaffLn: 0, spacingBetweenLinesPx: SPACING });
  stave.addClef(notation.clef);
  let fifths: number | null = null;
  if (notation.keySignature) {
    stave.addKeySignature(notation.keySignature);
    fifths = keySpecToFifths(notation.keySignature);
  }
  stave.setContext(ctx).draw();
  if (notation.kind === 'keySignature' || notes.length === 0) return top + 4 * SPACING + bottom;

  const drawAcc = (p: Pitch) => (notation.forceAccidentals ? (p.accidental === 0 ? null : p.accidental) : accidentalToDraw(p, fifths));

  let tickables: InstanceType<VexFlowModule['StaveNote']>[];
  if (notation.layout === 'harmonic') {
    const sorted = [...notes].sort((a, b) => staffStep(a, notation.clef) - staffStep(b, notation.clef));
    const chord = new VF.StaveNote({ keys: sorted.map(vfKey), duration: 'w', clef: notation.clef });
    sorted.forEach((p, i) => {
      const acc = drawAcc(p);
      if (acc != null) chord.addModifier(new VF.Accidental(ACC_CODE[acc] as string), i);
    });
    if (notation.labels?.[0]) chord.addModifier(labelAnnotation(VF, notation.labels[0]), 0);
    tickables = [chord];
  } else {
    tickables = notes.map((p, i) => {
      const n = new VF.StaveNote({ keys: [vfKey(p)], duration: 'w', clef: notation.clef });
      const acc = drawAcc(p);
      if (acc != null) n.addModifier(new VF.Accidental(ACC_CODE[acc] as string), 0);
      const label = notation.labels?.[i];
      if (label) n.addModifier(labelAnnotation(VF, label), 0);
      return n;
    });
  }
  const voice = new VF.Voice({ numBeats: tickables.length * 4, beatValue: 4 }).setMode(VF.Voice.Mode.SOFT);
  voice.addTickables(tickables);
  new VF.Formatter().joinVoices([voice]).format([voice], Math.max(60, stave.getNoteEndX() - stave.getNoteStartX() - 20));
  voice.draw(ctx, stave);
  return top + 4 * SPACING + bottom;
}

function labelAnnotation(VF: VexFlowModule, text: string) {
  const a = new VF.Annotation(text);
  a.setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM);
  a.setFont('Inter, sans-serif', 10, 'normal');
  return a;
}

/** « D » → 2, « Bb » → -2 (armures majeures VexFlow). */
function keySpecToFifths(spec: string): number {
  const m = /^([A-G])(#|b)?$/.exec(spec);
  if (!m) return 0;
  return fifthsOf({ tonic: { letter: m[1] as Pitch['letter'], accidental: m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0 }, mode: 'major' });
}

type RenderState = { kind: 'loading' } | { kind: 'ready' } | { kind: 'error' };

export function ScoreView({ notation, label, className = '' }: { notation: Notation; label: string; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RenderState>({ kind: 'loading' });
  const [width, setWidth] = useState(0);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0]?.contentRect.width ?? 0);
      setWidth((prev) => (Math.abs(prev - w) > 4 ? w : prev));
    });
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || width === 0 || notation.kind === 'glyphs') return;
    let cancelled = false;
    loadVexFlow()
      .then((VF) => {
        if (cancelled) return;
        host.replaceChildren();
        const zoom = zoomFor(width) * (notation.kind === 'rhythm' ? 0.85 : 1);
        const logicalWidth = Math.max(200, width / zoom);
        const renderer = new VF.Renderer(host, VF.Renderer.Backends.SVG);
        // Hauteur provisoire, ajustée après le dessin.
        renderer.resize(logicalWidth, 600);
        const ctx = renderer.getContext();
        const height = notation.kind === 'rhythm' ? drawRhythm(VF, ctx, notation, logicalWidth) : drawNotes(VF, ctx, notation, logicalWidth);
        renderer.resize(logicalWidth, height);
        makeResponsive(host, logicalWidth, height);
        setState({ kind: 'ready' });
      })
      .catch((e: unknown) => {
        console.error(e);
        if (!cancelled) setState({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [notation, width, retry]);

  if (notation.kind === 'glyphs') {
    return (
      <div className={`flex items-center justify-center gap-4 py-4 ${className}`} role="img" aria-label={label}>
        {notation.glyphs.map((g, i) => (
          <span key={i} className="text-5xl leading-[1.6] text-ink" style={{ fontFamily: 'Bravura, serif' }}>
            {g}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} role="img" aria-label={label}>
      <div ref={hostRef} data-testid="score" className="w-full" />
      {state.kind === 'loading' && (
        <div className="flex h-32 items-center justify-center text-sm text-slate-500" aria-live="polite">
          <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-slate-300 border-t-electric-500" />
          Chargement de la partition…
        </div>
      )}
      {state.kind === 'error' && (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-danger-700" role="alert">
          La partition n’a pas pu être affichée.
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-700"
            onClick={() => {
              setState({ kind: 'loading' });
              setRetry((r) => r + 1);
            }}
          >
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
}
