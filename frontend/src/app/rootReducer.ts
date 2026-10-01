import { combineSlices } from '@reduxjs/toolkit';

import { activityReducer } from '@/features/activity';
import { listPrefsReducer } from '@/features/listPrefs';
import { notificationsUiReducer } from '@/features/notifications';
import { peopleReducer } from '@/features/people';
import { legacyReportsReducer } from '@/features/reports';
import { quickFindReducer } from '@/features/search';
import { undoableChecklistDraftReducer } from '@/features/subtasks';
import { timerReducer } from '@/features/timeTracking';
import { uiReducer } from '@/features/ui';

import { apiSlice } from '@/shared/api/apiSlice';

/**
 * Slices that are NOT in the root reducer at start-up: they are injected when their (lazy) code loads.
 * Empty here ON PURPOSE: each lazy feature adds itself by DECLARATION MERGING (06.10), e.g.
 *   declare module '@/app/rootReducer' { interface LazyLoadedSlices extends WithSlice<typeof dashboardSlice> {} }
 * so RootState knows their state as OPTIONAL keys (they may not be injected yet).
 */
// oxlint-disable-next-line typescript/no-empty-object-type -- filled by declaration merging
export interface LazyLoadedSlices {}

/**
 * Each key of the root state is owned by one reducer (15.08). Since S22, SERVER data (tasks, categories)
 * lives in RTK Query's cache under `api`; the slices keep only CLIENT state: preferences, UI, quick find.
 *
 * combineSlices (20.A, RTK 2): like combineReducers, but it takes slices directly (apiSlice brings its own
 * `reducerPath`) and returns a reducer that can GROW: `rootReducer.inject(slice)` / `slice.injectInto(rootReducer)`
 * adds a reducer at runtime. The dashboard's slice is only downloaded with the dashboard chunk (12.09).
 */
export const rootReducer = combineSlices(apiSlice, {
  listPrefs: listPrefsReducer,
  ui: uiReducer,
  quickFind: quickFindReducer,
  // ── Spring Boot era features ─────────────────────────────────────────────────────────────────────────────
  people: peopleReducer,                      // createSlice + createEntityAdapter + createAsyncThunk lifecycle
  activity: activityReducer,                  // buildCreateSlice with the asyncThunk creator
  notificationsUi: notificationsUiReducer,    // createReducer (no slice): actions defined elsewhere
  timer: timerReducer,                        // mirrors RTK Query results via matchers; ticked by timerMiddleware
  checklistDraft: undoableChecklistDraftReducer, // createReducer wrapped by a REDUCER ENHANCER (undo/redo)
  legacyReports: legacyReportsReducer,        // CLASSIC Redux: switch reducers + redux's combineReducers, unchanged
}).withLazyLoadedSlices<LazyLoadedSlices>();

/**
 * Derived from the reducer (06.03): the static keys, plus every lazy slice as an optional key.
 */
export type RootState = ReturnType<typeof rootReducer>;
