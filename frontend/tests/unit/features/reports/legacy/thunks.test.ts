import { describe, expect, it, vi } from 'vitest';

import { changeRange, createLegacyReportsStore, fetchSummaryIfNeeded } from '@/features/reports';

import { report } from '@tests/helpers/report';

/**
 * The hand-written thunks against the STANDALONE store (createStore + applyMiddleware + thunk.withExtraArgument):
 * the fake API goes in as `extra`, exactly like the real one.
 */
describe('legacy reports thunks', () => {
  it('changeRange sets the filters, then fetches with them', async () => {
    const fetchReportSummary = vi.fn().mockResolvedValue(report());
    const store = createLegacyReportsStore({ api: { fetchReportSummary } });
    await store.dispatch(changeRange('2026-09-01', '2026-09-03') as never);
    expect(fetchReportSummary).toHaveBeenCalledWith({ from: '2026-09-01', to: '2026-09-03', projectId: undefined });
    expect(store.getState().legacyReports.summary.status).toBe('succeeded');
  });

  it('fetchSummaryIfNeeded skips a fetch when fresh data for the same filters is there', async () => {
    const fetchReportSummary = vi.fn().mockResolvedValue(report({ from: '2026-09-01', to: '2026-09-03' }));
    const store = createLegacyReportsStore({ api: { fetchReportSummary } });
    await store.dispatch(changeRange('2026-09-01', '2026-09-03') as never);
    await store.dispatch(fetchSummaryIfNeeded() as never);
    expect(fetchReportSummary).toHaveBeenCalledTimes(1);
  });

  it('a failure becomes an error message in the state', async () => {
    const fetchReportSummary = vi.fn().mockRejectedValue(new Error('boom'));
    const store = createLegacyReportsStore({ api: { fetchReportSummary } });
    await store.dispatch(fetchSummaryIfNeeded() as never);
    expect(store.getState().legacyReports.summary).toMatchObject({ status: 'failed', error: 'boom' });
  });
});
