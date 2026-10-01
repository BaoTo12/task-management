// A STORE WITHOUT REDUX TOOLKIT: what configureStore does for you, written out with the redux package's own APIs.
// Used by the reports island in the JSP admin page (src/island/reportsIsland.tsx): a small, independent store.
//
//   createStore(reducer, preloadedState?, enhancer)        the store (Redux 5 names it legacy_createStore, to steer
//                                                          new code towards configureStore; it is NOT deprecated for removal)
//   applyMiddleware(m1, m2, …)                             an ENHANCER that wraps dispatch with the middleware chain
//   compose(f, g, h)(x) = f(g(h(x)))                       combines enhancers (middleware + DevTools)
//   withExtraArgument(extra)                               redux-thunk with an injected `extra` (thunk's 3rd argument)

import { applyMiddleware, combineReducers, compose, legacy_createStore as createStore } from 'redux';
import type { Middleware, StoreEnhancer } from 'redux';
import { withExtraArgument } from 'redux-thunk';

import { fetchReportSummary } from '@/shared/api/reports-api';

import { legacyReportsReducer } from './reducers';
import type { ReportsRootState } from './reducers';
import type { ReportsExtra } from './thunks';

/** The Redux DevTools extension adds this global: a compose that also connects the store to the extension. */
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}

/** A hand-written middleware: logs every action type in development (configureStore adds its own checks instead). */
const actionLogger: Middleware<object, ReportsRootState> = (store) => (next) => (action) => {
  const result = next(action);
  if (import.meta.env.DEV) console.debug('[legacy store]', (action as { type: string }).type, store.getState().legacyReports.summary.status);
  return result;
};

/**
 * The root reducer: this module alone, under the same key as in the RTK store, so the SAME selectors and the SAME
 * connected components work in both stores.
 */
const rootReducer = combineReducers({ legacyReports: legacyReportsReducer });

export function createLegacyReportsStore(extra: ReportsExtra = { api: { fetchReportSummary } }, preloadedState?: Partial<ReportsRootState>) {
  const composeEnhancers = (import.meta.env.DEV && typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;
  const enhancer: StoreEnhancer = composeEnhancers(applyMiddleware(withExtraArgument(extra), actionLogger));
  return createStore(rootReducer, preloadedState as ReportsRootState | undefined, enhancer);
}

export type LegacyReportsStore = ReturnType<typeof createLegacyReportsStore>;
