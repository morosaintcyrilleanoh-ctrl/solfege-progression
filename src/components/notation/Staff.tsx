'use client';

/**
 * Portée musicale rendue par VexFlow (SVG).
 *
 * VexFlow et la police Bravura ne sont chargés que sur les pages qui en ont
 * besoin. Après le rendu, la position verticale de la tête de note est
 * comparée à celle calculée par lib/music/staff.ts : en cas d'écart, la note
 * n'est pas montrée (on ne pose jamais une question sur une note mal placée).
 */
import { useEffect, useRef, useState } from 'react';
import type { Pitch } from '@/lib/music/pitch';
import { type Clef, staffStep } from '@/lib/music/staff';

type VexFlowModule = typeof import('vexflow/core');

let loader: Promise<VexFlowModule> | null = null;

function loadVexFlow(): Promise<VexFlowModule> {
  loader ??= (async () => {
    const [mod] = await Promise.all([
      import('vexflow/core'),
      // La police doit être prête avant de mesurer et dessiner les symboles.
      document.fonts?.load('40px Bravura') ?? Promise.resolve(),
    ]);
    if (!document.fonts?.check('40px Bravura')) throw new Error('Police musicale indisponible');
    mod.VexFlow.setFonts('Bravura');
    return mod;
  })().catch((e: unknown) => {
    loader = null; // Permet de réessayer (connexion instable).
    throw e;
  });
  return loader;
}

export type StaffStatus = 'neutral' | 'correct' | 'wrong';

const COLORS: Record<StaffStatus, string> = {
  neutral: '#0f172a',
  correct: '#16a34a',
  wrong: '#dc2626',
};

const ACCIDENTAL_CODES: Record<number, string> = { [-2]: 'bb', [-1]: 'b', 1: '#', 2: '##' };

/** Clé VexFlow, ex. « f#/4 ». */
export function vexflowKey(pitch: Pitch): string {
  return `${pitch.letter.toLowerCase()}${ACCIDENTAL_CODES[pitch.accidental] ?? ''}/${pitch.octave}`;
}

/** Marge minimale au-dessus et en dessous de la portée (place pour la clé de sol). */
const MIN_MARGIN = 22;
const SPACING = 10;

interface StaffProps {
  clef: Clef;
  pitch: Pitch | null;
  status?: StaffStatus;
  /** Description accessible (ne doit pas révéler la réponse). */
  label: string;
  /** Étendue des notes possibles (en « steps ») : la hauteur du dessin s'y adapte. */
  range?: { minStep: number; maxStep: number };
  className?: string;
}

type RenderState = { kind: 'loading' } | { kind: 'ready' } | { kind: 'error'; message: string };

export function Staff({ clef, pitch, status = 'neutral', label, range, className = '' }: StaffProps) {
  const minStep = range?.minStep ?? -6;
  const maxStep = range?.maxStep ?? 14;
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RenderState>({ kind: 'loading' });
  const [retry, setRetry] = useState(0);
  const [width, setWidth] = useState(0);

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
    if (!host || width === 0) return;
    let cancelled = false;

    loadVexFlow()
      .then((VF) => {
        if (cancelled) return;
        host.replaceChildren();
        // Plus l'écran est petit, plus on agrandit la portée pour qu'elle reste lisible.
        const zoom = width < 420 ? 1.8 : width < 700 ? 1.9 : 2;
        const logicalWidth = Math.max(180, width / zoom);
        // Hauteur juste suffisante pour les lignes supplémentaires du niveau choisi.
        const top = Math.max(MIN_MARGIN, ((maxStep - 8) * SPACING) / 2 + 12);
        const bottom = Math.max(MIN_MARGIN, (-minStep * SPACING) / 2 + 12);
        const logicalHeight = top + 4 * SPACING + bottom;

        const renderer = new VF.Renderer(host, VF.Renderer.Backends.SVG);
        renderer.resize(logicalWidth, logicalHeight);
        const ctx = renderer.getContext();

        const stave = new VF.Stave(6, top, logicalWidth - 12, { spaceAboveStaffLn: 0, spacingBetweenLinesPx: SPACING });
        stave.addClef(clef).setContext(ctx).draw();

        if (pitch) {
          const color = COLORS[status];
          const note = new VF.StaveNote({ keys: [vexflowKey(pitch)], duration: 'w', clef });
          if (pitch.accidental !== 0) {
            note.addModifier(new VF.Accidental(ACCIDENTAL_CODES[pitch.accidental] as string), 0);
          }
          note.setStyle({ fillStyle: color, strokeStyle: color });
          note.setLedgerLineStyle({ fillStyle: color, strokeStyle: color, lineWidth: 1.4 });

          const tick = new VF.TickContext();
          const modifiers = new VF.ModifierContext();
          note.addToModifierContext(modifiers);
          tick.addTickable(note).preFormat();
          const available = stave.getNoteEndX() - stave.getNoteStartX();
          tick.setX(Math.max(24, available / 2 - 10));
          note.setStave(stave).setContext(ctx).draw();

          // Vérification : la tête de note est-elle exactement à la position attendue ?
          const step = staffStep(pitch, clef);
          const expectedY = stave.getYForLine(4) - (step * stave.getSpacingBetweenLines()) / 2;
          const actualY = note.getYs()[0] ?? Number.NaN;
          const ok = Math.abs(actualY - expectedY) < 0.01;
          host.dataset.positionCheck = ok ? 'ok' : 'mismatch';
          host.dataset.step = String(step);
          if (!ok) {
            host.replaceChildren();
            setState({ kind: 'error', message: 'La note n’a pas pu être placée correctement. Passe à la question suivante.' });
            return;
          }
        } else {
          delete host.dataset.positionCheck;
          delete host.dataset.step;
        }

        const svg = host.querySelector('svg');
        if (svg) {
          svg.setAttribute('viewBox', `0 0 ${logicalWidth} ${logicalHeight}`);
          svg.setAttribute('width', '100%');
          svg.removeAttribute('height');
          svg.setAttribute('aria-hidden', 'true');
          // VexFlow fixe une taille en pixels : on la remplace pour que la portée suive son conteneur.
          svg.style.width = '100%';
          svg.style.height = 'auto';
          svg.style.display = 'block';
        }
        setState({ kind: 'ready' });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'error', message: 'La portée n’a pas pu être chargée. Vérifie ta connexion.' });
      });

    return () => {
      cancelled = true;
    };
  }, [clef, pitch, status, width, retry, minStep, maxStep]);

  return (
    <div className={`relative ${className}`} role="img" aria-label={label}>
      <div ref={hostRef} data-testid="staff" className="w-full" />
      {state.kind === 'loading' && (
        <div className="flex h-36 items-center justify-center text-sm text-slate-500" aria-live="polite">
          <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-slate-300 border-t-electric-500" />
          Chargement de la portée…
        </div>
      )}
      {state.kind === 'error' && (
        <div className="flex h-36 flex-col items-center justify-center gap-2 text-center text-sm text-danger-700" role="alert">
          {state.message}
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
