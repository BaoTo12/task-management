import { configureStore } from '@reduxjs/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTimerMiddleware, selectElapsedSeconds, timerReducer } from '@/features/timeTracking';

import type { TimeEntry } from '@/shared/domain/types';

import { queryFulfilled } from '@tests/helpers/rtk-query-actions';

const running: TimeEntry = {
  id: 7,
  taskId: 3,
  userId: 1,
  startedAt: '2026-10-01T08:00:00.000Z',
  endedAt: null,
  note: '',
  minutes: 0,
};

/**
 * A custom middleware with a timer: vitest's FAKE timers drive setInterval, and the injected clock decides "now".
 * The store has only what the middleware needs (the timer slice): a middleware typed against a slice can be tested
 * in isolation.
 */
describe('timerMiddleware', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup() {
    let now = Date.parse(running.startedAt);
    const store = configureStore({
      reducer: { timer: timerReducer },
      middleware: (getDefault) => getDefault().concat(createTimerMiddleware(1000, () => now)),
    });
    return { store, advance: (ms: number) => { now += ms; vi.advanceTimersByTime(ms); } };
  }

  it('ticks once a second while a timer runs', () => {
    const { store, advance } = setup();
    store.dispatch(queryFulfilled('getRunningTimer', undefined, running));
    advance(3000);
    expect(selectElapsedSeconds(store.getState())).toBe(3);
  });

  it('stops ticking when the timer stops', () => {
    const { store, advance } = setup();
    store.dispatch(queryFulfilled('getRunningTimer', undefined, running));
    advance(2000);
    store.dispatch(queryFulfilled('getRunningTimer', undefined, null));
    expect(vi.getTimerCount()).toBe(0);
  });
});
