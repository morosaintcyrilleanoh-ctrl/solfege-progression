import { describe, expect, it } from 'vitest';
import {
  diatonicIndex,
  enharmonicallyEqual,
  formatPitch,
  frequency,
  midiNumber,
  parsePitchKey,
  pitchFromDiatonicIndex,
  pitchFromMidi,
  pitchKey,
  type Pitch,
} from './pitch';

const p = (key: string): Pitch => parsePitchKey(key);

describe('hauteurs', () => {
  it('place le do central sur MIDI 60 et le La 440 sur MIDI 69', () => {
    expect(midiNumber(p('C4'))).toBe(60);
    expect(midiNumber(p('A4'))).toBe(69);
    expect(frequency(p('A4'))).toBeCloseTo(440, 6);
    expect(frequency(p('A3'))).toBeCloseTo(220, 6);
  });

  it('gère les altérations, y compris celles qui changent d’octave', () => {
    expect(midiNumber(p('C#4'))).toBe(61);
    expect(midiNumber(p('Db4'))).toBe(61);
    expect(midiNumber(p('B#3'))).toBe(60);
    expect(midiNumber(p('Cb4'))).toBe(59);
    expect(midiNumber(p('F##4'))).toBe(67);
    expect(midiNumber(p('Bbb3'))).toBe(57);
  });

  it('distingue l’orthographe de la hauteur sonore', () => {
    expect(enharmonicallyEqual(p('F#4'), p('Gb4'))).toBe(true);
    expect(pitchKey(p('F#4'))).not.toBe(pitchKey(p('Gb4')));
  });

  it('calcule un index diatonique réversible', () => {
    expect(diatonicIndex(p('C4'))).toBe(28);
    for (let i = 0; i < 70; i++) {
      expect(diatonicIndex(pitchFromDiatonicIndex(i))).toBe(i);
    }
  });

  it('relit les clés texte qu’il produit', () => {
    for (const key of ['C4', 'F#3', 'Bb2', 'E##5', 'Abb1', 'C-1']) {
      expect(pitchKey(parsePitchKey(key))).toBe(key);
    }
    expect(() => parsePitchKey('H4')).toThrow();
  });

  it('formate en notation française (Do3 = do central) et internationale (C4)', () => {
    expect(formatPitch(p('C4'))).toBe('Do 3');
    expect(formatPitch(p('C4'), { notation: 'intl', octave: 'intl' })).toBe('C4');
    expect(formatPitch(p('F#4'), { notation: 'fr', octave: 'intl' })).toBe('Fa♯ 4');
    expect(formatPitch(p('Bb2'), { octave: false })).toBe('Si♭');
    expect(formatPitch(p('G4'), { notation: 'fr', octave: 'fr' })).toBe('Sol 3');
  });
});

describe('touches de clavier', () => {
  it('orthographie les touches noires avec des dièses', () => {
    expect(pitchKey(pitchFromMidi(60))).toBe('C4');
    expect(pitchKey(pitchFromMidi(61))).toBe('C#4');
    expect(pitchKey(pitchFromMidi(47))).toBe('B2');
    for (let m = 21; m <= 108; m++) expect(midiNumber(pitchFromMidi(m))).toBe(m);
  });
});
