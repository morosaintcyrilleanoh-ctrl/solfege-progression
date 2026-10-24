import type { SVGProps } from 'react';
import { CLE_DE_SOL, TETE_NOIRE } from './glyphes';

export type NomIcone =
  | 'cle-sol'
  | 'partition'
  | 'clavier'
  | 'accord'
  | 'oreille'
  | 'whatsapp'
  | 'lecture'
  | 'coche'
  | 'menu'
  | 'fermer'
  | 'fleche'
  | 'telephone'
  | 'email'
  | 'lieu'
  | 'horloge'
  | 'personnes'
  | 'image'
  | 'video'
  | 'citation';

type Props = SVGProps<SVGSVGElement> & { nom: NomIcone; taille?: number };

/** Icônes dessinées à la main (aucune bibliothèque externe : chargement rapide). */
export function Icone({ nom, taille = 20, ...props }: Props) {
  const commun = {
    width: taille,
    height: taille,
    'aria-hidden': true,
    focusable: false,
    ...props,
  } as const;
  const trait = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

  switch (nom) {
    case 'cle-sol':
      return (
        <svg {...commun} viewBox="-120 -1140 911 1840">
          <path d={CLE_DE_SOL} transform="scale(1,-1)" fill="currentColor" />
        </svg>
      );
    case 'partition':
      return (
        <svg {...commun} viewBox="0 0 48 48">
          <g stroke="currentColor" strokeWidth="1.2" opacity=".55">
            {[14, 20, 26, 32, 38].map((y) => (
              <line key={y} x1="4" x2="44" y1={y} y2={y} />
            ))}
          </g>
          <g fill="currentColor">
            <path d={TETE_NOIRE} transform="translate(13 32) scale(0.026,-0.026)" />
            <path d={TETE_NOIRE} transform="translate(27 23) scale(0.026,-0.026)" />
          </g>
          <path d="M20.6 31.4V12M34.6 22.4V6" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'accord':
      return (
        <svg {...commun} viewBox="0 0 48 48">
          <g stroke="currentColor" strokeWidth="1.2" opacity=".55">
            {[12, 18, 24, 30, 36].map((y) => (
              <line key={y} x1="4" x2="44" y1={y} y2={y} />
            ))}
          </g>
          <g fill="currentColor">
            {[36, 30, 24].map((y) => (
              <path key={y} d={TETE_NOIRE} transform={`translate(19 ${y}) scale(0.026,-0.026)`} />
            ))}
          </g>
          <path d="M26.6 35.4V8" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'clavier':
      return (
        <svg {...commun} viewBox="0 0 48 48">
          <rect x="5" y="10" width="38" height="28" rx="2" {...trait} />
          <path d="M12.6 10v28M20.2 10v28M27.8 10v28M35.4 10v28" {...trait} strokeWidth="1.2" />
          <g fill="currentColor">
            <rect x="10.4" y="10" width="4.4" height="16" rx="0.6" />
            <rect x="18" y="10" width="4.4" height="16" rx="0.6" />
            <rect x="33.2" y="10" width="4.4" height="16" rx="0.6" />
          </g>
        </svg>
      );
    case 'oreille':
      return (
        <svg {...commun} viewBox="0 0 48 48">
          <path d="M14 20a10 10 0 0 1 20 0c0 6-6 7-6 13a5 5 0 0 1-9 3" {...trait} />
          <path d="M19 21a5 5 0 0 1 10 0c0 3-3 3.5-3 6" {...trait} />
          <path d="M38 15c2 2.5 3 5.5 3 9s-1 6.5-3 9M42.5 11c3 4 4.5 8.5 4.5 13s-1.5 9-4.5 13" {...trait} strokeWidth="1.3" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg {...commun} viewBox="0 0 24 24">
          <path d="M4.2 19.8l1.1-3.9A8.3 8.3 0 1 1 8.4 19z" {...trait} />
          <path d="M9.2 8.6c.2-.5.5-.5.8-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .4-.1.6l-.5.6c-.1.1-.1.3 0 .5a5.6 5.6 0 0 0 2.5 2.2c.2.1.4.1.5-.1l.6-.7c.2-.2.4-.2.6-.1l1.5.7c.2.1.4.2.4.4 0 .5-.2 1.3-.9 1.6-.6.4-1.6.5-3.2-.2a8.6 8.6 0 0 1-3.6-3.4c-.7-1.3-.6-2.4-.3-3.1z" fill="currentColor" />
        </svg>
      );
    case 'lecture':
      return (
        <svg {...commun} viewBox="0 0 24 24">
          <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
        </svg>
      );
    case 'coche':
      return (
        <svg {...commun} viewBox="0 0 24 24">
          <path d="M5 12.5l4.5 4.5L19 7.5" {...trait} strokeWidth="2" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...commun} viewBox="0 0 24 24">
          <path d="M4 7h16M4 12h16M4 17h10" {...trait} strokeWidth="1.8" />
        </svg>
      );
    case 'fermer':
      return (
        <svg {...commun} viewBox="0 0 24 24">
          <path d="M6 6l12 12M18 6L6 18" {...trait} strokeWidth="1.8" />
        </svg>
      );
    case 'fleche':
      return (
        <svg {...commun} viewBox="0 0 24 24">
          <path d="M5 12h14M13 6l6 6-6 6" {...trait} strokeWidth="1.8" />
        </svg>
      );
    case 'telephone':
      return (
        <svg {...commun} viewBox="0 0 24 24">
          <path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z" {...trait} />
        </svg>
      );
    case 'email':
      return (
        <svg {...commun} viewBox="0 0 24 24">
          <rect x="3" y="5.5" width="18" height="13" rx="2" {...trait} />
          <path d="M3.5 7l8.5 6 8.5-6" {...trait} />
        </svg>
      );
    case 'lieu':
      return (
        <svg {...commun} viewBox="0 0 24 24">
          <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" {...trait} />
          <circle cx="12" cy="9.5" r="2.5" {...trait} />
        </svg>
      );
    case 'horloge':
      return (
        <svg {...commun} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8.5" {...trait} />
          <path d="M12 7.5V12l3 2" {...trait} />
        </svg>
      );
    case 'personnes':
      return (
        <svg {...commun} viewBox="0 0 24 24">
          <circle cx="9" cy="8.5" r="3.5" {...trait} />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0" {...trait} />
          <path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.2a6.5 6.5 0 0 1 3.5 5.8" {...trait} />
        </svg>
      );
    case 'image':
      return (
        <svg {...commun} viewBox="0 0 24 24">
          <rect x="3" y="4.5" width="18" height="15" rx="2" {...trait} />
          <circle cx="9" cy="10" r="1.8" {...trait} />
          <path d="M3.5 17.5l5-4.5 4 3.5 3-2.5 5 4" {...trait} />
        </svg>
      );
    case 'video':
      return (
        <svg {...commun} viewBox="0 0 24 24">
          <rect x="3" y="5.5" width="13" height="13" rx="2" {...trait} />
          <path d="M16 10.5l5-3v9l-5-3" {...trait} />
        </svg>
      );
    case 'citation':
      return (
        <svg {...commun} viewBox="0 0 24 24">
          <path d="M10 7H6.5A1.5 1.5 0 0 0 5 8.5V12h4v5H5M19 7h-3.5A1.5 1.5 0 0 0 14 8.5V12h4v5h-4" {...trait} />
        </svg>
      );
  }
}
