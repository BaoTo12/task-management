import { describe, expect, it } from 'vitest';

import { fetchSummaryRequest, fetchSummarySuccess, legacyReportsReducer, selectReportsViewModel } from '@/features/reports';
import type { ReportsRootState } from '@/features/reports';

import { report } from '@tests/helpers/report';

function stateWith(summary = report()): ReportsRootState {
  let legacyReports = legacyReportsReducer(undefined, fetchSummaryRequest('r'));
  legacyReports = legacyReportsReducer(legacyReports, fetchSummarySuccess('r', summary, 1));
  return { legacyReports };
}

describe('legacy reports selectors (reselect)', () => {
  it('computes the view model', () => {
    const model = selectReportsViewModel(stateWith());
    expect(model.completionRate).toBeCloseTo(0.75);
    expect(model.busiestDay).toEqual({ date: '2026-09-02', count: 2 });
    expect(model.statusRows.find((row) => row.key === 'DONE')).toMatchObject({ value: 3, share: 1 });
  });

  it('createStructuredSelector returns the SAME object for the same state (so connect skips the render)', () => {
    const state = stateWith();
    expect(selectReportsViewModel(state)).toBe(selectReportsViewModel(state));
  });

  it('…and the same object when an unrelated part of the state changes', () => {
    const state = stateWith();
    const first = selectReportsViewModel(state);
    const unrelated: ReportsRootState = { legacyReports: { ...state.legacyReports } };   // new parent, same children
    expect(selectReportsViewModel(unrelated)).toBe(first);
  });
});
