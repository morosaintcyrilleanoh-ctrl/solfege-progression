import { site } from '../config/site';
import { Icone, type NomIcone } from './Icone';

type Props = {
  titre: string;
  indication?: string;
  fichier?: string;
  icone?: NomIcone;
  className?: string;
};

/**
 * Emplacement à compléter, visible uniquement en mode aperçu
 * (site.afficherEmplacements = true). Sinon, rien n'est affiché.
 */
export function Emplacement({ titre, indication, fichier, icone = 'image', className }: Props) {
  if (!site.afficherEmplacements) return null;
  return (
    <div className={['emplacement', className].filter(Boolean).join(' ')}>
      <Icone nom={icone} taille={28} />
      <strong>{titre}</strong>
      {indication && <span>{indication}</span>}
      {fichier && <code>{fichier}</code>}
    </div>
  );
}
