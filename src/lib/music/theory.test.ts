import { describe, expect, it } from 'vitest';
import { analyzeTriad, buildTriad, triadOnDegree } from './chords';
import { buildInterval, intervalBetween, intervalName, stepKind, tonesLabel } from './intervals';
import { ALL_FIFTHS, accidentalToDraw, fifthsOf, keyFromFifths, keyName, keySignatureMap, relativeKey } from './keys';
import { type Pitch, LETTERS, formatPitch, midiNumber, parsePitchKey, pitchKey } from './pitch';
import { SCALE_STEPS, arpeggio, buildScale, degreeName, doubleAccidentals } from './scales';

const p = parsePitchKey;
const keys = (list: Pitch[]) => list.map(pitchKey);

describe('intervalles', () => {
  it('nomme les intervalles d’après les lettres et les demi-tons', () => {
    expect(intervalName(intervalBetween(p('C4'), p('E4')))).toBe('tierce majeure');
    expect(intervalName(intervalBetween(p('C4'), p('Eb4')))).toBe('tierce mineure');
    expect(intervalName(intervalBetween(p('C4'), p('D#4')))).toBe('seconde augmentée');
    expect(intervalName(intervalBetween(p('C4'), p('G4')))).toBe('quinte juste');
    expect(intervalName(intervalBetween(p('B3'), p('F4')))).toBe('quinte diminuée');
    expect(intervalName(intervalBetween(p('F4'), p('B4')))).toBe('quarte augmentée');
    expect(intervalName(intervalBetween(p('C4'), p('C5')))).toBe('octave juste');
    expect(intervalName(intervalBetween(p('E4'), p('E4')))).toBe('unisson juste');
    expect(intervalName(intervalBetween(p('E4'), p('C4')))).toBe('tierce majeure'); // ordre indifférent
    expect(intervalName(intervalBetween(p('C#4'), p('Bb4')))).toBe('septième diminuée');
    expect(intervalBetween(p('C4'), p('D5')).number).toBe(9);
  });

  it('construit des intervalles correctement orthographiés', () => {
    expect(pitchKey(buildInterval(p('D4'), 3, 'm'))).toBe('F4');
    expect(pitchKey(buildInterval(p('E4'), 3, 'M'))).toBe('G#4');
    expect(pitchKey(buildInterval(p('Bb3'), 5, 'P'))).toBe('F4');
    expect(pitchKey(buildInterval(p('F#4'), 6, 'm'))).toBe('D5');
    expect(pitchKey(buildInterval(p('C4'), 4, 'A'))).toBe('F#4');
    expect(pitchKey(buildInterval(p('C4'), 3, 'M', 'down'))).toBe('Ab3');
    expect(() => buildInterval(p('Fb4'), 3, 'dd')).toThrow();
  });

  it('construire puis analyser redonne le même intervalle', () => {
    const qualities = { 1: ['P', 'A'], 2: ['m', 'M', 'A'], 3: ['d', 'm', 'M'], 4: ['d', 'P', 'A'], 5: ['d', 'P', 'A'], 6: ['m', 'M'], 7: ['d', 'm', 'M'], 8: ['P'] } as const;
    for (const from of ['C4', 'D4', 'Eb4', 'F#4', 'G4', 'Bb3', 'A4'].map(p)) {
      for (const [n, qs] of Object.entries(qualities)) {
        for (const q of qs) {
          const to = buildInterval(from, Number(n), q);
          const back = intervalBetween(from, to);
          expect(back.number).toBe(Number(n));
          expect(back.quality).toBe(q);
        }
      }
    }
  });

  it('distingue ton, demi-ton diatonique et chromatique', () => {
    expect(stepKind(p('E4'), p('F4'))).toBe('demi-ton diatonique');
    expect(stepKind(p('C4'), p('C#4'))).toBe('demi-ton chromatique');
    expect(stepKind(p('C#4'), p('D4'))).toBe('demi-ton diatonique');
    expect(stepKind(p('F4'), p('G4'))).toBe('ton');
    expect(stepKind(p('C4'), p('Db4'))).toBe('demi-ton diatonique');
    expect(tonesLabel(4)).toBe('2 tons');
    expect(tonesLabel(7)).toBe('3 tons ½');
    expect(tonesLabel(1)).toBe('½ ton');
  });
});

