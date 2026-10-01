import { createAsyncThunk } from '@reduxjs/toolkit';

import type { RootState } from '@/app/rootReducer';
import type { ThunkExtra } from '@/app/thunk-types';

import { toApiErrorPayload } from '@/shared/api/api-error';
import type { ApiErrorPayload } from '@/shared/api/api-error';
import type { UserSummary } from '@/shared/domain/types';

/**
 * createAsyncThunk (20.08) with every option it has:
 *   - the payload creator gets { extra, signal, rejectWithValue }: the API comes from `extra` (injected, testable),
 *     `signal` aborts the HTTP request when the thunk's promise is aborted (`promise.abort()`)
 *   - `rejectWithValue(payload)`: a failure becomes a TYPED, serialisable action payload, not a raw Error
 *   - `condition`: runs BEFORE anything is dispatched; returning false cancels the thunk (no pending action at all).
 *     Here: nothing to do when every id is already known or already being fetched.
 * The generic arguments type the three lifecycle actions: <Returned, Arg, ThunkApiConfig>.
 */
export const fetchMissingUsers = createAsyncThunk<
  UserSummary[],
  readonly number[],
  { state: RootState; extra: ThunkExtra; rejectValue: ApiErrorPayload }
>(
  'people/fetchMissingUsers',
  async (ids, { extra, signal, getState, rejectWithValue }) => {
    const missing = unknownIds(getState(), ids);
    try {
      return await extra.api.fetchUsersByIds(missing, signal);
    } catch (error) {
      return rejectWithValue(toApiErrorPayload(error));
    }
  },
  {
    condition: (ids, { getState }) => unknownIds(getState(), ids).length > 0,
  },
);

/** Ids that are neither in the cache nor already requested. */
function unknownIds(state: RootState, ids: readonly number[]): number[] {
  const { entities, requested } = state.people;
  return [...new Set(ids)].filter((id) => entities[id] === undefined && !requested.includes(id));
}
