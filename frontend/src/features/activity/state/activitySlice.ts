// The activity feed, as a slice that manages its OWN request lifecycle (compare RTK Query, which would do it for us).
// RTK 2's "slice creators": buildCreateSlice({ creators: { asyncThunk: asyncThunkCreator } }) lets a slice DEFINE an
// async thunk inside `reducers`, with its pending/fulfilled/rejected reducers next to it. One file, one place:
// the thunk, its lifecycle and its state can't drift apart.

import { asyncThunkCreator, buildCreateSlice, createEntityAdapter } from '@reduxjs/toolkit';
import type { EntityState } from '@reduxjs/toolkit';

import type { ThunkExtra } from '@/app/thunk-types';

import { toApiErrorPayload } from '@/shared/api/api-error';
import type { ApiErrorPayload } from '@/shared/api/api-error';
import type { CursorPage } from '@/shared/domain/api-types';
import type { Activity, LoadStatus } from '@/shared/domain/types';
import { loggedOut } from '@/shared/session/authActions';

const createAppSlice = buildCreateSlice({ creators: { asyncThunk: asyncThunkCreator } });

/** Which feed: everything I can see, one project's, or one task's. */
export type FeedScope = { kind: 'all' } | { kind: 'project'; id: number } | { kind: 'task'; id: number };

export const feedKey = (scope: FeedScope): string => (scope.kind === 'all' ? 'all' : `${scope.kind}:${scope.id}`);

/** Newest first: ids are increasing, so sort by id descending. */
export const activityAdapter = createEntityAdapter<Activity>({ sortComparer: (a, b) => b.id - a.id });

export interface FeedState extends EntityState<Activity, number> {
  status: LoadStatus;
  nextCursor: number | null;
  error: string | null;
}

export interface ActivityState {
  feeds: Record<string, FeedState>;
}

const initialState: ActivityState = { feeds: {} };

const emptyFeed = (): FeedState => activityAdapter.getInitialState({ status: 'idle', nextCursor: null, error: null });

export interface LoadActivityArg {
  scope: FeedScope;
  /** true: the next (older) page; false: (re)load from the newest. */
  more?: boolean;
}

/** The thunk's `getState` type is written by hand: RootState would be circular (RootState contains THIS slice). */
type ThunkConfig = { state: { activity: ActivityState }; extra: ThunkExtra; rejectValue: ApiErrorPayload };

const activitySlice = createAppSlice({
  name: 'activity',
  initialState,
  reducers: (create) => ({
    /** A plain reducer in the callback form: create.reducer<Payload>(…). */
    feedCleared: create.reducer<FeedScope>((state, action) => {
      delete state.feeds[feedKey(action.payload)];
    }),

    loadActivity: create.asyncThunk<CursorPage<Activity>, LoadActivityArg, ThunkConfig>(
      async ({ scope, more = false }, { getState, extra, signal, rejectWithValue }) => {
        const feed = getState().activity.feeds[feedKey(scope)];
        try {
          return await extra.api.fetchActivity(
            {
              projectId: scope.kind === 'project' ? scope.id : undefined,
              taskId: scope.kind === 'task' ? scope.id : undefined,
              before: more ? (feed?.nextCursor ?? undefined) : undefined,
              limit: 20,
            },
            signal, // dispatch(loadActivity(…)).abort() cancels the HTTP request (an effect cleanup does)
          );
        } catch (error) {
          return rejectWithValue(toApiErrorPayload(error));
        }
      },
      {
        options: {
          // Don't start a second request for the same feed, and don't ask for "more" when there is no more.
          condition: ({ scope, more }, { getState }) => {
            const feed = getState().activity.feeds[feedKey(scope)];
            if (feed?.status === 'loading') return false;
            return !(more && feed?.nextCursor == null);
          },
        },
        pending: (state, action) => {
          const key = feedKey(action.meta.arg.scope);
          const feed = (state.feeds[key] ??= emptyFeed());
          feed.status = 'loading';
          feed.error = null;
        },
        fulfilled: (state, action) => {
          const feed = (state.feeds[feedKey(action.meta.arg.scope)] ??= emptyFeed());
          if (action.meta.arg.more) activityAdapter.addMany(feed, action.payload.items);
          else activityAdapter.setAll(feed, action.payload.items);
          feed.nextCursor = action.payload.nextCursor;
          feed.status = 'succeeded';
        },
        rejected: (state, action) => {
          const feed = state.feeds[feedKey(action.meta.arg.scope)];
          if (!feed) return;
          if (action.meta.aborted) {
            feed.status = 'idle';                             // the component unmounted: not an error
            return;
          }
          feed.status = 'failed';
          feed.error = action.payload?.message ?? action.error.message ?? 'Unexpected error';
        },
      },
    ),
  }),
  extraReducers: (builder) => {
    builder.addCase(loggedOut, () => initialState);
  },
  selectors: {
    selectFeed: (state, scope: FeedScope): FeedState | undefined => state.feeds[feedKey(scope)],
  },
});

export const { feedCleared, loadActivity } = activitySlice.actions;
export const { selectFeed } = activitySlice.selectors;
export const activityReducer = activitySlice.reducer;
export { activitySlice };
