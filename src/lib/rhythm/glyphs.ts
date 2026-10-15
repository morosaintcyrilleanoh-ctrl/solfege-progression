/** Symboles SMuFL (police Bravura) pour afficher une figure dans le texte. */
import type { BaseValue, RhythmEvent } from './durations';

const NOTE: Record<BaseValue, string> = {
  whole: '',
  half: '',
  quarter: '',
  eighth: '',
  sixteenth: '',
};

const REST: Record<BaseValue, string> = {
  whole: '',
  half: '',
  quarter: '',
  eighth: '',
  sixteenth: '',
};

const DOT = '';

export function figureGlyph(e: RhythmEvent): string {
  const base = e.rest ? REST[e.value] : NOTE[e.value];
  return base + (e.dots ? ' ' + DOT.repeat(e.dots) : '');
}
