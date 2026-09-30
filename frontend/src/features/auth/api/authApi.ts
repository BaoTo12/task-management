// S24 (24.12): real session-cookie authentication against the API, as RTK Query endpoints.
// The session id itself is an HttpOnly cookie: this code never sees it (24.07). It only asks "who am I?".

import { apiSlice, TASK_LIST } from '@/shared/api/apiSlice';
import { announce, listen } from '@/shared/api/cross-tab';
import { isUser } from '@/shared/domain/guards';
import type { User } from '@/shared/domain/types';

import { clearUserData } from '../state/clearUserData';

export interface Credentials {
  username: string;
  password: string;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    /**
     * GET /auth/me → the user, or `null` when not logged in. A 401 here is an ANSWER ("nobody"), not an error,
     * so a `queryFn` turns it into data. Other failures (network, 500) stay errors.
     */
    getMe: build.query<User | null, void>({
      async queryFn(_arg, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({ url: '/auth/me', validate: isUser });
        if (result.error) return result.error.status === 401 ? { data: null } : { error: result.error };
        return { data: result.data as User }; // validated by `isUser` in the base query (22.03)
      },
      /**
       * 23 streaming updates: onCacheEntryAdded runs ONCE when this cache entry is created and lives until it is
       * removed. getMe is subscribed by AuthProvider for the app's whole life, so this is where the tab listens
       * to its sibling tabs. The pattern: wait for the first data, subscribe, then clean up on removal.
       */
      async onCacheEntryAdded(_arg, { cacheDataLoaded, cacheEntryRemoved, dispatch, updateCachedData }) {
        try {
          await cacheDataLoaded; // no point listening before we know who we are
        } catch {
          return; // the entry was removed before its first data arrived
        }
        const stop = listen((message) => {
          switch (message.type) {
            case 'taskChanged':
              // Exactly this task's entries plus list membership (23.01), not the whole cache.
              dispatch(apiSlice.util.invalidateTags([{ type: 'Task', id: message.taskId }, TASK_LIST]));
              break;
            case 'tasksChanged':
              dispatch(apiSlice.util.invalidateTags(['Task']));
              break;
            case 'loggedOut':
              // Another tab logged out: the server session is gone for THIS tab too (same cookie).
              dispatch(clearUserData());
              updateCachedData(() => null); // "me" is nobody now; RequireAuth redirects to /login
              break;
            default:
              message satisfies never;
          }
        });
        await cacheEntryRemoved; // resolves when the entry leaves the cache (resetApiState, unsubscribe + timeout)
        stop();
      },
    }),
    /** PESSIMISTIC (23.06): on success, the answer IS the new "me". */
    login: build.mutation<User, Credentials>({
      query: (credentials) => ({ url: '/auth/login', method: 'POST', data: credentials, validate: isUser }),
      async onQueryStarted(_credentials, { dispatch, queryFulfilled }) {
        try {
          const { data: user } = await queryFulfilled;
          dispatch(authApi.util.upsertQueryData('getMe', undefined, user));
        } catch {
          // LoginPage shows the error.
        }
      },
    }),
    /** Ends the SERVER session, then forgets everything locally, even if the request failed (offline). */
    logout: build.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      transformResponse: () => undefined,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled.catch(() => undefined);
        announce({ type: 'loggedOut' }); // the other open tabs log out too (onCacheEntryAdded above)
        dispatch(clearUserData());
        dispatch(authApi.util.upsertQueryData('getMe', undefined, null));
      },
    }),
  }),
});

export const { useGetMeQuery, useLoginMutation, useLogoutMutation } = authApi;
