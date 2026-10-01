// SELECTORS with RESELECT imported directly (RTK re-exports createSelector from it; here we use the library itself):
//   createSelector           memoized derived data
//   createStructuredSelector one selector returning an object of several (the view model for connect)
//   lruMemoize + maxSize     a different memoizer: remembers the last N argument combinations (default since
//                            reselect 5 is weakMapMemoize, which caches by argument identity with no fixed size)

import { createSelector, createStructuredSelector, lruMemoize } from 'reselect';

import { PRIORITIES, TASK_STATUSES } from '@/shared/domain/types';
import type { Priority, TaskStatus } from '@/shared/domain/types';

import type { ReportsRootState } from './reducers';

export const selectLegacyReports = (state: ReportsRootState) => state.legacyReports;
export const selectSummaryState = (state: ReportsRootState) => state.legacyReports.summary;
export const selectSummary = (state: ReportsRootState) => state.legacyReports.summary.data;
export const selectFilters = (state: ReportsRootState) => state.legacyReports.filters;
export const selectChartMode = (state: ReportsRootState) => state.legacyReports.view.chartMode;

/** completed ÷ (completed + open): a fraction, formatted by the view. */
export const selectCompletionRate = createSelector([selectSummary], (summary) => {
  if (!summary) return 0;
  const { completed, open } = summary.totals;
  return completed + open === 0 ? 0 : completed / (completed + open);
});

export interface Row<K extends string> {
  key: K;
  value: number;
  /** 0..1 of the largest value: the bar's length. */
  share: number;
}

function toRows<K extends string>(keys: readonly K[], counts: Record<K, number> | undefined): Row<K>[] {
  const max = Math.max(1, ...keys.map((key) => counts?.[key] ?? 0));
  return keys.map((key) => ({ key, value: counts?.[key] ?? 0, share: (counts?.[key] ?? 0) / max }));
}

export const selectStatusRows = createSelector([selectSummary], (summary): Row<TaskStatus>[] => toRows(TASK_STATUSES, summary?.byStatus));
export const selectPriorityRows = createSelector([selectSummary], (summary): Row<Priority>[] => toRows(PRIORITIES, summary?.byPriority));

/** The day with the most completions. lruMemoize remembering the last 5 summaries (switching filters back and forth). */
export const selectBusiestDay = createSelector(
  [selectSummary],
  (summary) => summary?.completedPerDay.reduce<{ date: string; count: number } | null>(
    (best, day) => (day.count > (best?.count ?? 0) ? day : best),
    null,
  ) ?? null,
  { memoize: lruMemoize, memoizeOptions: { maxSize: 5 } },
);

export const selectDaySeries = createSelector([selectSummary], (summary) => {
  const days = summary?.completedPerDay ?? [];
  const max = Math.max(1, ...days.map((day) => day.count));
  return days.map((day) => ({ ...day, share: day.count / max }));
});

/**
 * The WHOLE view model in one selector: { status, error, totals, … }. connect() calls mapStateToProps after every
 * dispatch; with a structured selector, the returned object is the SAME one unless an input changed, so connect's
 * shallow comparison of props says "no change" and the component doesn't re-render.
 */
export const selectReportsViewModel = createStructuredSelector({
  status: (state: ReportsRootState) => selectSummaryState(state).status,
  error: (state: ReportsRootState) => selectSummaryState(state).error,
  summary: selectSummary,
  filters: selectFilters,
  chartMode: selectChartMode,
  completionRate: selectCompletionRate,
  statusRows: selectStatusRows,
  priorityRows: selectPriorityRows,
  busiestDay: selectBusiestDay,
  daySeries: selectDaySeries,
});

export type ReportsViewModel = ReturnType<typeof selectReportsViewModel>;
