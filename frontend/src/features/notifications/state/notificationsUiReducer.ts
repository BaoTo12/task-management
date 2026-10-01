// Client-side notification state with createReducer (20.06): the reducer WITHOUT createSlice. Useful when the
// actions already exist elsewhere (here: notificationActions.ts, shared with the API), so there is nothing for
// createSlice to generate. The builder API is the same as createSlice's extraReducers; Immer is the same too.

import { createReducer } from '@reduxjs/toolkit';

import type { NotificationType } from '@/shared/domain/types';
import { loggedOut } from '@/shared/session/authActions';

import { notificationReceived, panelToggled, streamStatusChanged, typeMuteToggled } from './notificationActions';

export interface NotificationsUiState {
  panelOpen: boolean;
  mutedTypes: NotificationType[];
  stream: 'connecting' | 'open' | 'closed';
  /** The newest live notification: the bell animates when it changes. */
  lastLiveId: number | null;
}

export const initialNotificationsUiState: NotificationsUiState = {
  panelOpen: false,
  mutedTypes: [],
  stream: 'closed',
  lastLiveId: null,
};

export const notificationsUiReducer = createReducer(initialNotificationsUiState, (builder) => {
  builder
    .addCase(panelToggled, (state, action) => {
      state.panelOpen = action.payload ?? !state.panelOpen;
    })
    .addCase(typeMuteToggled, (state, action) => {
      const index = state.mutedTypes.indexOf(action.payload);
      if (index === -1) state.mutedTypes.push(action.payload);
      else state.mutedTypes.splice(index, 1);
    })
    .addCase(streamStatusChanged, (state, action) => {
      state.stream = action.payload;
    })
    .addCase(notificationReceived, (state, action) => {
      state.lastLiveId = action.payload.id;
    })
    // Device preferences (mutedTypes) are about the BROWSER, but a different user may log in next: reset all.
    .addCase(loggedOut, () => initialNotificationsUiState);
});
