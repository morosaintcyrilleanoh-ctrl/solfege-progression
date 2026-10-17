import { mplOwner } from './mpl-owner';

/**
 * Version intégrée à Music Progression Lab : le test de niveau est mis en attente
 * sur l'appareil ; le Lab l'envoie ensuite dans le compte de l'élève connecté.
 */
const OUTBOX_KEY = 'mpl:solfege:placement-outbox:v1';

export async function recordPlacementOnAccountAction(input: {
  level: string;
  takenAt: string;
  scores: Record<string, { correct: number; total: number }>;
}): Promise<{ saved: boolean; message?: string }> {
  const owner = mplOwner();
  if (!owner.owner) return { saved: false };
  try {
    const list: unknown = JSON.parse(window.localStorage.getItem(OUTBOX_KEY) ?? '[]');
    const outbox = Array.isArray(list) ? list : [];
    outbox.push({ ...input, ...owner });
    window.localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox.slice(-20)));
  } catch {
    return { saved: false };
  }
  return { saved: false };
}

export async function advancedAccessForAccountAction(): Promise<{ allowed: boolean; reason?: string }> {
  return { allowed: false };
}
