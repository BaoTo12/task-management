# Where each course concept lives in this code

A study map: open the file, find the comment with the lecture number, read the code around it.
styled-components has its own detailed map in [STYLING.md](STYLING.md).

## TypeScript (S05–S06, S13B)

| Concept | Where |
|---|---|
| Discriminated unions + exhaustive `switch` with `satisfies never` | `features/tasks/model/task-form-reducer.ts`, `shared/api/cross-tab.ts`, `features/auth/api/authApi.ts` (`onCacheEntryAdded`) |
| Mapped type → union (one member per key, paired with its value type) | `FieldChanged` in `task-form-reducer.ts` |
| Mapped types for derived shapes | `touched` in `task-form-reducer.ts` |
| Type guards, `unknown` at the boundary | `shared/domain/guards.ts`, `isCrossTabMessage` in `shared/api/cross-tab.ts`, `features/preferences/model/settings-form.ts` |
| Generic guard with `const T` | `isOneOf` in `shared/domain/guards.ts` |
| Declaration merging | `styled.d.ts` (theme), `shared/i18n/i18next.d.ts` (typed keys), `LazyLoadedSlices` in `app/rootReducer.ts` + `features/dashboard/state/dashboardSlice.ts` |
| `@ts-expect-error` as a type test | `tests/unit/features/tasks/model/task-form-reducer.test.ts`, `tests/unit/shared/ui/react-types.test.tsx` |

## React (S07–S08, S11–S12, S13B)

| Concept | Where |
|---|---|
| `useReducer` with a lazy initialiser | `features/tasks/components/TaskForm.tsx` |
| `useLayoutEffect` (measure before paint) | `shared/hooks/useAutosizeTextarea.ts` |
| `useImperativeHandle` + `ref` as a prop (React 19) | `shared/ui/ConfirmDialog.tsx`, used by `TasksPage`, `TaskDetailsPage`, `BulkBar` |
| `useTransition` | list/board switch in `features/tasks/pages/TasksPage.tsx` |
| Async transition + `useOptimistic` | `features/comments/components/CommentsSection.tsx` |
| `useDeferredValue` (vs debounce) | board filter in `features/tasks/components/Board.tsx` |
| `useActionState`, `useFormStatus`, `<form action>` | `features/preferences/pages/SettingsPage.tsx` |
| Uncontrolled form + `FormData`; radio, number, checkbox, select | `SettingsPage.tsx` + `model/settings-form.ts` |
| Controlled form, validation, server errors, focus on first invalid field | `TaskForm.tsx` |
| `createPortal` | `features/ui/components/ToastProvider.tsx` |
| `useId`, ARIA wiring | `shared/ui/forms/FormField.tsx`, `ConfirmDialog.tsx`, `Board.tsx` |
| `memo` + stable callbacks | `TaskListItem.tsx`, `Board.tsx` (`BoardColumn`), `TasksPage.tsx` |
| Context, custom hooks | `shared/theme/`, `features/auth/context/`, `shared/hooks/` |
| Error boundary | `shared/ui/ErrorBoundary.tsx` |
| Breadcrumbs (12.10), layout routes, lazy routes, protected routes | `shared/ui/Breadcrumbs.tsx`, `app/App.tsx`, `features/auth/components/RequireAuth.tsx` |
| Skip link, focus management | `app/AppLayout.tsx`, `TaskForm.tsx` |

## Redux, RTK, RTK Query (S14–S23)

