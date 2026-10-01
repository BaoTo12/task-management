import { createSelector } from '@reduxjs/toolkit';

import { elapsedSeconds } from '../model/duration';
import { selectNowMs, selectRunningTimer } from './timerSlice';

/** Recomputed once per tick (nowMs changes), shared by every component that shows the stopwatch. */
export const selectElapsedSeconds = createSelector([selectRunningTimer, selectNowMs], (running, nowMs) =>
  running === null || nowMs === 0 ? 0 : elapsedSeconds(running.startedAt, nowMs),
);
