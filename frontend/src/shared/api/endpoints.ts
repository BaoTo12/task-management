// The whole API layer as one module: this is what thunks and listeners receive as `extra.api` (18.04).
// RTK Query endpoints (apiSlice + injectEndpoints) cover most server data; these plain functions serve the code that
// manages its own request lifecycle: createAsyncThunk (people, activity) and the classic-Redux reports module.
export * from './tasks-api';
export * from './users-api';
export * from './activity-api';
export * from './reports-api';
