/**
 * Version intégrée : élève connecté à Music Progression Lab sur cet appareil.
 * Le Lab (même adresse) garde sa session Supabase dans le stockage local ; on n'en
 * lit que l'identifiant, pour marquer à qui appartient chaque séance de solfège.
 */
export function mplUserId(): string | null {
  try {
    const store = window.localStorage;
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (!key || !/^sb-.+-auth-token$/.test(key)) continue;
      const id = JSON.parse(store.getItem(key) ?? 'null')?.user?.id;
      if (typeof id === 'string') return id;
    }
  } catch {
    // stockage indisponible : séance anonyme
  }
  return null;
}

/** À ajouter aux séances enregistrées : `{ owner }` si un élève est connecté. */
export function mplOwner(): { owner?: string } {
  const id = mplUserId();
  return id ? { owner: id } : {};
}
