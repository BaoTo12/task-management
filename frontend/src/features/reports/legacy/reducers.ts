// HAND-WRITTEN REDUCERS: switch statements, a `default` that returns the SAME state, and IMMUTABLE updates by hand
// (spread copies at every level; no Immer). Then combineReducers from the `redux` package glues them together.

import { combineReducers } from 'redux';
import type { UnknownAction } from 'redux';

import type { IsoDate, LoadStatus, ReportSummary } from '@/shared/domain/types';

import type { ChartMode, ReportsAction } from './actions';
import {
  CHART_MODE_CHANGED,
  FETCH_SUMMARY_FAILURE,
  FETCH_SUMMARY_REQUEST,
  FETCH_SUMMARY_SUCCESS,
  PROJECT_CHANGED,
  RANGE_CHANGED,
  REPORTS_RESET,
} from './actionTypes';

/** The app-wide logout action, by its TYPE string: classic reducers know actions by type, not by creator. */
const LOGGED_OUT = 'auth/loggedOut';

export interface SummaryState {
  data: ReportSummary | null;
  status: LoadStatus;
  error: string | null;
  /** The id of the request whose answer we're waiting for: older answers are ignored ("latest wins"). */
  requestId: string | null;
  /** Epoch ms: for the "is it fresh enough?" check in fetchSummaryIfNeeded. */
  receivedAt: number | null;
  /** The filters the data was loaded with (JSON), so changed filters mean "stale". */
  loadedFor: string | null;
}

export interface FiltersState {
  from: IsoDate | null;
  to: IsoDate | null;
  projectId: number | null;
}

export interface ViewState {
  chartMode: ChartMode;
}

export const initialSummary: SummaryState = { data: null, status: 'idle', error: null, requestId: null, receivedAt: null, loadedFor: null };
export const initialFilters: FiltersState = { from: null, to: null, projectId: null };
const initialView: ViewState = { chartMode: 'bars' };

/** The filters as a stable string key: what the summary was loaded for. */
export const filtersKey = (filters: FiltersState): string =>
  JSON.stringify({ from: filters.from, to: filters.to, projectId: filters.projectId });

/*
 * Every reducer receives EVERY action of the store (other features' too), so the parameter is UnknownAction.
 * One cast to this module's union at the top: inside `switch (action.type)`, each `case` NARROWS `action` to the
 * matching member of the union (a discriminated union), so `action.requestId` etc. are typed.
 */

export function summaryReducer(state: SummaryState = initialSummary, incoming: UnknownAction): SummaryState {
  if (incoming.type === LOGGED_OUT) return initialSummary;
  const action = incoming as ReportsAction;
  switch (action.type) {
    case FETCH_SUMMARY_REQUEST:
      return { ...state, status: 'loading', error: null, requestId: action.requestId };
    case FETCH_SUMMARY_SUCCESS: {
      if (action.requestId !== state.requestId) return state;                // a stale answer: ignore it
      const { from, to, projectId } = action.summary;
      return {
        ...state,
        status: 'succeeded',
        data: action.summary,
        receivedAt: action.receivedAt,
        loadedFor: filtersKey({ from, to, projectId }),
      };
    }
    case FETCH_SUMMARY_FAILURE:
      if (action.requestId !== state.requestId) return state;
      return { ...state, status: 'failed', error: action.error };
    case REPORTS_RESET:
      return initialSummary;
    default:
      return state;                                                           // unknown action: the SAME object
  }
}

export function filtersReducer(state: FiltersState = initialFilters, incoming: UnknownAction): FiltersState {
  if (incoming.type === LOGGED_OUT) return initialFilters;
  const action = incoming as ReportsAction;
  switch (action.type) {
    case RANGE_CHANGED:
      return { ...state, from: action.from, to: action.to };
    case PROJECT_CHANGED:
      return { ...state, projectId: action.projectId };
    case REPORTS_RESET:
      return initialFilters;
    default:
      return state;
  }
}

export function viewReducer(state: ViewState = initialView, incoming: UnknownAction): ViewState {
  const action = incoming as ReportsAction;
  switch (action.type) {
    case CHART_MODE_CHANGED:
      return state.chartMode === action.mode ? state : { ...state, chartMode: action.mode };
    default:
      return state;
  }
}

/**
 * combineReducers: calls each child reducer with ITS slice of the state, and returns a new parent object only when a
 * child returned a new object. state.legacyReports = { summary, filters, view }.
 */
export const legacyReportsReducer = combineReducers({
  summary: summaryReducer,
  filters: filtersReducer,
  view: viewReducer,
});

export type LegacyReportsState = ReturnType<typeof legacyReportsReducer>;

/** Every store that hosts this module puts it under this key (the RTK store and the standalone one). */
export interface ReportsRootState {
  legacyReports: LegacyReportsState;
}
