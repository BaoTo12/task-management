import { useTranslation } from 'react-i18next';
import { shallowEqual } from 'react-redux';

import { useAppSelector, useAppStore } from '@/app/hooks';

import { Button } from '@/shared/ui/Button';

import { selectFilters, selectSummary } from '../legacy/selectors';

/**
 * The HOOKS side of react-redux, next to the connect() container:
 *
 *   useAppSelector(selector, shallowEqual)  the selector here builds a NEW object every call ({ from, to });
 *                                           the default === comparison would re-render on every dispatch.
 *                                           shallowEqual compares the object's fields instead.
 *   useAppStore()                           the store itself, WITHOUT subscribing: read the state at the moment
 *                                           of an event (the export click), not on every change. Reading
 *                                           store.getState() during RENDER would be a bug: nothing re-renders.
 */
export function ReportsToolbar() {
  const { t } = useTranslation('reports');
  const store = useAppStore();
  const range = useAppSelector((state) => ({ from: selectFilters(state).from, to: selectFilters(state).to }), shallowEqual);

  function exportCsv() {
    const summary = selectSummary(store.getState());                 // the CURRENT data, read on click
    if (!summary) return;
    const lines = ['date,completed', ...summary.completedPerDay.map((day) => `${day.date},${day.count}`)];
    const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/csv' }));
    const link = Object.assign(document.createElement('a'), { href: url, download: `report-${summary.from}-${summary.to}.csv` });
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <p className="text-muted">
      {range.from && range.to ? t('range', range) : t('defaultRange')}{' '}
      <Button size="sm" onClick={exportCsv}>
        {t('export')}
      </Button>
    </p>
  );
}
