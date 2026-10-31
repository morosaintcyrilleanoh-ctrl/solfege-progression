import { useEffect, useState } from 'react';
import styles from './CompteARebours.module.css';

/** Compte à rebours réel jusqu'à une date (rien n'est affiché une fois la date passée). */
export function CompteARebours({ jusqua, compact = false }: { jusqua: string; compact?: boolean }) {
  const cible = Date.parse(jusqua);
  const [maintenant, setMaintenant] = useState(() => Date.now());

  useEffect(() => {
    const minuteur = window.setInterval(() => setMaintenant(Date.now()), 1000);
    return () => window.clearInterval(minuteur);
  }, []);

  const reste = Math.max(0, cible - maintenant);
  if (reste === 0) return null;
  const s = Math.floor(reste / 1000);
  const unites = [
    { valeur: Math.floor(s / 86400), libelle: 'jours' },
    { valeur: Math.floor((s % 86400) / 3600), libelle: 'heures' },
    { valeur: Math.floor((s % 3600) / 60), libelle: 'min' },
    { valeur: s % 60, libelle: 'sec' },
  ];

  return (
    <div className={`${styles.compte} ${compact ? styles.compact : ''}`} role="timer" aria-label="Temps restant avant le début">
      {unites.map((u) => (
        <span key={u.libelle} className={styles.unite}>
          <strong>{String(u.valeur).padStart(2, '0')}</strong>
          <small>{u.libelle}</small>
        </span>
      ))}
    </div>
  );
}
