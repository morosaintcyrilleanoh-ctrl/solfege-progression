import { redirect } from 'next/navigation';
import { homeForRole, requireUser } from '@/lib/auth/session';

export default async function EspacePage() {
  const { profile } = await requireUser('/espace');
  redirect(homeForRole(profile.role));
}
