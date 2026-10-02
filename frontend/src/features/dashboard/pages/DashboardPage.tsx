import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { LIST_QUERY } from '@/features/tasks';

import { useGetTasksQuery } from '@/shared/api/apiSlice';
import { useToday } from '@/shared/hooks/useToday';
import { LoadingBlock, Spinner } from '@/shared/ui/styled/Spinner';

import { CompletionWidget, OverdueWidget, PriorityWidget, StatusWidget } from '../components/DashboardWidgets';
import { selectHiddenWidgets, WIDGET_IDS, widgetToggled } from '../state/dashboardSlice';
import type { WidgetId } from '../state/dashboardSlice';

import { Customize, WidgetGrid } from './DashboardPage.styles';

/** How often the dashboard re-asks the server while it is open (other people change tasks too). */
const POLL_MS = 60_000;

/**
 * Loaded lazily (12.09). The page subscribes to one flag; each widget selects its own data (21.17),
 * so an action that doesn't change the tasks re-renders nothing here.
 */
export function DashboardPage() {
  // Only the FLAG: `isLoading` changes once. Selecting `data` here would re-render the page (and all
  // widgets) whenever any task changes; the widgets select what they need themselves (21.17).
  const { isLoading } = useGetTasksQuery(LIST_QUERY, {
    selectFromResult: ({ isLoading }) => ({ isLoading }),
    // 22.06 polling: a live dashboard. Every POLL_MS the entry refetches while this page is mounted;
    // skipPollingIfUnfocused pauses it in a background tab (refetchOnFocus catches up when you come back).
    pollingInterval: POLL_MS,
    skipPollingIfUnfocused: true,
  });
  const hidden = useAppSelector(selectHiddenWidgets); // from the LAZY slice this chunk injected
  const dispatch = useAppDispatch();
  const today = useToday();
  const { t } = useTranslation(['dashboard', 'common']);

  if (isLoading) {
    return (
      <LoadingBlock>
        <Spinner aria-label={t('common:loading')} />
        {t('common:loading')}
      </LoadingBlock>
    );
  }

  const widgets: Record<WidgetId, ReactElement> = {
    completion: <CompletionWidget />,
    status: <StatusWidget />,
    priority: <PriorityWidget />,
    overdue: <OverdueWidget today={today} />,
  };

  return (
    <>
      <h1 className="page__title">{t('title')}</h1>
      <Customize>
        <legend>{t('customize')}</legend>
        {WIDGET_IDS.map((id) => (
          <label key={id}>
            <input type="checkbox" checked={!hidden.includes(id)} onChange={() => dispatch(widgetToggled(id))} />{' '}
            {t(`widgets.${id}`)}
          </label>
        ))}
      </Customize>
      <WidgetGrid>
        {WIDGET_IDS.filter((id) => !hidden.includes(id)).map((id) => (
          <div key={id}>{widgets[id]}</div>
        ))}
      </WidgetGrid>
    </>
  );
}
