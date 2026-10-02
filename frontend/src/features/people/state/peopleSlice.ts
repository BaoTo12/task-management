// Everyone the app has met, NORMALISED: { ids, entities } by user id (createEntityAdapter, 21.12).
// Users arrive from many places (the picker's search, an explicit fetch); every source upserts into ONE table, and
// every screen reads names from it by id. A task, a member and a notification only ever store user IDS.

import { createEntityAdapter, createSlice, isAnyOf } from '@reduxjs/toolkit';
import type { EntityState } from '@reduxjs/toolkit';

import type { UserSummary } from '@/shared/domain/types';
import { loggedOut } from '@/shared/session/authActions';

import { usersApi } from '../api/usersApi';
import { fetchMissingUsers } from './userThunks';

export const peopleAdapter = createEntityAdapter<UserSummary>({
  sortComparer: (a, b) => a.displayName.localeCompare(b.displayName),
});

export interface PeopleState extends EntityState<UserSummary, number> {
  /** Ids requested and not answered yet: fetchMissingUsers' `condition` skips them (no duplicate requests). */
  requested: number[];
}

const initialState: PeopleState = peopleAdapter.getInitialState({ requested: [] });

const peopleSlice = createSlice({
  name: 'people',
  initialState,
  reducers: {
    /** Users that came with some other response (e.g. the logged-in user). */
    usersReceived: peopleAdapter.upsertMany,
  },
  extraReducers: (builder) => {
    // ORDER MATTERS in the builder: every addCase first, then addMatcher, then addDefaultCase. RTK throws
    // "`builder.addCase` should only be called before calling `builder.addMatcher`" at store creation otherwise.
    builder
      .addCase(loggedOut, () => initialState)
      // The lifecycle actions createAsyncThunk generates. meta.arg is the argument the thunk was called with.
      .addCase(fetchMissingUsers.pending, (state, action) => {
        state.requested.push(...action.meta.arg.filter((id) => !state.requested.includes(id)));
      })
      .addCase(fetchMissingUsers.fulfilled, (state, action) => {
        peopleAdapter.upsertMany(state, action.payload);
      })
      // isAnyOf: ONE reducer for several actions. Fulfilled or rejected, the ids are no longer "in flight".
      .addMatcher(isAnyOf(fetchMissingUsers.fulfilled, fetchMissingUsers.rejected), (state, action) => {
        state.requested = state.requested.filter((id) => !action.meta.arg.includes(id));
      })
      // RTK Query results feed the same table: a person found by the picker is known everywhere.
      .addMatcher(usersApi.endpoints.searchUsers.matchFulfilled, (state, action) => {
        peopleAdapter.upsertMany(state, action.payload);
      });
  },
});

export const { usersReceived } = peopleSlice.actions;
export const peopleReducer = peopleSlice.reducer;
