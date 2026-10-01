import type { CursorPage } from '@/shared/domain/api-types';
import { isActivity, isCursorPageOf } from '@/shared/domain/guards';
import type { Activity } from '@/shared/domain/types';

import { ApiRequestError } from './api-error';
import { api } from './client';

export interface ActivityQuery {
  projectId?: number;
  taskId?: number;
  /** The cursor: only entries OLDER than this id. */
  before?: number;
  limit?: number;
}

/** GET /api/activity: the feed the caller may see, newest first. */
export async function fetchActivity(query: ActivityQuery, signal?: AbortSignal): Promise<CursorPage<Activity>> {
  const { data } = await api.get<unknown>('/activity', { params: query, signal });
  if (!isCursorPageOf(data, isActivity)) {
    throw new ApiRequestError({ kind: 'unexpected', message: 'The server sent an unexpected response.' });
  }
  return data;
}
