/**
 * Accès au stockage du navigateur qui ne plante jamais (navigation privée,
 * stockage plein ou bloqué) et qui dit la vérité : chaque écriture renvoie
 * si elle a réellement réussi.
 */
export type WriteResult = { ok: true } | { ok: false; reason: 'unavailable' | 'quota' | 'error' };

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readJson<T>(key: string, validate: (value: unknown) => value is T): T | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(key);
    if (raw == null) return null;
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): WriteResult {
  const s = storage();
  if (!s) return { ok: false, reason: 'unavailable' };
  try {
    s.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (e) {
    const quota = e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22);
    return { ok: false, reason: quota ? 'quota' : 'error' };
  }
}

export function removeKey(key: string): WriteResult {
  const s = storage();
  if (!s) return { ok: false, reason: 'unavailable' };
  try {
    s.removeItem(key);
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export function writeErrorMessage(result: WriteResult): string | null {
  if (result.ok) return null;
  switch (result.reason) {
    case 'unavailable':
      return "Le stockage de cet appareil n'est pas disponible (navigation privée ?). Tes résultats ne seront pas conservés.";
    case 'quota':
      return "L'espace de stockage de cet appareil est plein. Tes derniers résultats n'ont pas pu être enregistrés.";
    default:
      return "Tes résultats n'ont pas pu être enregistrés sur cet appareil.";
  }
}
