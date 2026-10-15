import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { isProtectedPath } from '@/lib/auth/redirects';

/**
 * Rafraîchit la session Supabase (cookies) et redirige vers la connexion les
 * visiteurs non connectés qui demandent une page privée. Chaque page privée
 * vérifie à nouveau l'utilisateur et son rôle côté serveur.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Les pages publiques (laboratoires…) restent statiques et rapides : rien à faire.
  if (!url || !key || !isProtectedPath(request.nextUrl.pathname)) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet, headers) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    const login = request.nextUrl.clone();
    login.pathname = '/connexion';
    login.search = `?suivant=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: ['/espace/:path*', '/profil/:path*', '/cours/:path*', '/nouveau-mot-de-passe'],
};
