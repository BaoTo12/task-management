# TaskFlow Web: frontend structure

Study maps: [CONCEPTS.md](CONCEPTS.md) (every course concept → the file that uses it) and [STYLING.md](STYLING.md) (styling rules + styled-components concepts).

Feature-first layout (course progress: **end of S50**). Each feature owns everything it needs (components, pages, Redux state, RTK Query endpoints, model logic) and exposes a small public API through its `index.ts`. Code used by several features lives in `shared/`. The Redux store is wired in `app/`.

```text
src/
├── app/                        the application shell + the Redux store wiring
│   ├── main.tsx                entry point (index.html → /src/app/main.tsx): starts i18n, renders <AppProviders><App/>
│   ├── AppProviders.tsx        every app-wide provider, in order: Redux, router, theme, toast, auth, i18n Suspense
│   ├── App.tsx                 the route table (RequireAuth layout route; dashboard lazy-loaded)
│   ├── AppLayout.tsx           header (nav, quick find, language, theme, user), error boundary, <Outlet/>
│   ├── store.ts                makeStore() + store, AppStore, AppDispatch (S16–S20)
│   ├── rootReducer.ts          combineReducers: api cache, listPrefs, ui, quickFind; RootState
│   ├── hooks.ts                useAppSelector / useAppDispatch (the ONLY place allowed to import the raw hooks)
│   ├── listeners.ts            the listener middleware; registers each feature's listeners (S21)
│   ├── thunk-types.ts          ThunkExtra (extra.api), AppThunk
│   └── middleware/             logger, crash reporter, analytics, redact (S16, S19)
│
├── features/
│   ├── tasks/                  list, board, details, create/edit, bulk actions
│   │   ├── index.ts            PUBLIC API: pages, Board, OpenTasksBadge, selectors, toggleTask, listeners, task-utils
│   │   ├── components/         TaskCard, TaskList, TaskListItem, Board, TaskForm, FilterBar, SearchBox, Pager,
│   │   │                       TaskListSkeleton, BulkBar, OpenTasksBadge, Badge, PriorityBar
│   │   ├── state/              taskSelectors, taskListSelectors, taskActions (thunks), taskListeners
│   │   ├── model/              task-utils, task-form, list-link (+ test): framework-free logic
│   │   └── pages/              TasksPage, TaskDetailsPage, NewTaskPage, EditTaskPage
│   ├── auth/                   session login (S24): authApi, listeners, clearUserData, context, RequireAuth, LoginPage
│   ├── categories/             CategorySidebar, TaskCategoryTag, categorySelectors
│   ├── comments/               commentsApi (injected endpoints), CommentsSection (sanitised rich text, S26)
│   ├── dashboard/              DashboardPage (lazy), DashboardWidgets, dashboardSelectors
│   ├── listPrefs/              sort + page size slice, its cookie (S24), SortControl
│   ├── preferences/            remembered cookies (last opened task)
│   ├── search/                 quick find: slice, debounced listener, QuickFind box
│   └── ui/                     uiSlice (selection, toasts), toastActions, ToastProvider (renders the store's toasts)
│
├── island/                     S49: React islands mounted inside JSP pages (a second shell, like app/)
│
├── shared/                     no feature knowledge: usable by any feature
│   ├── api/                    client.ts (Axios + interceptors), api-error, cookies (js-cookie wrapper),
│   │                           axiosBaseQuery, apiSlice (the ONE RTK Query api), tasks-api + endpoints (thunk extra.api)
│   ├── session/                authActions: loggedOut, sessionExpired (events every slice reacts to)
│   ├── domain/                 types, api-types, guards, format, color
│   ├── hooks/                  useDebounce, useCookieState, useToday, useAutosizeTextarea
│   ├── i18n/                   i18next setup, format helpers, LanguageSwitcher, useErrorMessage (S25)
│   ├── security/               safeUrl, SafeLink, markup (DOMPurify), RichText (S26)
│   ├── theme/                  ThemeProvider, theme-context, theme.ts, GlobalStyle, ThemeToggle
│   ├── toast/                  toast-context (types + useToast)
│   └── ui/                     Button, ButtonLink, button-classes, ErrorBoundary, NotFoundPage, forms/, styled/
│
├── styled.d.ts                 styled-components DefaultTheme augmentation (global)
└── vite-env.d.ts               VITE_* env declarations (global)
```

Next to `src/` (never bundled into the app):

```text
frontend/
├── src/                        the application (above)
├── tests/                      EVERY test: nothing ending in .test.ts lives in src/
│   ├── unit/                   mirrors src/: tests/unit/features/tasks/model/list-link.test.ts tests src/features/tasks/model/list-link.ts
│   ├── integration/            tests that span layers (a real store + the cache + cookies)
│   └── helpers/                fixtures shared by tests: deep-freeze, rtk-query-actions, task-cache
└── public/locales/             translations (en, vi)
```

## Rules (enforced by `tsc`, `oxlint` and review)

