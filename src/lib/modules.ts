/** Modules pédagogiques et état réel de leur développement. */
export interface ModuleInfo {
  id: string;
  number: number;
  title: string;
  description: string;
  href: string | null;
  status: 'available' | 'planned';
}

export const MODULES: ModuleInfo[] = [
  {
    id: 'lecture-des-notes',
    number: 1,
    title: 'Lecture des notes',
    description: 'Clé de sol, clé de fa, lignes supplémentaires, octaves et altérations.',
    href: '/laboratoires/lecture-des-notes',
    status: 'available',
  },
  {
    id: 'rythme',
    number: 2,
    title: 'Rythme, temps et mesures',
    description: 'Figures de notes, silences, métronome, mesures simples et composées.',
    href: '/laboratoires/rythme',
    status: 'available',
  },
  {
    id: 'tonalites',
    number: 3,
    title: 'Tonalités et gammes',
    description: 'Armures, cycle des quintes, gammes majeures et mineures.',
    href: '/laboratoires/tonalites',
    status: 'available',
  },
  {
    id: 'intervalles',
    number: 4,
    title: 'Intervalles et théorie',
    description: 'Intervalles, accords, renversements, fonctions, lecture mélodique. Niveau intermédiaire.',
    href: '/laboratoires/intervalles',
    status: 'available',
  },
];
