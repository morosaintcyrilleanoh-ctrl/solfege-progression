import { describe, expect, it, vi } from 'vitest';
import { StaveNote } from 'vexflow/core';
import { parsePitchKey } from './pitch';
import { type Clef, describeStep, ledgerLineSteps, pitchAtStep, staffPosition, staffStep, vexflowLine } from './staff';

const step = (key: string, clef: Clef) => staffStep(parsePitchKey(key), clef);

describe('clé de sol', () => {
  it('place les notes sur les lignes : Mi Sol Si Ré Fa', () => {
    expect(['E4', 'G4', 'B4', 'D5', 'F5'].map((k) => step(k, 'treble'))).toEqual([0, 2, 4, 6, 8]);
  });
  it('place les notes dans les interlignes : Fa La Do Mi', () => {
    expect(['F4', 'A4', 'C5', 'E5'].map((k) => step(k, 'treble'))).toEqual([1, 3, 5, 7]);
  });
  it('enroule la clé autour de la 2e ligne (Sol)', () => {
    expect(staffPosition(parsePitchKey('G4'), 'treble').description).toBe('2e ligne');
  });
  it('place le do central sur la 1re ligne supplémentaire en dessous', () => {
    const pos = staffPosition(parsePitchKey('C4'), 'treble');
    expect(pos.step).toBe(-2);
    expect(pos.ledgerLines).toBe(1);
    expect(pos.description).toBe('1re ligne supplémentaire en dessous');
  });
  it('gère les lignes supplémentaires au-dessus', () => {
    expect(staffPosition(parsePitchKey('A5'), 'treble').description).toBe('1re ligne supplémentaire au-dessus');
    expect(staffPosition(parsePitchKey('C6'), 'treble').ledgerLines).toBe(2);
    expect(staffPosition(parsePitchKey('E6'), 'treble').ledgerLines).toBe(3);
    expect(staffPosition(parsePitchKey('G5'), 'treble').description).toBe('au-dessus de la 5e ligne');
    expect(staffPosition(parsePitchKey('B5'), 'treble').description).toBe('au-dessus de la 1re ligne supplémentaire');
  });
});

describe('clé de fa', () => {
  it('place les notes sur les lignes : Sol Si Ré Fa La', () => {
    expect(['G2', 'B2', 'D3', 'F3', 'A3'].map((k) => step(k, 'bass'))).toEqual([0, 2, 4, 6, 8]);
  });
  it('place les notes dans les interlignes : La Do Mi Sol', () => {
    expect(['A2', 'C3', 'E3', 'G3'].map((k) => step(k, 'bass'))).toEqual([1, 3, 5, 7]);
  });
  it('place le Fa de la clé sur la 4e ligne', () => {
    expect(staffPosition(parsePitchKey('F3'), 'bass').description).toBe('4e ligne');
  });
  it('place le do central sur la 1re ligne supplémentaire au-dessus', () => {
    expect(staffPosition(parsePitchKey('C4'), 'bass').description).toBe('1re ligne supplémentaire au-dessus');
    expect(staffPosition(parsePitchKey('E2'), 'bass').description).toBe('1re ligne supplémentaire en dessous');
    expect(staffPosition(parsePitchKey('F2'), 'bass').description).toBe('sous la 1re ligne');
  });
});

describe('positions et lignes supplémentaires', () => {
  it('une altération ne change pas la position sur la portée', () => {
    expect(step('F#4', 'treble')).toBe(step('F4', 'treble'));
    expect(step('Bb2', 'bass')).toBe(step('B2', 'bass'));
    // Mais deux enharmoniques ne s'écrivent pas au même endroit.
    expect(step('F#4', 'treble')).not.toBe(step('Gb4', 'treble'));
  });
  it('dessine les bonnes lignes supplémentaires', () => {
    expect(ledgerLineSteps(4)).toEqual([]);
    expect(ledgerLineSteps(-1)).toEqual([]);
    expect(ledgerLineSteps(-2)).toEqual([-2]);
    expect(ledgerLineSteps(-5)).toEqual([-2, -4]);
    expect(ledgerLineSteps(9)).toEqual([]);
    expect(ledgerLineSteps(14)).toEqual([10, 12, 14]);
  });
  it('pitchAtStep est l’inverse de staffStep', () => {
    for (const clef of ['treble', 'bass'] as const) {
      for (let s = -10; s <= 18; s++) expect(staffStep(pitchAtStep(s, clef), clef)).toBe(s);
    }
  });
  it('décrit les interlignes au masculin et les lignes au féminin', () => {
    expect(describeStep(1)).toBe('1er interligne');
    expect(describeStep(0)).toBe('1re ligne');
    expect(describeStep(-3)).toBe('sous la 1re ligne supplémentaire en dessous');
  });
});

describe('concordance avec le moteur de notation VexFlow', () => {
  it('VexFlow place chaque note exactement sur la ligne calculée, dans les deux clés', () => {
    // VexFlow signale l’absence de canvas sous Node ; sans effet sur le calcul des lignes.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      for (const clef of ['treble', 'bass'] as const) {
        for (let s = -8; s <= 16; s++) {
          for (const acc of [-1, 0, 1] as const) {
            const pitch = pitchAtStep(s, clef, acc);
            const key = `${pitch.letter.toLowerCase()}${acc === 1 ? '#' : acc === -1 ? 'b' : ''}/${pitch.octave}`;
            const note = new StaveNote({ keys: [key], duration: 'w', clef });
            expect(note.getKeyProps()[0]?.line, `${clef} ${key}`).toBe(vexflowLine(s));
          }
        }
      }
    } finally {
      warn.mockRestore();
    }
  });
});
