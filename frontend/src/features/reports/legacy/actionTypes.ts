// ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// │ LEGACY MODULE: classic Redux, the way most code written before Redux Toolkit (2019) looks. It is kept on      │
// │ purpose: real projects contain code like this, and you must be able to read it, extend it and migrate it.     │
// │ It runs INSIDE the RTK store (state.legacyReports) and also in its own createStore() store (standaloneStore).  │
// │ MIGRATION.md (next to this file) shows the same module rewritten with RTK, step by step.                       │
// └───────────────────────────────────────────────────────────────────────────────────────────────────────────┘
//
// ACTION TYPE CONSTANTS: one string per event, "domain/EVENT". Constants instead of string literals everywhere so a
// typo is a compile error (and so reducers and action creators agree). `as const` keeps the literal TYPE
// ('reports/FETCH_SUMMARY_REQUEST', not string) for the discriminated union in actions.ts.
// RTK's createAction / createSlice generate these for you.

export const FETCH_SUMMARY_REQUEST = 'reports/FETCH_SUMMARY_REQUEST' as const;
export const FETCH_SUMMARY_SUCCESS = 'reports/FETCH_SUMMARY_SUCCESS' as const;
export const FETCH_SUMMARY_FAILURE = 'reports/FETCH_SUMMARY_FAILURE' as const;
export const RANGE_CHANGED = 'reports/RANGE_CHANGED' as const;
export const PROJECT_CHANGED = 'reports/PROJECT_CHANGED' as const;
export const CHART_MODE_CHANGED = 'reports/CHART_MODE_CHANGED' as const;
export const REPORTS_RESET = 'reports/REPORTS_RESET' as const;
