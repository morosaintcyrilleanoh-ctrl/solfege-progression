import type { MouseEvent, ReactNode } from 'react';
import { site } from '../config/site';
import { trouverFormation } from '../config/formations';
import { trouverOffre } from '../config/offres';
import type { Bouton } from '../config/types';
import { href, useRouteur } from '../lib/router';
import { lienWhatsApp, remplir } from '../lib/whatsapp';
import { Icone } from './Icone';

type Props = {
  bouton: Bouton;
  variante?: 'plein' | 'contour';
  taille?: 'normal' | 'petit';
  large?: boolean;
  icone?: ReactNode;
  className?: string;
};

/**
 * Bouton configurable : son comportement est entièrement décrit par
 * la configuration (voir le type Action dans src/config/types.ts).
 */
export function BoutonAction({ bouton, variante = 'plein', taille = 'normal', large, icone, className }: Props) {
  const { chemin, naviguer } = useRouteur();
  const { action, libelle } = bouton;
  const classes = [
    'btn',
    variante === 'contour' && 'btn--contour',
    taille === 'petit' && 'btn--petit',
    large && 'btn--large',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const interne = (cible: string) => ({
    href: href(cible),
    onClick: (e: MouseEvent) => {
      e.preventDefault();
      naviguer(cible);
    },
  });

  switch (action.type) {
    case 'inscription': {
      const params = new URLSearchParams();
      if (action.formation) params.set('formation', action.formation);
      if (action.offre) params.set('offre', action.offre);
      const query = params.toString();
      return (
        <a className={classes} {...interne(`/inscription${query ? `?${query}` : ''}`)}>
          {icone}
          {libelle}
        </a>
      );
    }

    case 'whatsapp': {
      const message = action.message ?? site.messagesWhatsApp.general;
      const url = lienWhatsApp(message);
      if (!url) {
        // Numéro pas encore configuré : on mène au bloc de contact.
        const cible = '/#contact';
        return (
          <a
            className={classes}
            title={site.afficherEmplacements ? 'Numéro WhatsApp à renseigner dans src/config/site.ts' : undefined}
            {...(chemin === '/' ? { href: '#contact' } : interne(cible))}
          >
            {icone ?? <Icone nom="whatsapp" />}
            {libelle}
          </a>
        );
      }
      return (
        <a className={classes} href={url} target="_blank" rel="noopener noreferrer">
          {icone ?? <Icone nom="whatsapp" />}
          {libelle}
        </a>
      );
    }

    case 'lien': {
      if (!action.url) {
        if (!site.afficherEmplacements) return null;
        return (
          <span className={classes} aria-disabled="true" title="Lien à renseigner dans la configuration">
            {icone}
            {libelle} · lien à configurer
          </span>
        );
      }
      return (
        <a
          className={classes}
          href={action.url}
          {...(action.nouvelOnglet ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {icone}
          {libelle}
        </a>
      );
    }

    case 'page':
      return (
        <a className={classes} {...interne(action.chemin)}>
          {icone}
          {libelle}
        </a>
      );

    case 'section': {
      if (chemin === '/') {
        return (
          <a className={classes} href={`#${action.id}`}>
            {icone}
            {libelle}
          </a>
        );
      }
      return (
        <a className={classes} {...interne(`/#${action.id}`)}>
          {icone}
          {libelle}
        </a>
      );
    }
  }
}

/** Message WhatsApp adapté à une formation ou une offre. */
export function messagePour(formationId?: string, offreId?: string) {
  const formation = trouverFormation(formationId);
  const offre = trouverOffre(offreId);
  if (formation) return remplir(site.messagesWhatsApp.formation, { formation: formation.titre });
  if (offre) return remplir(site.messagesWhatsApp.offre, { offre: offre.nom });
  return site.messagesWhatsApp.general;
}
