import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { initI18n } from '@/shared/i18n/i18n';

import { App } from './App';
import { AppProviders } from './AppProviders';

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
