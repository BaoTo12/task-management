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
