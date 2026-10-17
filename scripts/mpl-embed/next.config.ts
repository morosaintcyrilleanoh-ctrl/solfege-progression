import type { NextConfig } from 'next';

// Version statique du solfège, servie par Music Progression Lab dans le dossier /solfege.
const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/solfege',
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  // Le code est déjà vérifié par le projet Solfège Progression (npm run typecheck) ;
  // ici, les pages en ligne (comptes, cours…) sont retirées et leurs imports n'existent plus.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
