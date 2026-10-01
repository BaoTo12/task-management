// The legacy reports module as an ISLAND in the JSP page /taskflow/admin/reports, with its OWN classic store
// (createStore + applyMiddleware + compose: features/reports/legacy/standaloneStore.ts), not the app's RTK store.
// Same connected component as the SPA's /reports: connect() only needs SOME Redux store with state.legacyReports.

import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import { createLegacyReportsStore, ReportsContainer } from '@/features/reports';

import { initI18n } from '@/shared/i18n/i18n';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';

const root = document.getElementById('reports-root');
if (root !== null) {
  const store = createLegacyReportsStore();
  void initI18n();
  createRoot(root).render(
    <StrictMode>
      <Provider store={store}>
        <ThemeProvider>
          <Suspense fallback={<p className="text-muted">…</p>}>
            <ReportsContainer />
          </Suspense>
        </ThemeProvider>
      </Provider>
    </StrictMode>,
  );
}
