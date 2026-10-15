'use client';

import { useEffect, useState } from 'react';

const FORMAT: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };

/** Date affichée dans le fuseau horaire de l'appareil (le serveur, lui, est en UTC). */
export function LocalTime({ iso, dateOnly = false }: { iso: string | null | undefined; dateOnly?: boolean }) {
  const opts: Intl.DateTimeFormatOptions = dateOnly ? { day: 'numeric', month: 'long', year: 'numeric' } : FORMAT;
  const [text, setText] = useState(() => (iso ? `${new Date(iso).toLocaleString('fr-FR', { ...opts, timeZone: 'UTC' })}${dateOnly ? '' : ' (UTC)'}` : '—'));
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- l'heure locale n'est connue que dans le navigateur
    if (iso) setText(new Date(iso).toLocaleString('fr-FR', opts));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso, dateOnly]);
  return <time dateTime={iso ?? undefined}>{text}</time>;
}

/** Champ date-heure saisi en heure locale, transmis au serveur en ISO (UTC). */
export function LocalDateTimeInput({ name, label, defaultIso, error, required }: { name: string; label: string; defaultIso?: string | null; error?: string; required?: boolean }) {
  const toLocal = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const [local, setLocal] = useState('');
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- conversion dans le fuseau du navigateur
    if (defaultIso) setLocal(toLocal(defaultIso));
  }, [defaultIso]);
  const iso = local && !Number.isNaN(Date.parse(local)) ? new Date(local).toISOString() : '';
  return (
    <div>
      <label htmlFor={`f-${name}`} className="mb-1 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-danger-600"> *</span>}
      </label>
      <input
        id={`f-${name}`}
        type="datetime-local"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        aria-invalid={!!error}
        className={`min-h-12 w-full rounded-xl border-2 bg-white px-3 ${error ? 'border-danger-500' : 'border-slate-300'}`}
      />
      <input type="hidden" name={name} value={iso} />
      <p className="mt-1 text-xs text-slate-500">Heure de ton appareil ; chaque élève la verra dans son propre fuseau horaire.</p>
      {error && <p className="mt-1 text-sm text-danger-700">{error}</p>}
    </div>
  );
}
