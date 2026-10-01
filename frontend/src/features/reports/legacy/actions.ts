// HAND-WRITTEN ACTION CREATORS: plain functions returning plain objects, and a DISCRIMINATED UNION of every action
// this module handles. In a reducer's switch, TypeScript narrows `action` by its `type` field.

import type { IsoDate, ReportSummary } from '@/shared/domain/types';

import {
  CHART_MODE_CHANGED,
  FETCH_SUMMARY_FAILURE,
  FETCH_SUMMARY_REQUEST,
  FETCH_SUMMARY_SUCCESS,
  PROJECT_CHANGED,
  RANGE_CHANGED,
  REPORTS_RESET,
} from './actionTypes';

export type ChartMode = 'bars' | 'table';

export const fetchSummaryRequest = (requestId: string) => ({ type: FETCH_SUMMARY_REQUEST, requestId });

export const fetchSummarySuccess = (requestId: string, summary: ReportSummary, receivedAt: number) => ({
  type: FETCH_SUMMARY_SUCCESS,
  requestId,
  summary,
  receivedAt,
});

export const fetchSummaryFailure = (requestId: string, error: string) => ({ type: FETCH_SUMMARY_FAILURE, requestId, error });

export const rangeChanged = (from: IsoDate, to: IsoDate) => ({ type: RANGE_CHANGED, from, to });

export const projectChanged = (projectId: number | null) => ({ type: PROJECT_CHANGED, projectId });

export const chartModeChanged = (mode: ChartMode) => ({ type: CHART_MODE_CHANGED, mode });

export const reportsReset = () => ({ type: REPORTS_RESET });

/** Every action of this module: ReturnType of each creator, so the union can't drift from the creators. */
export type ReportsAction =
  | ReturnType<typeof fetchSummaryRequest>
  | ReturnType<typeof fetchSummarySuccess>
  | ReturnType<typeof fetchSummaryFailure>
  | ReturnType<typeof rangeChanged>
  | ReturnType<typeof projectChanged>
  | ReturnType<typeof chartModeChanged>
  | ReturnType<typeof reportsReset>;
