// The RUNNING timer as client state: which entry, since when, and "now" (advanced every second by timerMiddleware).
// The server is the truth (GET /api/timer); this slice MIRRORS it by matching RTK Query's actions, so the header
// widget can tick without asking the server every second.

import { createSlice, isAnyOf } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { IsoDateTime, TimeEntry } from '@/shared/domain/types';
import { loggedOut } from '@/shared/session/authActions';

import { timeApi } from '../api/timeApi';

export interface RunningTimer {
  entryId: number;
  taskId: number;
  startedAt: IsoDateTime;
}

export interface TimerState {
  running: RunningTimer | null;
  /** Epoch milliseconds of the last tick: elapsed = nowMs − startedAt. */
  nowMs: number;
}

const initialState: TimerState = { running: null, nowMs: 0 };

const toRunning = (entry: TimeEntry | null): RunningTimer | null =>
  entry && entry.endedAt === null ? { entryId: entry.id, taskId: entry.taskId, startedAt: entry.startedAt } : null;

const timerSlice = createSlice({
  name: 'timer',
  initialState,
  reducers: {
    /** Dispatched by timerMiddleware once a second while a timer runs. */
    timerTicked(state, action: PayloadAction<number>) {
      state.nowMs = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(timeApi.endpoints.getRunningTimer.matchFulfilled, (state, action) => {
        state.running = toRunning(action.payload);
      })
      .addMatcher(timeApi.endpoints.startTimer.matchFulfilled, (state, action) => {
        state.running = toRunning(action.payload);
      })
      .addMatcher(isAnyOf(timeApi.endpoints.stopTimer.matchFulfilled, loggedOut), (state) => {
        state.running = null;
      });
  },
  selectors: {
    selectRunningTimer: (state) => state.running,
    selectNowMs: (state) => state.nowMs,
  },
});

export const { timerTicked } = timerSlice.actions;
export const { selectRunningTimer, selectNowMs } = timerSlice.selectors;
export const timerReducer = timerSlice.reducer;
