'use client';

import { useRef, useState } from 'react';
import { buttonClasses } from '@/components/ui/primitives';
import { ACCEPT, FILE_LIMITS, formatSize, safeFileName } from '@/lib/content/files';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export type UploadedFile = { path: string; size: number; mime: string; name: string };

/**
 * Envoi d'un fichier dans un compartiment privé. Le navigateur dépose le
 * fichier avec la session de l'utilisateur : les règles de stockage vérifient
 * qu'il a le droit d'écrire à cet emplacement. Le résultat affiché est réel.
 */
export function FileUpload({
  bucket,
  folder,
  label,
  onUploaded,
}: {
  bucket: keyof typeof FILE_LIMITS;
  folder: string;
  label: string;
  onUploaded: (file: UploadedFile) => Promise<{ ok: boolean; message?: string }>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<{ kind: 'idle' | 'busy' | 'ok' | 'error'; message?: string }>({ kind: 'idle' });

  const upload = async () => {
    const file = input.current?.files?.[0];
    if (!file) return setState({ kind: 'error', message: 'Choisis un fichier.' });
    if (file.size > FILE_LIMITS[bucket]) {
      return setState({ kind: 'error', message: `Fichier trop lourd (${formatSize(file.size)}). Maximum : ${formatSize(FILE_LIMITS[bucket])}.` });
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return setState({ kind: 'error', message: 'Stockage non configuré.' });
    setState({ kind: 'busy' });
    const path = `${folder}/${crypto.randomUUID().slice(0, 8)}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (error) {
      const m = error.message ?? '';
      return setState({
        kind: 'error',
        message: /size|exceed/i.test(m) ? 'Fichier trop lourd.' : /mime|type/i.test(m) ? 'Type de fichier non accepté.' : 'L’envoi a échoué (connexion ou droits). Réessaie.',
      });
    }
    const r = await onUploaded({ path, size: file.size, mime: file.type, name: file.name }).catch(() => ({ ok: false, message: 'L’enregistrement a échoué.' }));
    setState({ kind: r.ok ? 'ok' : 'error', message: r.message });
    if (r.ok && input.current) input.current.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">
        {label}
        <input
          ref={input}
          type="file"
          accept={ACCEPT[bucket]}
          className="mt-1 block w-full text-sm file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-electric-500/10 file:px-3 file:font-semibold file:text-electric-700"
        />
      </label>
      <p className="text-xs text-slate-500">
        Taille maximale : {formatSize(FILE_LIMITS[bucket])}. Pense à compresser les fichiers pour les élèves qui ont peu de données mobiles.
      </p>
      <button type="button" onClick={upload} disabled={state.kind === 'busy'} className={buttonClasses('secondary')}>
        {state.kind === 'busy' ? 'Envoi en cours…' : 'Envoyer le fichier'}
      </button>
      {state.message && (
        <p role={state.kind === 'ok' ? 'status' : 'alert'} className={`text-sm ${state.kind === 'ok' ? 'text-success-700' : 'text-danger-700'}`}>
          {state.message}
        </p>
      )}
    </div>
  );
}
