// HAND-WRITTEN THUNKS (redux-thunk): a function that returns a function (dispatch, getState, extra) => …
// Everything createAsyncThunk generates is written out here: the request/success/failure actions, the request id,
// the error handling, the "is a fetch even needed?" check.

import type { UnknownAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import type { fetchReportSummary } from '@/shared/api/reports-api';
import { toErrorMessage } from '@/shared/domain/guards';
import type { IsoDate } from '@/shared/domain/types';

import { fetchSummaryFailure, fetchSummaryRequest, fetchSummarySuccess, projectChanged, rangeChanged } from './actions';
import { filtersKey } from './reducers';
import type { ReportsRootState } from './reducers';

/** What this module needs from `extra`: only the one API function (the RTK store's extra.api has it, so does the standalone store's). */
export interface ReportsExtra {
  api: { fetchReportSummary: typeof fetchReportSummary };
}

/** ThunkAction<ReturnType, State, ExtraArgument, BasicAction>. */
export type ReportsThunk<R = void> = ThunkAction<R, ReportsRootState, ReportsExtra, UnknownAction>;

/** Data younger than this, for the same filters, is not fetched again. */
export const FRESH_FOR_MS = 30_000;

let sequence = 0;

/** Always fetches. Overlapping calls: each has an id; the reducer keeps only the LATEST answer. */
export const fetchSummary =
  (): ReportsThunk<Promise<void>> =>
  async (dispatch, getState, { api }) => {
    const requestId = `${Date.now()}-${++sequence}`;
    dispatch(fetchSummaryRequest(requestId));
    const { from, to, projectId } = getState().legacyReports.filters;
    try {
      const summary = await api.fetchReportSummary({ from: from ?? undefined, to: to ?? undefined, projectId: projectId ?? undefined });
      dispatch(fetchSummarySuccess(requestId, summary, Date.now()));
    } catch (error) {
      dispatch(fetchSummaryFailure(requestId, toErrorMessage(error)));
    }
  };

/** A thunk can decide NOT to do anything: here, when fresh data for the same filters is already there. */
export const fetchSummaryIfNeeded =
  (): ReportsThunk<Promise<void>> =>
  (dispatch, getState) => {
    const { summary, filters } = getState().legacyReports;
    const fresh = summary.receivedAt !== null && Date.now() - summary.receivedAt < FRESH_FOR_MS;
    if (summary.status === 'loading' || (fresh && summary.loadedFor === filtersKey(filters))) return Promise.resolve();
    return dispatch(fetchSummary());
  };

/** Thunks COMPOSE: change a filter, then reuse the fetch thunk. */
export const changeRange =
  (from: IsoDate, to: IsoDate): ReportsThunk<Promise<void>> =>
  (dispatch) => {
    dispatch(rangeChanged(from, to));
    return dispatch(fetchSummary());
  };

export const changeProject =
  (projectId: number | null): ReportsThunk<Promise<void>> =>
  (dispatch) => {
    dispatch(projectChanged(projectId));
    return dispatch(fetchSummary());
  };
