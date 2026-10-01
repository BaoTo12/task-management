// A CUSTOM MIDDLEWARE (16.x): `store => next => action => …`, the Redux extension point every other middleware uses
// (thunk, the listener middleware, RTK Query's). This one owns a SIDE EFFECT that must live outside reducers and
// components: a setInterval that dispatches `timerTicked(Date.now())` every second while a timer runs.
//
// Why a middleware and not a component effect: the interval follows the STATE (a timer runs, whichever page is open),
// not a component's lifetime; and there must be exactly ONE, however many widgets show the timer.

import type { Middleware } from '@reduxjs/toolkit';

import type { TimerState } from './timerSlice';
import { timerTicked } from './timerSlice';

/**
 * Typed against the slice it needs, not the whole RootState: Middleware<ExtraDispatch, StateShape>.
 * A factory: each store (tests make many) gets its own interval handle in its own closure.
 */
export function createTimerMiddleware(tickMs = 1000, now: () => number = Date.now): Middleware<object, { timer: TimerState }> {
  return (store) => {
    let interval: ReturnType<typeof setInterval> | null = null;

    return (next) => (action) => {
      const result = next(action);                       // let the reducers run FIRST, then look at the new state
      const running = store.getState().timer.running !== null;
      if (running && interval === null) {
        store.dispatch(timerTicked(now()));              // tick at once: no "0:00:00" flash for a second
        interval = setInterval(() => store.dispatch(timerTicked(now())), tickMs);
      } else if (!running && interval !== null) {
        clearInterval(interval);
        interval = null;
      }
      return result;
    };
  };
}