describe('armures et tonalités', () => {
  it('suit le cycle des quintes', () => {
    expect(keyName(keyFromFifths(2, 'major'))).toBe('Ré majeur');
    expect(keyName(keyFromFifths(-3, 'major'))).toBe('Mi♭ majeur');
    expect(keyName(keyFromFifths(-3, 'minor'))).toBe('Do mineur');
    expect(keyName(keyFromFifths(7, 'major'))).toBe('Do♯ majeur');
    expect(keyName(relativeKey(keyFromFifths(1, 'major')))).toBe('Mi mineur');
    expect(fifthsOf({ tonic: { letter: 'F', accidental: 0 }, mode: 'major' })).toBe(-1);
    expect(() => fifthsOf({ tonic: { letter: 'G', accidental: 1 }, mode: 'major' })).toThrow();
  });
  it('place les altérations dans l’ordre', () => {
    expect(keySignatureMap(3)).toMatchObject({ F: 1, C: 1, G: 1, D: 0 });
    expect(keySignatureMap(-2)).toMatchObject({ B: -1, E: -1, A: 0 });
  });
  it('dessine seulement les altérations qui diffèrent de l’armure', () => {
    expect(accidentalToDraw(p('F#4'), 2)).toBeNull();
    expect(accidentalToDraw(p('F4'), 2)).toBe(0); // bécarre
    expect(accidentalToDraw(p('G#4'), 0)).toBe(1);
    expect(accidentalToDraw(p('C4'), null)).toBeNull();
  });
});

describe('gammes', () => {
  it('écrit Fa majeur avec Si♭ (et non La♯)', () => {
    expect(keys(buildScale({ letter: 'F', accidental: 0 }, 'major'))).toEqual(['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5']);
  });

  it('chaque gamme majeure et mineure naturelle du cycle utilise chaque lettre une fois et correspond à son armure', () => {
    for (const fifths of ALL_FIFTHS) {
      for (const mode of ['major', 'minor'] as const) {
        const key = keyFromFifths(fifths, mode);
        const scale = buildScale(key.tonic, mode === 'major' ? 'major' : 'natural-minor', 4);
        const seven = scale.slice(0, 7);
        expect(new Set(seven.map((n) => n.letter)).size).toBe(7);
        const sig = keySignatureMap(fifths);
        for (const n of seven) expect(n.accidental, `${keyName(key)} ${pitchKey(n)}`).toBe(sig[n.letter]);
        expect(midiNumber(scale[7] as Pitch) - midiNumber(scale[0] as Pitch)).toBe(12);
      }
    }
  });

  it('respecte les intervalles de chaque type de gamme', () => {
    for (const type of Object.keys(SCALE_STEPS) as (keyof typeof SCALE_STEPS)[]) {
      for (const letter of LETTERS) {
        const s = buildScale({ letter, accidental: 0 }, type);
        const steps = s.slice(1).map((n, i) => midiNumber(n) - midiNumber(s[i] as Pitch));
        expect(steps).toEqual(SCALE_STEPS[type]);
      }
    }
  });

  it('élève la sensible en mineur harmonique, 6e et 7e en mélodique ascendante seulement', () => {
    const a = { letter: 'A', accidental: 0 } as const;
    expect(keys(buildScale(a, 'harmonic-minor'))).toEqual(['A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G#5', 'A5']);
    expect(keys(buildScale(a, 'melodic-minor'))).toEqual(['A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G#5', 'A5']);
    expect(keys(buildScale(a, 'melodic-minor', 4, 'down'))).toEqual(['A5', 'G5', 'F5', 'E5', 'D5', 'C5', 'B4', 'A4']);
    const g = { letter: 'G', accidental: 0 } as const;
    expect(keys(buildScale(g, 'harmonic-minor'))).toEqual(['G4', 'A4', 'Bb4', 'C5', 'D5', 'Eb5', 'F#5', 'G5']);
  });

  it('nomme les degrés, sensible ou sous-tonique', () => {
    const major = buildScale({ letter: 'D', accidental: 0 }, 'major');
    expect(degreeName(major, 5)).toBe('dominante');
    expect(degreeName(major, 7)).toBe('sensible');
    expect(degreeName(buildScale({ letter: 'A', accidental: 0 }, 'natural-minor'), 7)).toBe('sous-tonique');
  });

  it('signale les tonalités théoriques', () => {
    expect(doubleAccidentals(buildScale({ letter: 'G', accidental: 1 }, 'major'))).toBe(1); // Fa𝄪
    expect(formatPitch(buildScale({ letter: 'G', accidental: 1 }, 'major')[6] as Pitch, { octave: false })).toBe('Fa𝄪');
  });
});

