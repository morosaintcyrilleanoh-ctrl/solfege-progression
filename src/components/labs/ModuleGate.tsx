'use client';

import Link from 'next/link';
import { type ReactNode, useEffect, useState } from 'react';
import { Card, buttonClasses } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { advancedAccessForAccountAction } from '@/app/espace/actions';
import { type ModuleAccess, localAccessToAdvanced } from '@/lib/access/learner-level';

/** Affiche le contenu seulement si l'élève a accès au module avancé. */
export function ModuleGate({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<ModuleAccess | null>(null);
  useEffect(() => {
    const local = localAccessToAdvanced();
    if (local.allowed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage du navigateur
      setAccess(local);
      return;
    }
    // Sinon, le compte (niveau ou déblocage par le formateur) peut ouvrir le module.
    let cancelled = false;
    advancedAccessForAccountAction()
      .then((account) => {
        if (!cancelled) setAccess(account.allowed ? { allowed: true, reason: account.reason ?? '' } : local);
      })
      .catch(() => !cancelled && setAccess(local));
    return () => {
      cancelled = true;
    };
  }, []);
  if (!access) return <p className="py-12 text-center text-slate-500">Vérification de ton parcours…</p>;
  if (access.allowed) {
    return (
      <>
        <p className="mb-3 flex items-center gap-2 text-xs text-slate-500">
          <Icon name="check" className="size-4 text-success-600" /> {access.reason}
        </p>
        {children}
      </>
    );
  }
  return (
    <Card className="text-center">
      <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-accent-600/10 text-accent-600">
        <Icon name="lock" className="size-6" />
      </span>
      <h2 className="text-lg font-bold text-night-800">Module avancé</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{access.reason}</p>
      <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">Avec un compte, ton formateur pourra aussi ouvrir ce module pour toi.</p>
      <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
        <Link href="/test-de-positionnement" className={buttonClasses('primary')}>
          Passer le test de positionnement
        </Link>
        <Link href="/laboratoires/tonalites" className={buttonClasses('secondary')}>
          Aller au module 3
        </Link>
      </div>
    </Card>
  );
}
