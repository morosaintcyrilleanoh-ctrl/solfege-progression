/** Règles d'envoi de fichiers, partagées par l'interface (vérification avant envoi). */
export const FILE_LIMITS = {
  'course-files': 25 * 1024 * 1024,
  submissions: 10 * 1024 * 1024,
  replays: 500 * 1024 * 1024,
} as const;

export const ACCEPT = {
  'course-files': '.pdf,.mp3,.m4a,.ogg,.wav,.jpg,.jpeg,.png,.webp,.mp4,.doc,.docx,.txt',
  submissions: '.pdf,.mp3,.m4a,.ogg,.wav,.webm,.jpg,.jpeg,.png,.webp,.txt',
  replays: '.mp4,.mp3,.m4a',
} as const;

/** Nom de fichier sûr pour un chemin de stockage (sans accents ni caractères spéciaux). */
export function safeFileName(input: string): string {
  // Seul le dernier élément du chemin compte (« ../../x » -> « x »).
  const name = input.split(/[\\/]/).pop() ?? '';
  const dot = name.lastIndexOf('.');
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) : '';
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'fichier';
  return ext ? `${base}.${ext}` : base;
}

export function kindFromMime(mime: string): 'pdf' | 'audio' | 'video' | 'image' | 'document' {
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('image/')) return 'image';
  return 'document';
}

export function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / 1024 / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;
}