describe('accords', () => {
  it('construit et reconnaît les triades et leurs renversements', () => {
    expect(keys(buildTriad(p('C4'), 'major'))).toEqual(['C4', 'E4', 'G4']);
    expect(keys(buildTriad(p('D4'), 'minor'))).toEqual(['D4', 'F4', 'A4']);
    expect(keys(buildTriad(p('B3'), 'diminished'))).toEqual(['B3', 'D4', 'F4']);
    expect(keys(buildTriad(p('C4'), 'augmented'))).toEqual(['C4', 'E4', 'G#4']);
    expect(keys(buildTriad(p('C4'), 'major', 1))).toEqual(['E4', 'G4', 'C5']);
    for (const root of ['C4', 'F#4', 'Bb3', 'Eb4', 'G4'].map(p)) {
      for (const q of ['major', 'minor', 'diminished', 'augmented'] as const) {
        for (const inv of [0, 1, 2] as const) {
          const a = analyzeTriad(buildTriad(root, q, inv));
          expect(a?.quality).toBe(q);
          expect(a?.inversion).toBe(inv);
          expect(a?.root.letter).toBe(root.letter);
          expect(a?.root.accidental).toBe(root.accidental);
        }
      }
    }
    expect(analyzeTriad([p('C4'), p('D4'), p('E4')])).toBeNull();
  });

  it('donne les accords de chaque degré', () => {
    const C = keyFromFifths(0, 'major');
    expect([1, 2, 3, 4, 5, 6, 7].map((d) => triadOnDegree(C, d).roman)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']);
    const a = keyFromFifths(0, 'minor');
    expect([1, 2, 3, 4, 5, 6, 7].map((d) => triadOnDegree(a, d).roman)).toEqual(['i', 'ii°', 'III+', 'iv', 'V', 'VI', 'vii°']);
    expect(keys(triadOnDegree(a, 5).notes)).toEqual(['E5', 'G#5', 'B5']);
  });
});

describe('arpège de la tonique', () => {
  const names = (ps: Pitch[]) => ps.map(pitchKey);
  it('Do majeur : Do Mi Sol Do', () => {
    expect(names(arpeggio(buildScale({ letter: 'C', accidental: 0 }, 'major', 4)))).toEqual(['C4', 'E4', 'G4', 'C5']);
  });
  it('Fa majeur et Si♭ majeur', () => {
    expect(names(arpeggio(buildScale({ letter: 'F', accidental: 0 }, 'major', 4)))).toEqual(['F4', 'A4', 'C5', 'F5']);
    expect(names(arpeggio(buildScale({ letter: 'B', accidental: -1 }, 'major', 3)))).toEqual(['Bb3', 'D4', 'F4', 'Bb4']);
  });
  it('La mineur (toutes les formes) : La Do Mi La', () => {
    for (const t of ['natural-minor', 'harmonic-minor', 'melodic-minor'] as const) {
      expect(names(arpeggio(buildScale({ letter: 'A', accidental: 0 }, t, 3)))).toEqual(['A3', 'C4', 'E4', 'A4']);
    }
  });
  it('Fa♯ majeur garde l’orthographe (La♯, Do♯)', () => {
    expect(names(arpeggio(buildScale({ letter: 'F', accidental: 1 }, 'major', 4)))).toEqual(['F#4', 'A#4', 'C#5', 'F#5']);
  });
});
