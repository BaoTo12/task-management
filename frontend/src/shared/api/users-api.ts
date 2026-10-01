import { isArrayOf, isUserSummary } from '@/shared/domain/guards';
import type { UserSummary } from '@/shared/domain/types';

import { ApiRequestError } from './api-error';
import { api } from './client';

/** GET /api/users?ids=1,4,5: exactly these people (ids the app found in tasks, members, notifications). */
export async function fetchUsersByIds(ids: readonly number[], signal?: AbortSignal): Promise<UserSummary[]> {
  // `paramsSerializer` isn't needed: Axios writes arrays as ids[]=1&ids[]=4 by default, Spring wants ids=1,4.
  const { data } = await api.get<unknown>('/users', { params: { ids: ids.join(',') }, signal });
  if (!isArrayOf(isUserSummary)(data)) {
    throw new ApiRequestError({ kind: 'unexpected', message: 'The server sent an unexpected response.' });
  }
  return data;
}
