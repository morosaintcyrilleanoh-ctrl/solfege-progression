'use client';

import { useEffect, useState, useTransition } from 'react';
import { importLocalResultsAction } from '@/app/espace/actions';
import { buttonClasses } from '@/components/ui/primitives';
import { collectLocalResults } from '@/lib/storage/collect-local';
import type { ImportPayload } from '@/lib/validation/import';

/** Propose d'envoyer vers le compte les résultats faits sans être connecté, sur cet appareil. */
export function LocalImport() {
  const [payload, setPayload] = useState<ImportPayload | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message?: string } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage du navigateur
    setPayload(collectLocalResults());
  }, []);

  if (!payload || (payload.sessions.length === 0 && !payload.placement)) return null;

  return (
    <section className="rounded-2xl border border-electric-300 bg-electric-500/5 p-4">
      <h2 className="font-bold text-night-800">Résultats enregistrés sur cet appareil</h2>
      <p className="mt-1 text-sm text-slate-700">
        {payload.sessions.length} séance(s) de laboratoire{payload.placement ? ' et un test de positionnement' : ''} peuvent être ajoutés à ton
        compte, pour que ton formateur les voie.
      </p>
      <button
        type="button"
        disabled={pending}
        className={`${buttonClasses('primary')} mt-3`}
        onClick={() =>
          start(async () => {
            try {
              setResult(await importLocalResultsAction(payload));
            } catch {
              setResult({ ok: false, message: 'Connexion au serveur impossible. Réessaie plus tard : tes résultats restent sur cet appareil.' });
            }
          })
        }
      >
        {pending ? 'Import…' : 'Importer sur mon compte'}
      </button>
      {result && (
        <p role={result.ok ? 'status' : 'alert'} className={`mt-2 text-sm ${result.ok ? 'text-success-700' : 'text-danger-700'}`}>
          {result.message}
        </p>
      )}
    </section>
  );
}
