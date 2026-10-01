// The people directory over RTK Query. `enhanceEndpoints({ addTagTypes })` declares this feature's tag type HERE,
// not in the shared apiSlice: a feature extends the one api slice without the slice knowing about it.

import { apiSlice } from '@/shared/api/apiSlice';
import { isArrayOf, isUserSummary } from '@/shared/domain/guards';
import type { UserSummary } from '@/shared/domain/types';

export const usersApi = apiSlice.enhanceEndpoints({ addTagTypes: ['User'] }).injectEndpoints({
  endpoints: (build) => ({
    /**
     * The people picker's search. Used through useLazySearchUsersQuery: nothing is requested until the user types
     * (a LAZY query returns a trigger function instead of fetching on mount).
     */
    searchUsers: build.query<UserSummary[], string>({
      query: (q) => ({ url: '/users', params: { q }, validate: isArrayOf(isUserSummary) }),
      providesTags: (result) => result?.map(({ id }) => ({ type: 'User' as const, id })) ?? [],
      keepUnusedDataFor: 30,
    }),
  }),
});

export const { useLazySearchUsersQuery } = usersApi;
