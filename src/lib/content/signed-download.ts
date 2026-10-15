import 'server-only';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const NO_STORE = { 'Cache-Control': 'private, no-store' };

/**
 * Téléchargement d'un fichier privé : l'utilisateur doit être connecté, la ligne
 * correspondante doit lui être visible (RLS), et le stockage vérifie à nouveau
 * ses droits avant de créer un lien signé de courte durée.
 */
export async function signedRedirect(
  request: Request,
  load: (supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>) => Promise<{ bucket: string; path: string | null; external?: string | null; download?: string | false } | null>,
) {
  const session = await getSession();
  if (session.status !== 'authenticated') {
    return NextResponse.redirect(new URL(`/connexion?suivant=${encodeURIComponent(new URL(request.url).pathname)}`, request.url), { headers: NO_STORE });
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return new NextResponse('Service indisponible', { status: 503, headers: NO_STORE });
  const target = await load(supabase);
  if (!target) return new NextResponse('Fichier introuvable ou accès refusé.', { status: 404, headers: NO_STORE });
  if (target.external) return NextResponse.redirect(target.external, { headers: NO_STORE });
  if (!target.path) return new NextResponse('Fichier introuvable.', { status: 404, headers: NO_STORE });
  const { data, error } = await supabase.storage.from(target.bucket).createSignedUrl(target.path, 120, { download: target.download ?? false });
  if (error || !data?.signedUrl) return new NextResponse('Accès refusé.', { status: 403, headers: NO_STORE });
  return NextResponse.redirect(data.signedUrl, { headers: NO_STORE });
}

export function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
