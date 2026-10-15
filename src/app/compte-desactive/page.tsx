import { signOutAction } from '@/app/connexion/actions';
import { buttonClasses } from '@/components/ui/primitives';

export default function DisabledPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-xl font-bold text-night-800">Compte désactivé</h1>
      <p className="mt-2 text-slate-600">Ton compte a été désactivé par un administrateur. Contacte ton formateur pour plus d’informations.</p>
      <form action={signOutAction} className="mt-6">
        <button type="submit" className={buttonClasses('secondary')}>
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
