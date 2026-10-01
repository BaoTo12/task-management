import { useTranslation } from 'react-i18next';

import { ReportsContainer } from '../components/ReportsContainer';
import { ReportsToolbar } from '../components/ReportsToolbar';

/**
 * /reports in the SPA. The legacy module runs INSIDE the app's RTK store here (state.legacyReports, mounted in
 * app/rootReducer.ts): connect() and the hand-written thunks work unchanged, because configureStore's store IS a
 * Redux store, with redux-thunk in its default middleware.
 */
export function ReportsPage() {
  const { t } = useTranslation('reports');
  return (
    <section>
      <h1 className="page__title">{t('title')}</h1>
      <ReportsToolbar />
      <ReportsContainer />
    </section>
  );
}
