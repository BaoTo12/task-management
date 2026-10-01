import { describe, expect, it } from 'vitest';

import {
  chartModeChanged,
  fetchSummaryRequest,
  fetchSummarySuccess,
  legacyReportsReducer,
  rangeChanged,
  summaryReducer,
} from '@/features/reports';

import { deepFreeze } from '@tests/helpers/deep-freeze';
import { report } from '@tests/helpers/report';

/** Classic reducers are plain functions: call them, compare. deepFreeze proves nothing is mutated in place. */
describe('legacy reports reducers', () => {
  const initial = legacyReportsReducer(undefined, { type: '@@INIT' });

  it('returns the SAME state for an unknown action', () => {
    expect(legacyReportsReducer(initial, { type: 'someone/else' })).toBe(initial);
  });

  it('updates immutably', () => {
    const frozen = deepFreeze(initial);
    const next = legacyReportsReducer(frozen, rangeChanged('2026-09-01', '2026-09-30'));
    expect(next.filters).toEqual({ from: '2026-09-01', to: '2026-09-30', projectId: null });
    expect(next.view).toBe(frozen.view); // untouched branches keep their reference (combineReducers)
  });

  it('keeps only the LATEST request’s answer', () => {
    let state = summaryReducer(undefined, fetchSummaryRequest('a'));
    state = summaryReducer(state, fetchSummaryRequest('b'));
    const stale = summaryReducer(state, fetchSummarySuccess('a', report(), 1));
    expect(stale).toBe(state);
    const fresh = summaryReducer(state, fetchSummarySuccess('b', report(), 2));
    expect(fresh.status).toBe('succeeded');
    expect(fresh.receivedAt).toBe(2);
  });

  it('switching to the same chart mode changes nothing', () => {
    const state = legacyReportsReducer(initial, chartModeChanged('bars'));
    expect(state).toBe(initial);
  });

  it('resets on the app-wide logout action, by its type string', () => {
    const loaded = legacyReportsReducer(initial, rangeChanged('2026-09-01', '2026-09-30'));
    expect(legacyReportsReducer(loaded, { type: 'auth/loggedOut' }).filters.from).toBeNull();
  });
});