1. **Dependency direction: `app / island → features → shared`.** `shared/` never imports from `features/`, `app/` or `island/` (lint error).
2. **The Redux exception:** features may import `@/app/hooks` (typed hooks) and **types** from `@/app/*` (`RootState`, `AppDispatch`, `AppThunk`, `AppStartListening`). Never runtime values from `app/store`: only tests and `island/` may do that. One more runtime import is allowed: a LAZY slice injects itself with `slice.injectInto(rootReducer)` from `@/app/rootReducer` (see `features/dashboard/state/dashboardSlice.ts`).
3. **Features talk through their public API.** From outside a feature, import `@/features/tasks`, never `@/features/tasks/state/taskSelectors` (lint error). Inside a feature, use relative imports and never the feature's own `index.ts` (import cycles).
4. **Order inside an `index.ts`:** model → api → state → context → components → pages. Features import each other in a cycle (tasks ↔ categories, tasks ↔ listPrefs); exporting the state before the pages makes selectors exist before anything that uses them at module level.
5. **No `../../`.** Crossing a folder boundary uses the `@/` alias; relative imports stay inside one feature or one shared area (lint error).
6. **`@/` = `src/`**, declared twice and kept in sync: `vite.config.ts` (`resolve.alias`) and `tsconfig.app.json` (`paths`).
7. **Imports are grouped**: packages → `@/app` → `@/features` → `@/shared` → relative → styles, one blank line between groups.
8. **Tests live in `tests/`, never in `src/`.** `tests/unit/` mirrors the `src/` path of the code it tests; they import it by alias (`@/…`, internals allowed), fixtures from `@tests/helpers/…`. App code never imports `@tests` (lint error). Aliases are declared in `vite.config.ts` and `tsconfig.test.json`.
9. **A new feature** = a folder under `features/` with an `index.ts`; register its pages in `app/App.tsx`, its reducer in `app/rootReducer.ts`, its listeners in `app/listeners.ts`, any provider in `app/AppProviders.tsx`.

## Course path → project path

The lectures name files by the course's own layout. When a lecture says to edit a file on the left, edit the one on the right:

| Course path (`src/…`) | This project (`src/…`) |
|---|---|
| `main.tsx`, `App.tsx`, `layouts/AppLayout.tsx` | `app/main.tsx` (+ `app/AppProviders.tsx`), `app/App.tsx`, `app/AppLayout.tsx` |
| `app/*` (store, rootReducer, hooks, listeners, thunk-types, middleware/) | `app/*` (same) |
| `app/mini-redux/*`, `app/combine-slice-reducers.ts`, `app/enhancers/*`, `domain/memoize.ts` | removed: learning exercises, not part of the app |
| any `*.test.ts(x)` next to its code | `tests/unit/<same path>` |
| `api/client.ts`, `api-error.ts`, `cookies.ts`, `axiosBaseQuery.ts` | `shared/api/…` |
| `api/tasks.ts`, `api/index.ts` | `shared/api/tasks-api.ts`, `shared/api/endpoints.ts` |
| `features/api/apiSlice.ts` | `shared/api/apiSlice.ts` |
| `features/auth/authActions.ts` | `shared/session/authActions.ts` |
| `features/auth/authApi.ts`, `authListeners.ts`, `clearUserData.ts` | `features/auth/api/authApi.ts`, `features/auth/state/…` |
| `auth/auth-context.ts`, `auth/AuthProvider.tsx`, `auth/RequireAuth.tsx` | `features/auth/context/…`, `features/auth/components/RequireAuth.tsx` |
| `pages/LoginPage.tsx`, `domain/safe-redirect.ts` | `features/auth/pages/…`, `features/auth/model/…` |
| `features/<name>/<Component>.tsx` (+ `.module.scss`) | `features/<name>/components/…` |
| `features/<name>/<slice, selectors, listeners, actions>.ts` | `features/<name>/state/…` |
| `features/comments/commentsApi.ts` | `features/comments/api/commentsApi.ts` |
| `features/preferences/rememberedCookies.ts` | `features/preferences/model/rememberedCookies.ts` |
| `features/tasks/{BulkBar,OpenTasksBadge,TaskListItem}.tsx` | `features/tasks/components/…` |
| `components/{TaskCard,TaskList,Board,TaskForm,FilterBar,SearchBox,Badge,Pager,TaskListSkeleton}.tsx` | `features/tasks/components/…` |
| `components/styled/PriorityBar.tsx` | `features/tasks/components/PriorityBar.tsx` |
| `components/Button.tsx`, `ErrorBoundary.tsx`, `forms/*`, `styled/*` | `shared/ui/…` |
| `components/ThemeToggle.tsx`, `theme/*` | `shared/theme/…` |
| `toast/toast-context.ts` | `shared/toast/toast-context.ts` |
| `toast/ToastProvider.tsx` | `features/ui/components/ToastProvider.tsx` (it reads toasts from the store) |
| `domain/task-utils.ts`, `domain/task-form.ts`, `pages/list-link.ts` | `features/tasks/model/…` |
| `domain/*` (everything else) | `shared/domain/…` |
| `hooks/*`, `i18n/*`, `security/*` | `shared/hooks/…`, `shared/i18n/…`, `shared/security/…` |
| `pages/{Tasks,TaskDetails,NewTask,EditTask}Page.tsx` | `features/tasks/pages/…` |
| `pages/DashboardPage.tsx` | `features/dashboard/pages/DashboardPage.tsx` |
| `pages/NotFoundPage.tsx` | `shared/ui/NotFoundPage.tsx` |
| `island/*` | `island/*` (same) |
| `test/*` | `tests/helpers/*` |
| `api/cookies.test.ts`, `features/api/taskCache.test.ts` | `tests/integration/…` |
| `verification/*` | not copied (course evidence) |

## What differs from the course code on purpose

- **S13B on top of S50:** `SelectField<T>` in `TaskForm`, `Button` accepts `ref`, `ButtonLink` instead of `<Link className="btn …">`, React's `SubmitEvent` instead of the deprecated `FormEvent`, `isOneOf` in `guards.ts`.
- **Port 8081 instead of 8080** for Tomcat (the local Apache httpd owns 8080): `vite.config.ts`, `docker-compose.yml`, `DevServer`.
