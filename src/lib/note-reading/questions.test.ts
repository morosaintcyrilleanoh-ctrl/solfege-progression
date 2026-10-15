import { describe, expect, it } from 'vitest';
import { midiNumber, parsePitchKey } from '@/lib/music/pitch';
import { staffStep } from '@/lib/music/staff';
import { seededRng } from '@/lib/random';
import { LEVELS, LEVEL_IDS } from './levels';
import { answerLabel, candidatesFor, checkAnswer, explainQuestion, generateQuestion, generateSeries, questionKey, type NoteQuestion } from './questions';

const q = (clef: 'treble' | 'bass', key: string): NoteQuestion => ({ id: 't', clef, pitch: parsePitchKey(key) });
const labels = { notation: 'fr', octaveConvention: 'fr' } as const;

describe('génération des questions', () => {
  it('reste dans l’étendue de chaque niveau, pour chaque clé', () => {
    for (const level of LEVEL_IDS) {
      const rng = seededRng(level);
      for (let i = 0; i < 300; i++) {
        const question = generateQuestion({ clefChoice: 'both', level, rng });
        const s = staffStep(question.pitch, question.clef);
        expect(s).toBeGreaterThanOrEqual(LEVELS[level].minStep);
        expect(s).toBeLessThanOrEqual(LEVELS[level].maxStep);
        if (!LEVELS[level].accidentals) expect(question.pitch.accidental).toBe(0);
      }
    }
  });

  it('le niveau 1 couvre exactement les 9 positions de la portée', () => {
    const treble = candidatesFor('treble', 1).map((c) => questionKey(c));
    expect(treble).toEqual(['E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5'].map((k) => `treble:${k}`));
    const bass = candidatesFor('bass', 1).map((c) => questionKey(c));
    expect(bass).toEqual(['G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3'].map((k) => `bass:${k}`));
  });

  it('respecte le choix de clé', () => {
    const rng = seededRng(7);
    for (let i = 0; i < 100; i++) expect(generateQuestion({ clefChoice: 'bass', level: 2, rng }).clef).toBe('bass');
    const clefs = new Set(generateSeries(60, { clefChoice: 'both', level: 1, rng }).map((x) => x.clef));
    expect(clefs).toEqual(new Set(['treble', 'bass']));
  });

  it('ne répète jamais deux fois de suite la même note', () => {
    const series = generateSeries(500, { clefChoice: 'treble', level: 1, rng: seededRng(3) });
    for (let i = 1; i < series.length; i++) expect(questionKey(series[i]!)).not.toBe(questionKey(series[i - 1]!));
  });

  it('exclut les orthographes rares (Mi♯, Si♯, Fa♭, Do♭) au niveau 4', () => {
    const keys = candidatesFor('both', 4).map((c) => questionKey(c));
    expect(keys.some((k) => /:(E#|B#|Fb|Cb)/.test(k))).toBe(false);
    expect(keys).toContain('treble:F#4');
    expect(keys).toContain('bass:Bb2');
  });

  it('propose davantage les notes à réviser', () => {
    const focus = { 'treble:G4': 4 };
    const rng = seededRng(11);
    let withFocus = 0;
    let previous: NoteQuestion | null = null;
    for (let i = 0; i < 2000; i++) {
      previous = generateQuestion({ clefChoice: 'treble', level: 1, rng, focus, previous: null });
      if (questionKey(previous) === 'treble:G4') withFocus++;
    }
    // Sans révision : ~1/9 (≈ 222). Avec un poids ×5 : ≈ 5/13 (≈ 770).
    expect(withFocus).toBeGreaterThan(600);
  });

  it('produit des identifiants uniques', () => {
    const ids = generateSeries(200, { clefChoice: 'both', level: 3, rng: seededRng(5) }).map((x) => x.id);
    expect(new Set(ids).size).toBe(200);
  });
});

describe('correction', () => {
  it('par nom : vérifie la lettre et l’altération, pas l’octave', () => {
    expect(checkAnswer(q('treble', 'G4'), { kind: 'name', letter: 'G', accidental: 0 }).correct).toBe(true);
    expect(checkAnswer(q('treble', 'G4'), { kind: 'name', letter: 'A', accidental: 0 }).correct).toBe(false);
    expect(checkAnswer(q('treble', 'F#4'), { kind: 'name', letter: 'F', accidental: 0 }).correct).toBe(false);
    expect(checkAnswer(q('treble', 'F#4'), { kind: 'name', letter: 'F', accidental: 1 }).correct).toBe(true);
    // L’orthographe compte : Sol♭ n’est pas la note écrite Fa♯.
    expect(checkAnswer(q('treble', 'F#4'), { kind: 'name', letter: 'G', accidental: -1 }).correct).toBe(false);
  });

  it('au clavier : vérifie la touche exacte, donc l’octave', () => {
    const question = q('bass', 'C3');
    expect(checkAnswer(question, { kind: 'key', midi: 48 }).correct).toBe(true);
    const octaveWrong = checkAnswer(question, { kind: 'key', midi: 60 });
    expect(octaveWrong).toEqual({ correct: false, nameCorrect: true, wrongOctaveOnly: true });
    expect(checkAnswer(question, { kind: 'key', midi: 50 }).nameCorrect).toBe(false);
    // Fa♯ et Sol♭ partagent la même touche.
    expect(checkAnswer(q('treble', 'Gb4'), { kind: 'key', midi: midiNumber(parsePitchKey('F#4')) }).correct).toBe(true);
  });

  it('explique la position en français', () => {
    expect(explainQuestion(q('treble', 'G4'), labels)).toBe('En clé de sol, la note sur la 2e ligne est Sol 3.');
    expect(explainQuestion(q('bass', 'C3'), labels)).toBe('En clé de fa, la note sur le 2e interligne est Do 2.');
    expect(explainQuestion(q('treble', 'C4'), labels)).toBe(
      'En clé de sol, la note sur la 1re ligne supplémentaire en dessous est Do 3.',
    );
    expect(explainQuestion(q('treble', 'D4'), labels)).toBe('En clé de sol, la note placée sous la 1re ligne est Ré 3.');
    expect(explainQuestion(q('treble', 'F#4'), labels)).toContain('Fa devient Fa♯');
    expect(explainQuestion(q('treble', 'G4'), { notation: 'intl', octaveConvention: 'intl' })).toContain('G4');
  });

  it('affiche la réponse donnée', () => {
    expect(answerLabel({ kind: 'name', letter: 'B', accidental: -1 }, labels)).toBe('Si♭');
    expect(answerLabel({ kind: 'key', midi: 60 }, labels)).toBe('touche Do 3');
    expect(answerLabel({ kind: 'key', midi: 61 }, { notation: 'intl', octaveConvention: 'intl' })).toBe('touche C♯4');
  });
});