| Concept | Where |
|---|---|
| Middleware | `app/middleware/` |
| `configureStore`, typed hooks, thunk `extra` | `app/store.ts`, `app/hooks.ts`, `app/thunk-types.ts` |
| `combineSlices` + a lazily injected slice + slice `selectors` | `app/rootReducer.ts`, `features/dashboard/state/dashboardSlice.ts` |
| `createSlice`, `prepare`, `extraReducers`, reset on logout | `features/listPrefs/state/listPrefsSlice.ts`, `features/ui/state/uiSlice.ts` |
| Memoised selectors, selector factories | `features/tasks/state/taskListSelectors.ts`, `features/dashboard/state/dashboardSelectors.ts` |
| `createEntityAdapter` on RTK Query data | `categoriesAdapter` in `shared/api/apiSlice.ts`, `features/categories/state/categorySelectors.ts` |
| Listener middleware: matchers, `take`, `fork`, `delay`, predicate on previous/current state, `cancelActiveListeners` | `features/auth/state/authListeners.ts` (keep-alive), `features/tasks/state/taskListeners.ts`, `features/search/state/quickFindListener.ts` |
| One api slice, custom base query, tags, `injectEndpoints` | `shared/api/apiSlice.ts`, `shared/api/axiosBaseQuery.ts`, `features/comments/api/commentsApi.ts`, `features/auth/api/authApi.ts` |
| Optimistic and pessimistic updates, `upsertQueryEntries` | `shared/api/apiSlice.ts` |
| `refetchOnFocus` / `refetchOnReconnect` + `setupListeners` | `apiSlice.ts`, `app/store.ts` |
| `keepUnusedDataFor` | `getTask`, `getCategories` in `apiSlice.ts` |
| `pollingInterval` + `skipPollingIfUnfocused`, `selectFromResult` | `features/dashboard/pages/DashboardPage.tsx` |
| `refetchOnMountOrArgChange` | `CommentsSection.tsx` |
| `onCacheEntryAdded` (streaming updates) + `invalidateTags` | cross-tab sync in `features/auth/api/authApi.ts`, sender in `taskListeners.ts` |
| `usePrefetch`, `skipToken`, lazy `queryFn` | `TasksPage.tsx`, `authApi.ts` |

### The full Redux checklist (team features + the legacy module)

Every API of `redux`, `react-redux`, `redux-thunk`, `reselect`, Redux Toolkit and RTK Query, and where it is used for real.

**Classic Redux** (`features/reports/legacy/`, with its own `MIGRATION.md`)

| API | Where |
|---|---|
| action-type constants, hand-written action creators, a discriminated action union | `legacy/actionTypes.ts`, `legacy/actions.ts` |
| switch reducers with spread copies, `default: return state` | `legacy/reducers.ts` |
| `combineReducers` (redux) | `legacy/reducers.ts`, `legacy/standaloneStore.ts` |
| `legacy_createStore` (createStore), `applyMiddleware`, `compose`, the DevTools compose | `legacy/standaloneStore.ts` (used by `island/reportsIsland.tsx`) |
| redux-thunk directly: `ThunkAction`, `withExtraArgument`, thunks that compose and skip work | `legacy/thunks.ts`, `legacy/standaloneStore.ts` |
| a hand-written middleware (`store => next => action`) | `actionLogger` in `standaloneStore.ts`; `features/timeTracking/state/timerMiddleware.ts` |
| reselect directly: `createSelector`, `createStructuredSelector`, `lruMemoize` + `maxSize` | `legacy/selectors.ts`; `features/projects/state/projectSelectors.ts` |
| `connect`, `mapStateToProps`, `mapDispatchToProps`, `bindActionCreators`, `ConnectedProps` | `features/reports/components/ReportsContainer.tsx` |
| container/presentational split | `ReportsContainer.tsx` + `ReportsView.tsx` |
| `useStore` (`useAppStore`), `shallowEqual` with `useSelector` | `features/reports/components/ReportsToolbar.tsx`, `app/hooks.ts` |
| a classic reducer mounted unchanged inside the RTK store | `legacyReports` in `app/rootReducer.ts` |

**Redux Toolkit**

| API | Where |
|---|---|
| `createReducer` + `createAction` (no slice) | `features/notifications/state/notificationsUiReducer.ts`, `features/subtasks/state/checklistDraft.ts` |
| `createAction` with `prepare` (payload + `meta`, normalised input) | `notificationActions.ts` (`receivedAt`), `checklistDraft.ts` (`itemRenamed` trims) |
| a REDUCER ENHANCER (higher-order reducer): undo/redo | `shared/state/undoable.ts` around `checklistDraft.ts` |
| `createAsyncThunk`: `condition`, `rejectWithValue`, `signal`, typed ThunkApiConfig, `meta.arg` | `features/people/state/userThunks.ts` |
| `buildCreateSlice` + `asyncThunkCreator` (`create.asyncThunk`, `create.reducer`), `.abort()` on unmount | `features/activity/state/activitySlice.ts`, `ActivityFeed.tsx` |
| `createEntityAdapter`: `sortComparer`, custom `selectId`, `getSelectors(inputSelector)`, `upsertMany`, adapters on cache data | `people/state/peopleSlice.ts`, `projects/api/projectsApi.ts`, `labels/api/labelsApi.ts`, `activity/state/activitySlice.ts` |
| matchers: `isAnyOf`, `isFulfilled`, `endpoint.matchFulfilled` in `extraReducers` | `peopleSlice.ts`, `timeTracking/state/timerSlice.ts`, `people/state/peopleListeners.ts` |
| listener debounce with `cancelActiveListeners` + `delay`, per-store closure state | `features/people/state/peopleListeners.ts` |
| selector factories per component (`useMemo(makeSelect…)`) and an inverted index | `people/state/peopleSelectors.ts`, `labels/state/labelSelectors.ts`, `projects/state/projectSelectors.ts` |

