/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INSCRIPTION_ENDPOINT?: string;
  readonly VITE_PAIEMENT_ENDPOINT?: string;
  readonly VITE_ROUTEUR?: 'memoire';
}
