import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Chemins relatifs : le site fonctionne aussi bien à la racine d'un domaine
  // que dans un sous-dossier ou un aperçu.
  base: './',
  build: {
    target: 'es2020',
    cssCodeSplit: false,
  },
});
