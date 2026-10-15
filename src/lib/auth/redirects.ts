/**
 * Chemin de retour après connexion : seulement un chemin interne, pour éviter
 * les redirections vers un site extérieur (« open redirect »).
 */
export function safeNextPath(value: string | null | undefined, fallback = '/espace'): string {
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\') || value.includes('://')) return fallback;
  if (/[\r\n]/.test(value)) return fallback;
  return value.slice(0, 300);
}

/** Routes privées : protégées par le proxy et, à nouveau, par chaque page côté serveur. */
export const PROTECTED_PREFIXES = ['/espace', '/profil', '/cours', '/nouveau-mot-de-passe'];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
