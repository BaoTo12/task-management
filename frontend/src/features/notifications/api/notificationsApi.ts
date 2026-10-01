// The inbox over RTK Query, with three advanced techniques:
//   1. an INFINITE QUERY (RTK 2.6+): one cache entry holds { pages, pageParams }; fetchNextPage() asks for the page
//      after the last one, using getNextPageParam (our cursor). No hand-written "merge the pages" logic.
//   2. POLLING: useGetUnreadCountQuery(…, { pollingInterval }) refetches the badge count on a timer.
//   3. STREAMING with onCacheEntryAdded: while the unread-count entry is in use, an EventSource receives live
//      notifications and the handler updates the cache directly (updateCachedData) instead of refetching.

import { apiSlice } from '@/shared/api/apiSlice';
import { api } from '@/shared/api/client';
import type { CursorPage } from '@/shared/domain/api-types';
import { isCursorPageOf, isNotification } from '@/shared/domain/guards';
import type { AppNotification } from '@/shared/domain/types';

import { notificationReceived, streamStatusChanged } from '../state/notificationActions';

export interface InboxArg {
  unreadOnly: boolean;
}

/** The pageParam is the cursor ("older than this id"); 0 = from the newest. */
type Cursor = number;

const isUnreadCount = (data: unknown): data is { count: number } =>
  typeof data === 'object' && data !== null && typeof (data as { count?: unknown }).count === 'number';

export const notificationsApi = apiSlice.enhanceEndpoints({ addTagTypes: ['Notification'] }).injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.infiniteQuery<CursorPage<AppNotification>, InboxArg, Cursor>({
      infiniteQueryOptions: {
        initialPageParam: 0,
        // undefined = "no next page": hasNextPage becomes false and fetchNextPage() does nothing.
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        maxPages: 10,                                     // memory bound: older pages are dropped beyond 10
      },
      query: ({ queryArg, pageParam }) => ({
        url: '/notifications',
        params: { unreadOnly: queryArg.unreadOnly, before: pageParam === 0 ? undefined : pageParam, limit: 20 },
        validate: (data) => isCursorPageOf(data, isNotification),
      }),
      providesTags: ['Notification'],
    }),

    getUnreadCount: build.query<number, void>({
      query: () => ({ url: '/notifications/unread-count', validate: isUnreadCount }),
      transformResponse: (data: { count: number }) => data.count,
      providesTags: [{ type: 'Notification', id: 'COUNT' }],
      /**
       * Runs ONCE per cache entry, when it's first subscribed; `cacheEntryRemoved` resolves when the last subscriber
       * is gone (+ keepUnusedDataFor). So the stream lives exactly as long as some component shows the badge.
       */
      async onCacheEntryAdded(_arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }) {
        if (typeof EventSource === 'undefined') return;           // tests (jsdom), old browsers: polling only
        let source: EventSource | undefined;
        try {
          await cacheDataLoaded;                                  // the first count arrived: now listen for changes
          dispatch(streamStatusChanged('connecting'));
          // api.getUri adds the base URL ('/api' in dev, '/taskflow/api' in the WAR). Cookies are sent (same origin).
          source = new EventSource(api.getUri({ url: '/notifications/stream' }), { withCredentials: true });
          source.addEventListener('ready', () => dispatch(streamStatusChanged('open')));
          source.addEventListener('error', () => dispatch(streamStatusChanged('closed')));   // EventSource retries itself
          source.addEventListener('notification', (event) => {
            const notification: unknown = JSON.parse((event as MessageEvent<string>).data);
            if (!isNotification(notification)) return;
            updateCachedData((count) => count + 1);              // Immer draft; a number is replaced by the return value
            dispatch(notificationsApi.util.updateQueryData('getNotifications', { unreadOnly: false }, (draft) => {
              draft.pages[0]?.items.unshift(notification);       // newest first, into the first page
            }));
            dispatch(notificationReceived(notification));
          });
        } catch {
          // cacheDataLoaded rejects if the entry is removed before the first response: nothing to clean up
        }
        await cacheEntryRemoved;
        source?.close();
        dispatch(streamStatusChanged('closed'));
      },
    }),

    /** OPTIMISTIC: the item turns "read" and the badge goes down at once; both undone if the server refuses. */
    markRead: build.mutation<AppNotification, number>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'POST', validate: isNotification }),
      async onQueryStarted(id, { dispatch, getState, queryFulfilled }) {
        const patches = notificationsApi.util
          .selectCachedArgsForQuery(getState(), 'getNotifications')
          .map((arg) =>
            dispatch(notificationsApi.util.updateQueryData('getNotifications', arg, (draft) => {
              for (const page of draft.pages) {
                const item = page.items.find((notification) => notification.id === id);
                if (item && !item.read) item.read = true;
              }
            })),
          );
        patches.push(dispatch(notificationsApi.util.updateQueryData('getUnreadCount', undefined, (count) => Math.max(0, count - 1))));
        try {
          await queryFulfilled;
        } catch {
          for (const patch of patches) patch.undo();
        }
      },
    }),

    markAllRead: build.mutation<{ updated: number }, void>({
      query: () => ({ url: '/notifications/read-all', method: 'POST' }),
      async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
        const patches = notificationsApi.util
          .selectCachedArgsForQuery(getState(), 'getNotifications')
          .map((arg) =>
            dispatch(notificationsApi.util.updateQueryData('getNotifications', arg, (draft) => {
              for (const page of draft.pages) for (const item of page.items) item.read = true;
            })),
          );
        patches.push(dispatch(notificationsApi.util.updateQueryData('getUnreadCount', undefined, () => 0)));
        try {
          await queryFulfilled;
        } catch {
          for (const patch of patches) patch.undo();
        }
      },
      // "unread only" lists are now empty on the server: refetch them.
      invalidatesTags: (_result, error) => (error ? [] : ['Notification']),
    }),
  }),
});

export const {
  useGetNotificationsInfiniteQuery,
  useGetUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
} = notificationsApi;
