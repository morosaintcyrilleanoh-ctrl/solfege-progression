import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parsePitchKey } from '@/lib/music/pitch';
import { clearHistory, loadActiveEvaluation, loadHistory, saveActiveEvaluation, toStoredSession, upsertSession } from './history';
import { type SessionConfig, createSession, sessionReducer } from './session';
import { sanitizeSettings, DEFAULT_SETTINGS } from './settings';

function memoryStorage(failWrites = false): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => {
      if (failWrites) throw new DOMException('plein', 'QuotaExceededError');
      data.set(k, v);
    },
  };
}

const config: SessionConfig = { mode: 'training', clefChoice: 'treble', level: 1, answerMode: 'buttons', evaluationLength: 10 };
const q = (key: string) => ({ id: key, clef: 'treble' as const, pitch: parsePitchKey(key) });

describe('historique local', () => {
  beforeEach(() => vi.stubGlobal('window', { localStorage: memoryStorage() }));
  afterEach(() => vi.unstubAllGlobals());

  it('enregistre une séance et la met à jour après chaque réponse', () => {
    let s = createSession('a', config, [q('G4')], 0);
    s = sessionReducer(s, { type: 'answer', answer: { kind: 'name', letter: 'G', accidental: 0 }, now: 1000 });
    expect(upsertSession(toStoredSession(s))).toEqual({ ok: true });
    s = sessionReducer(s, { type: 'next', question: q('E4'), now: 1000 });
    s = sessionReducer(s, { type: 'answer', answer: { kind: 'name', letter: 'F', accidental: 0 }, now: 2000 });
    upsertSession(toStoredSession(s));
    const history = loadHistory();
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ id: 'a', total: 2, correct: 1 });
    expect(history[0]?.items.map((i) => i.k)).toEqual(['treble:G4', 'treble:E4']);
    expect(clearHistory().ok).toBe(true);
    expect(loadHistory()).toEqual([]);
  });

  it('ignore les séances sans réponse et les données corrompues', () => {
    expect(upsertSession(toStoredSession(createSession('b', config, [q('G4')], 0)))).toEqual({ ok: true });
    expect(loadHistory()).toEqual([]);
    window.localStorage.setItem('solfege-progression:note-reading:history:v1', '{pas du json');
    expect(loadHistory()).toEqual([]);
  });

  it('conserve et relit une évaluation en cours', () => {
    const evalConfig = { ...config, mode: 'evaluation' as const, evaluationLength: 2 };
    const s = createSession('c', evalConfig, [q('G4'), q('A4')], 0);
    saveActiveEvaluation(s);
    expect(loadActiveEvaluation()?.id).toBe('c');
  });
});

describe('échecs d’écriture signalés honnêtement', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('signale un stockage plein', () => {
    vi.stubGlobal('window', { localStorage: memoryStorage(true) });
    let s = createSession('d', config, [q('G4')], 0);
    s = sessionReducer(s, { type: 'answer', answer: { kind: 'name', letter: 'G', accidental: 0 }, now: 1 });
    expect(upsertSession(toStoredSession(s))).toEqual({ ok: false, reason: 'quota' });
  });

  it('signale l’absence de stockage', () => {
    vi.stubGlobal('window', undefined);
    let s = createSession('e', config, [q('G4')], 0);
    s = sessionReducer(s, { type: 'answer', answer: { kind: 'name', letter: 'G', accidental: 0 }, now: 1 });
    expect(upsertSession(toStoredSession(s))).toEqual({ ok: false, reason: 'unavailable' });
  });
});

describe('réglages', () => {
  it('remplace les valeurs invalides par les valeurs par défaut', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings({ level: 9, clefChoice: 'alto', sound: 'oui', notation: 'intl' })).toEqual({ ...DEFAULT_SETTINGS, notation: 'intl' });
  });
});
