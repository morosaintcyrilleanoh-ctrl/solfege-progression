import type { ReactNode } from 'react';

type Props = { surtitre: string; titre: string; introduction?: ReactNode; id?: string };

export function EnteteSection({ surtitre, titre, introduction, id }: Props) {
  return (
    <header className="entete-section">
      <span className="surtitre">{surtitre}</span>
      <h2 className="titre-section" id={id}>
        {titre}
      </h2>
      {introduction && <p className="intro-section">{introduction}</p>}
    </header>
  );
}
