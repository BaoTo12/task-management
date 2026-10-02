import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { readListPrefsCookie } from '@/features/listPrefs';
import { createTimerMiddleware } from '@/features/timeTracking';
import { apiSlice } from '@/shared/api/apiSlice';
import * as taskflowApi from '@/shared/api/endpoints';
import { createAppListenerMiddleware } from './listeners';
import { createAnalyticsMiddleware } from './middleware/analytics';
import { createCrashReporter } from './middleware/crash-reporter';
import { createLoggerMiddleware } from './middleware/logger';
import { defaultMiddlewareNames, readTraceSetting, traceChain } from './middleware/trace';
import { rootReducer } from './rootReducer';
import type { RootState } from './rootReducer';
import type { ThunkExtra } from './thunk-types';

/** A fresh extra argument per store: the real API unless a test overrides parts of it (18.13). */
function buildExtra(overrides: Partial<ThunkExtra> = {}): ThunkExtra {
  return {
    api: taskflowApi,
    ...overrides,
  };
}

/** A factory, so tests can create fresh stores (optionally with preloaded state and a fake API). */
export function makeStore(preloadedState?: Partial<RootState>, extraOverrides?: Partial<ThunkExtra>) {
  const extra = buildExtra(extraOverrides);
  const crashReporter = createCrashReporter((crash) => console.error('[crash]', crash.actionType, crash)); // S27: a real endpoint
  const analytics = createAnalyticsMiddleware((event) => console.info('[analytics]', event)); // placeholder sink
  const listeners = createAppListenerMiddleware(extra); // reactive logic, 21.14
  const timer = createTimerMiddleware(); // a hand-written middleware: ticks while a timer runs

  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) => {
      const defaults = getDefaultMiddleware({ thunk: { extraArgument: extra } });
      const chain = defaults
        .prepend(crashReporter, listeners.middleware) // crash reporter first: wraps all
        .concat(apiSlice.middleware, timer); // RTK Query: runs the requests, counts subscriptions, refetches (22.04)
      if (!import.meta.env.DEV) return chain.concat(analytics);

      const devChain = chain.concat(createLoggerMiddleware(), analytics);
      // Learning aid, OFF by default: localStorage.setItem('traceRedux', 'all') + reload → every dispatch's trip
      // through this chain is printed in the console (middleware/trace.ts). The names follow the order above.
      const trace = readTraceSetting();
      if (trace) {
        traceChain(devChain, [
          'crashReporter',
          'listenerMiddleware',
          ...defaultMiddlewareNames(defaults.length),
          'apiSlice.middleware',
          'timer',
          'logger',
          'analytics',
        ], trace);
      }
      return devChain;
    }
  });
}

/** State restored from cookies at start-up (24.06): only what's there AND valid. */
function restoredState(): Partial<RootState> {
  const listPrefs = readListPrefsCookie();
  return listPrefs ? { listPrefs } : {};
}

export const store = makeStore(restoredState());

// 22.06: window 'focus' / 'online' events → RTK Query actions, which trigger refetchOnFocus / refetchOnReconnect
// (enabled in apiSlice). Only for the app's real store: test stores (makeStore) don't need browser events.
// Returns an unsubscribe function; the app never tears its store down, so it's ignored.
setupListeners(store.dispatch);

// Inferred, not declared (compare 18.08): configureStore knows what the middleware add to dispatch.
export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