**RTK Query**

| API | Where |
|---|---|
| `enhanceEndpoints({ addTagTypes })` + `injectEndpoints` per feature | every `features/*/api/*Api.ts` |
| `build.infiniteQuery` (`initialPageParam`, `getNextPageParam`, `maxPages`, `fetchNextPage`) | `features/notifications/api/notificationsApi.ts`, `NotificationsPage.tsx` |
| streaming (`onCacheEntryAdded` + `EventSource` / Server-Sent Events) | `getUnreadCount` in `notificationsApi.ts` |
| polling that switches off while the stream is open | `features/notifications/components/NotificationBell.tsx` |
| lazy query (`useLazySearchUsersQuery`, `preferCacheValue`) | `features/people/components/PeoplePicker.tsx` |
| optimistic updates across EVERY cached argument (`selectCachedArgsForQuery`), on infinite-query pages | `labelsApi.ts` (`setTaskLabels`), `notificationsApi.ts` (`markRead`) |
| pessimistic cache writes (`updateQueryData`, `upsertQueryData` after `queryFulfilled`) | `projectsApi.ts` (`putMember`), `subtasksApi.ts` (`addSubtask`, `reorderSubtasks`) |
| `selectFromResult` with a memoized derivation | `features/tasks/components/TaskPlacementFields.tsx`, `timeTracking/components/TimerWidget.tsx` |
| a 204 → `null` via `transformResponse` | `getRunningTimer` in `timeTracking/api/timeApi.ts` |

## i18n (S25)

| Concept | Where |
|---|---|
| Detector, namespaces, lazy loading | `shared/i18n/i18n.ts`, `public/locales/` |
| Plurals (`_one` / `_other`) | every `count` key, e.g. `tasks.json` `clearConfirm_*` |
| Context (`_overdue`) | `card.due_overdue`, used in `TaskCard.tsx` |
| Nesting `$t(common:cannotUndo)` | confirm messages in `tasks.json` |
| `<Trans>` with a component inside the sentence | "Continue where you left off" in `TasksPage.tsx` |
| `Intl.DateTimeFormat`, `RelativeTimeFormat`, `NumberFormat`, `ListFormat` | `shared/i18n/format.ts`, used in `TaskCard`, `DashboardWidgets`, `BulkBar` |
| Typed keys | `shared/i18n/i18next.d.ts` |
| Error codes → messages | `shared/i18n/useErrorMessage.ts` |

## Cookies, auth and security (S24, S26)

| Concept | Where |
|---|---|
| One cookie wrapper, attributes per purpose | `shared/api/cookies.ts`, `features/preferences/model/rememberedCookies.ts` |
| Session-cookie auth, CSRF double submit, 401 → session expired | `shared/api/client.ts`, `features/auth/`, `shared/api/axiosBaseQuery.ts` |
| Safe `returnTo` (open redirect) | `features/auth/model/safe-redirect.ts` |
| XSS: React escaping, DOMPurify, URL allow-list, `noopener` | `shared/security/` |
| CSS injection defence | `shared/ui/styled/Tag.tsx` |
| Cross-tab logout | `shared/api/cross-tab.ts` + `authApi.ts` |
| Supply chain | `npm run audit:prod`, `npm run deps:outdated`, the committed `package-lock.json` |

## SCSS (S02–S03) — in `../styles`

| Concept | Where |
|---|---|
| Maps + `@each` generated variants | `components/_badge.scss`, `components/_card.scss` |
| `@for` generated utilities | `utilities/_spacing.scss` |
| Functions with `@error` / `@warn` | `abstracts/_functions.scss` |
| Mixins with `@content` and arguments | `abstracts/_mixins.scss` |
| Placeholders + `@extend` | `abstracts/_placeholders.scss`, `utilities/_text.scss` |
| `sass:color` derived shades | `abstracts/_tokens.scss` |
| `@use` / `@forward` architecture | `abstracts/_index.scss`, `main.scss` |
| Tokens → CSS custom properties, themes | `base/_root.scss` |
| `@layer`, `clamp()`, `@container` | `main.scss`, `layout/_page.scss`, `components/_card.scss` + `TaskCard.module.scss` |
