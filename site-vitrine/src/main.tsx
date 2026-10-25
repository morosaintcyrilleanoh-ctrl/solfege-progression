import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Styles globaux en premier : les styles des composants (CSS Modules) peuvent ainsi les ajuster.
import './styles/global.css';
import { App } from './App';

createRoot(document.getElementById('racine')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
