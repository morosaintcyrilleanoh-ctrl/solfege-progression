import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Chemins absolus en production (indispensable pour les pages /formations/<id>) ;
  // chemins relatifs pour l'aperçu intégré en fichier unique.
  base: process.env.VITE_ROUTEUR === 'memoire' ? './' : '/',
  build: {
    target: 'es2020',
    // Aperçu intégré (fichier unique) : images incluses directement dans le code.
    assetsInlineLimit: process.env.VITE_ROUTEUR === 'memoire' ? 5_000_000 : 4096,
    cssCodeSplit: false,
  },
});
