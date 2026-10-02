import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { initI18n } from '@/shared/i18n/i18n';

import { App } from './App';
import { AppProviders } from './AppProviders';

// Self-hosted fonts (bundled by Vite, so they work under the WAR's strict CSP): Be Vietnam Pro for text,
// Bricolage Grotesque for headings. Only the weights the design system uses.
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource-variable/bricolage-grotesque';
// The shared design system. Page-level patterns live in it (styles/layout/_page-parts.scss); each feature's own
// styles are CSS Modules next to its components.
import '@styles/main.scss';

// S25: start loading the language (detector) and the 'common' namespace (HTTP) before the first render.
void initI18n();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('#root element missing from index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
