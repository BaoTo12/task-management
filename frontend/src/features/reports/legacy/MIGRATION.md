# Migrating the legacy reports module to Redux Toolkit

`features/reports/legacy/` is written the way Redux code looked before Redux Toolkit: action-type constants,
hand-written action creators, switch reducers with spread copies, `combineReducers`, hand-written thunks,
`connect` + `bindActionCreators`, reselect, and a store built with `createStore` + `applyMiddleware` + `compose`.
It works, inside the RTK store and in its own store. This file shows how to migrate it **incrementally**, one step
per commit, with the app working after every step. That's how real legacy code gets migrated.

## Step 0: it already runs in the RTK store

`configureStore` builds a normal Redux store, and its default middleware includes redux-thunk. So
`rootReducer` mounts the classic reducer as is (`legacyReports: legacyReportsReducer` in `app/rootReducer.ts`), and
`connect` and the hand-written thunks keep working. **Nothing has to be rewritten before the app moves to RTK.**

## Step 1: one slice replaces actionTypes + actions + reducers

```ts
const reportsSlice = createSlice({
  name: 'reports',
  initialState: { filters: initialFilters, view: { chartMode: 'bars' as ChartMode } },
  reducers: {
    rangeChanged: {
      reducer(state, action: PayloadAction<{ from: IsoDate; to: IsoDate }>) {
        state.filters.from = action.payload.from;          // Immer: "mutate" the draft
        state.filters.to = action.payload.to;
      },
      prepare: (from: IsoDate, to: IsoDate) => ({ payload: { from, to } }),   // keeps the old call signature
    },
    projectChanged(state, action: PayloadAction<number | null>) {
      state.filters.projectId = action.payload;
    },
    chartModeChanged(state, action: PayloadAction<ChartMode>) {
      state.view.chartMode = action.payload;
    },
  },
  extraReducers: (builder) => builder.addCase(loggedOut, () => initialState),
});
```

**What you gain:** the type strings are generated, the action creators are typed, and immutable updates are written
as mutations. **Watch out:** the action TYPES change (`reports/RANGE_CHANGED` becomes `reports/rangeChanged`).
Anything that matches the old strings (other reducers, analytics, tests) must change in the same commit.

## Step 2: createAsyncThunk replaces the request/success/failure trio

```ts
export const fetchSummary = createAsyncThunk<ReportSummary, void, { state: RootState; extra: ThunkExtra }>(
  'reports/fetchSummary',
  (_arg, { getState, extra, signal }) => {
    const { from, to, projectId } = getState().reports.filters;
    return extra.api.fetchReportSummary({ from: from ?? undefined, to: to ?? undefined, projectId: projectId ?? undefined }, signal);
  },
  { condition: (_arg, { getState }) => getState().reports.summary.status !== 'loading' },
);
```

The hand-made `requestId` disappears: every createAsyncThunk call has `meta.requestId`, and `signal` can cancel a
superseded request. `fetchSummaryIfNeeded` becomes the `condition` option.

## Step 3: RTK Query replaces the whole summary state

The summary is SERVER data: caching, freshness ("is it older than 30 s?"), loading flags and de-duplication are
exactly what RTK Query does. Then the slice keeps only CLIENT state (filters, chart mode):

```ts
const reportsApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getReportSummary: build.query<ReportSummary, ReportQuery>({
      query: (params) => ({ url: '/reports/summary', params, validate: isReportSummary }),
      keepUnusedDataFor: 30,            // the old FRESH_FOR_MS
    }),
  }),
});
// in the component:
const filters = useAppSelector(selectFilters);
const { data, isFetching, error } = useGetReportSummaryQuery(toQuery(filters));
```

`summaryReducer`, `thunks.ts` and the `loadedFor` bookkeeping are deleted.

## Step 4: hooks replace connect

```tsx
export function ReportsScreen() {
  const viewModel = useAppSelector(selectReportsViewModel);   // the same structured selector
  const dispatch = useAppDispatch();
  return <ReportsView {...viewModel} onChartModeChange={(mode) => dispatch(chartModeChanged(mode))} … />;
}
```

`ReportsView` (presentational) doesn't change at all: that's the payoff of the container/presentational split.

## Step 5: the standalone store

`createStore` + `applyMiddleware` + `compose` becomes `configureStore({ reducer: { reports: reportsSlice.reducer,
[apiSlice.reducerPath]: apiSlice.reducer }, middleware: (gDM) => gDM().concat(apiSlice.middleware) })`. That gives you
the DevTools, the immutability and serializability checks, and the thunk with its extra argument, with nothing to wire
by hand.

## Checklist per step

- The old and the new tests pass (`tests/unit/features/reports/legacy/*`).
- `grep` for the old action type strings returns nothing.
- The island (`/taskflow/admin/reports`) and the SPA page (`/reports`) both still render.
