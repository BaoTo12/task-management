import { isReportSummary } from '@/shared/domain/guards';
import type { IsoDate, ReportSummary } from '@/shared/domain/types';

import { ApiRequestError } from './api-error';
import { api } from './client';

export interface ReportQuery {
  from?: IsoDate;
  to?: IsoDate;
  projectId?: number;
}

/** GET /api/reports/summary (the legacy reports module's thunk calls this, with its own AbortController). */
export async function fetchReportSummary(query: ReportQuery, signal?: AbortSignal): Promise<ReportSummary> {
  const { data } = await api.get<unknown>('/reports/summary', { params: query, signal });
  if (!isReportSummary(data)) {
    throw new ApiRequestError({ kind: 'unexpected', message: 'The server sent an unexpected response.' });
  }
  return data;
}
