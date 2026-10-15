'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { saveProgressAction } from '@/app/cours/actions';
import { buttonClasses } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';

/** Vidéo chargée seulement à la demande : économise les données mobiles. */
export function VideoPlayer({ embed, url }: { embed: string | null; url: string }) {
  const [load, setLoad] = useState(false);
  if (!embed) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={buttonClasses('secondary')}>
        <Icon name="play" className="size-4" /> Ouvrir la vidéo
      </a>
    );
  }
  return load ? (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
      <iframe src={embed} title="Vidéo de la leçon" className="size-full" allow="encrypted-media; picture-in-picture; fullscreen" loading="lazy" />
    </div>
  ) : (
    <button type="button" onClick={() => setLoad(true)} className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl bg-night-900 text-white">
      <span className="flex size-14 items-center justify-center rounded-full bg-electric-500">
        <Icon name="play" className="size-7" />
      </span>
      <span className="font-semibold">Charger la vidéo</span>
      <span className="text-xs text-white/60">Consomme des données mobiles</span>
    </button>
  );
}

/**
 * Suivi de lecture : marque la leçon « en cours », retient jusqu'où l'élève a lu,
 * propose de reprendre au même endroit, et permet de la marquer terminée.
 */
export function LessonProgress({ lessonId, initialStatus, initialScroll }: { lessonId: string; initialStatus: string | null; initialScroll: number }) {
  const [status, setStatus] = useState(initialStatus ?? 'not_started');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const maxScroll = useRef(initialScroll);
  const lastSaved = useRef(-1);

  useEffect(() => {
    const ratio = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      return max > 0 ? Math.min(1, h.scrollTop / max) : 1;
    };
    const onScroll = () => {
      maxScroll.current = Math.max(maxScroll.current, ratio());
    };
    const save = () => {
      if (status === 'completed' || Math.abs(maxScroll.current - lastSaved.current) < 0.05) return;
      lastSaved.current = maxScroll.current;
      void saveProgressAction({ lessonId, status: 'in_progress', percent: Math.round(maxScroll.current * 90), scroll: maxScroll.current }).catch(() => undefined);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const timer = window.setInterval(save, 20000);
    const onHide = () => document.visibilityState === 'hidden' && save();
    document.addEventListener('visibilitychange', onHide);
    // Ouverture de la leçon.
    if (status === 'not_started') {
      void saveProgressAction({ lessonId, status: 'in_progress', percent: 0, scroll: 0 })
        .then((r) => r.ok && setStatus('in_progress'))
        .catch(() => undefined);
    }
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [lessonId, status]);

  return (
    <div className="space-y-2">
      {initialScroll > 0.1 && initialStatus === 'in_progress' && (
        <button
          type="button"
          className="text-sm font-semibold text-electric-600 hover:underline"
          onClick={() => {
            const h = document.documentElement;
            window.scrollTo({ top: initialScroll * (h.scrollHeight - h.clientHeight), behavior: 'smooth' });
          }}
        >
          Reprendre là où je m’étais arrêté
        </button>
      )}
      {status === 'completed' ? (
        <p className="flex items-center gap-2 font-semibold text-success-700">
          <Icon name="check" /> Leçon terminée
        </p>
      ) : (
        <button
          type="button"
          disabled={pending}
          className={buttonClasses('success', 'lg')}
          onClick={() =>
            start(async () => {
              const r = await saveProgressAction({ lessonId, status: 'completed', percent: 100, scroll: 1 }).catch(() => ({ ok: false, message: undefined }));
              setMessage({ ok: r.ok, text: r.ok ? 'Leçon terminée !' : 'Non enregistré : vérifie ta connexion et réessaie.' });
              if (r.ok) setStatus('completed');
            })
          }
        >
          <Icon name="check" /> {pending ? 'Enregistrement…' : 'J’ai terminé cette leçon'}
        </button>
      )}
      {message && (
        <p role={message.ok ? 'status' : 'alert'} className={`text-sm ${message.ok ? 'text-success-700' : 'text-danger-700'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
