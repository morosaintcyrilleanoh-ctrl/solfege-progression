'use client';

/** Chargement unique de VexFlow et de la police Bravura (seulement sur les pages qui en ont besoin). */
export type VexFlowModule = typeof import('vexflow/core');

let loader: Promise<VexFlowModule> | null = null;

export function loadVexFlow(): Promise<VexFlowModule> {
  loader ??= (async () => {
    const [mod] = await Promise.all([import('vexflow/core'), document.fonts?.load('40px Bravura') ?? Promise.resolve()]);
    if (!document.fonts?.check('40px Bravura')) throw new Error('Police musicale indisponible');
    mod.VexFlow.setFonts('Bravura');
    return mod;
  })().catch((e: unknown) => {
    loader = null; // Permet de réessayer (connexion instable).
    throw e;
  });
  return loader;
}

/** Facteur d'agrandissement selon la largeur disponible : plus l'écran est petit, plus on agrandit. */
export function zoomFor(width: number): number {
  return width < 420 ? 1.8 : width < 700 ? 1.9 : 2;
}

/** Adapte le SVG produit par VexFlow à la largeur de son conteneur. */
export function makeResponsive(host: HTMLElement, width: number, height: number) {
  const svg = host.querySelector('svg');
  if (!svg) return;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', '100%');
  svg.removeAttribute('height');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.width = '100%';
  svg.style.height = 'auto';
  svg.style.display = 'block';
}
