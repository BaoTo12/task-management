# 1 · Redux from zero

> Read this first if you have never studied Redux. Every later chapter uses these words.
> Chapters: **1 Redux from zero** → [2 How the store is built](02-store-creation.md) → [3 Middleware](03-middleware.md)
> → [4 RTK Query](04-rtk-query.md) → [5 One click, the full cycle](05-one-click-full-cycle.md)

---

## 1.1 The problem Redux solves

A React app keeps data in components (`useState`). That works until **many components far apart need the same data**:

- the task list shows the tasks,
- the header shows "3 open tasks",
- the dashboard shows a progress ring,
- the board shows the same tasks in columns.

With `useState` you would keep the tasks in a common parent and pass them down through every layer ("prop drilling"),
and every component that changes them needs a callback passed down too. It gets messy fast, and when something goes
wrong you can't tell **who changed what, when**.

Redux's answer: **put the shared data in ONE object outside React** (the *store*), and allow it to change in only ONE
way (by *dispatching an action*). Any component can read any part of it; nobody can change it secretly.

## 1.2 The three rules

1. **One source of truth.** All shared state lives in one plain JavaScript object: the *state tree*.
2. **State is read-only.** You never write `state.tasks.push(...)`. You *describe* what happened with an **action**:
   `{ type: 'tasks/added', payload: task }`.
3. **Changes are made by pure functions.** A **reducer** takes the old state and the action and returns the NEW state.
   Same input → same output, no side effects (no HTTP, no `Date.now()`, no random ids).

Because of these rules, every change is a recorded event (the action), and you can replay, log or time-travel them
(that's what the Redux DevTools do).

## 1.3 The vocabulary, with tiny examples

### State
Just data:
```js
const state = { count: 0, toasts: [] };
```

### Action
A plain object that says WHAT HAPPENED. `type` is required (a string); the data goes in `payload` by convention:
```js
{ type: 'counter/incremented', payload: 5 }
```
Name actions as **events in the past tense** ("incremented", "toastShown"), not commands ("increment"): many reducers
may react to the same event.

### Action creator
A function that builds an action, so you never type the string twice:
```js
const incremented = (amount) => ({ type: 'counter/incremented', payload: amount });
incremented(5); // → { type: 'counter/incremented', payload: 5 }
```

### Reducer
`(state, action) => newState`. It must NOT modify `state`; it returns a new object:
```js
function counterReducer(state = { value: 0 }, action) {      // the default = the INITIAL state
  switch (action.type) {
    case 'counter/incremented':
      return { ...state, value: state.value + action.payload }; // a NEW object
    default:
      return state;                                             // not my action: return the SAME object
  }
}
```

### Why "return a new object" matters (immutability)
React-Redux decides whether a component must re-render by comparing **references** with `===`:
```js
oldState.value === newState.value   // cheap: one comparison, no deep walk
```
If you mutated the old object, old and new would be the SAME object, `===` would say "nothing changed", and the screen
would not update. Returning new objects for what changed (and the SAME objects for what didn't) is what makes
"did this change?" a single `===`. Keeping unchanged parts identical is called **structural sharing**.

### Store
The object that holds the state and runs the reducer. It has exactly three important methods:

| Method | What it does |
|---|---|
| `store.getState()` | returns the current state object |
| `store.dispatch(action)` | runs `state = reducer(state, action)`, then calls every subscriber |
| `store.subscribe(fn)` | registers `fn` to be called after every dispatch; returns an `unsubscribe` function |

### Selector
A function that reads something from the state: `const selectCount = (state) => state.counter.value;`
Components never dig into the state shape themselves; they call selectors. If the shape changes, only selectors change.

## 1.4 Redux in 25 lines (so nothing is magic)

This is (simplified) what `createStore` in the `redux` package does. Read it slowly: everything else builds on it.

```js
function createStore(reducer, preloadedState) {
  let state = preloadedState;          // the ONE state object, hidden in a closure
  let listeners = [];                  // subscribers

  function getState() {
    return state;
  }

  function dispatch(action) {
    if (typeof action !== 'object' || action === null || typeof action.type !== 'string') {
      throw new Error('Actions must be plain objects with a string type'); // (a function? see "thunk" below)
    }
    state = reducer(state, action);    // ← THE only place state ever changes
    listeners.forEach((listener) => listener()); // tell everyone "something may have changed"
    return action;
  }

  function subscribe(listener) {
    listeners.push(listener);
    return () => { listeners = listeners.filter((l) => l !== listener); }; // unsubscribe
  }

  dispatch({ type: '@@redux/INIT' });  // run the reducer once: state = each reducer's initial state
  return { getState, dispatch, subscribe };
}
```

Notice:
- the reducer is called with `state = undefined` on INIT, so its default parameter becomes the initial state;
- subscribers are NOT told *what* changed, only *that* a dispatch happened. Each subscriber checks for itself
  (React-Redux runs your selector again and compares with `===`).

## 1.5 Many reducers → one: `combineReducers`

One reducer for the whole app would be huge. You write one per "slice" of the state and combine them:
```js
function combineReducers(reducers) {               // { listPrefs: fn, ui: fn, … }
  return function rootReducer(state = {}, action) {
    let changed = false;
    const next = {};
    for (const key in reducers) {
      next[key] = reducers[key](state[key], action); // each reducer sees ONLY its own key
      if (next[key] !== state[key]) changed = true;
    }
    return changed ? next : state;                   // nothing changed → the SAME root object
  };
}
```
**Every action goes to every reducer.** A reducer that doesn't care returns its state unchanged. That's how one
event (`loggedOut`) can reset many slices: each slice's reducer handles it.

## 1.6 Middleware: code that runs around every dispatch

Middleware lets you add behaviour to `dispatch` without touching reducers: logging, crash reports, async work.
A middleware is a function with three nested arrows:

```js
const logger = (storeApi) => (next) => (action) => {
  console.log('before', storeApi.getState());
  const result = next(action);                 // pass the action on (eventually: to the reducer)
  console.log('after', storeApi.getState());   // code after next() sees the NEW state
  return result;
};
```

- `storeApi` = `{ getState, dispatch }` (dispatch here goes through the WHOLE chain again from the top),
- `next` = "the next middleware, or the real dispatch if I'm the last one",
- `action` = what was dispatched.

Several middleware form an **onion**: `applyMiddleware(a, b, c)` makes `dispatch(x)` call `a`, which calls `next` = `b`,
which calls `next` = `c`, which calls `next` = the real dispatch (the reducer). Simplified:
```js
function applyMiddleware(...middlewares) {
  return (createStore) => (reducer, preloaded) => {
    const store = createStore(reducer, preloaded);
    let dispatch = () => { throw new Error('Dispatching while constructing middleware'); };
    const storeApi = { getState: store.getState, dispatch: (action) => dispatch(action) };
    const chain = middlewares.map((mw) => mw(storeApi));        // give each one storeApi
    dispatch = compose(...chain)(store.dispatch);              // a(b(c(realDispatch)))
    return { ...store, dispatch };                             // the store with the WRAPPED dispatch
  };
}
const compose = (...fns) => (arg) => fns.reduceRight((acc, fn) => fn(acc), arg);
```
A middleware may also **not** call `next` (swallow the action), call it later, or dispatch other actions.

## 1.7 Thunks: dispatching a FUNCTION

Reducers must be pure, so where does async work (HTTP) go? Into a **thunk**: you dispatch a function instead of an
object. The `redux-thunk` middleware is literally this:
```js
const thunk = (storeApi) => (next) => (action) =>
  typeof action === 'function'
    ? action(storeApi.dispatch, storeApi.getState, extraArgument)  // run it; DON'T pass it on
    : next(action);                                                 // a normal action: pass it on
```
So you can write:
```js
const loadTasks = () => async (dispatch, getState, extra) => {
  dispatch({ type: 'tasks/loading' });
  const tasks = await extra.api.fetchTasks();
  dispatch({ type: 'tasks/loaded', payload: tasks });
};
dispatch(loadTasks());
```
`extraArgument` is something the store gives every thunk (in TaskFlow: the API layer), so thunks don't import it
directly and tests can pass a fake.

## 1.8 Connecting React: `<Provider>`, `useSelector`, `useDispatch`

- `<Provider store={store}>` puts the store in a React **context**. It doesn't copy the state anywhere.
- `useDispatch()` returns `store.dispatch`.
- `useSelector(selector)`:
  1. on render: returns `selector(store.getState())`;
  2. subscribes to the store; after EVERY dispatch it runs `selector(newState)` again;
  3. if the result is `!==` the previous result, it re-renders the component; otherwise it does nothing.

Consequences you will see everywhere in TaskFlow:
- a selector that builds a **new** array/object every time (`state.tasks.filter(...)`) re-renders on EVERY action.
  The fix is **memoized selectors** (`createSelector`, below);
- selecting a small thing (one task, one number) means fewer re-renders than selecting everything.

## 1.9 What Redux Toolkit (RTK) adds

Plain Redux needs a lot of hand-written code. **Redux Toolkit** (`@reduxjs/toolkit`) is the official way to write
Redux today. TaskFlow uses all of it:

| RTK API | Replaces | One-line idea |
|---|---|---|
| `configureStore` | `createStore` + `applyMiddleware` + DevTools setup | builds the store with good defaults (thunk, dev checks, DevTools) |
| `createAction('ui/toastShown')` | hand-written action creators | an action creator with `.type` and `.match(action)` |
| `createReducer` / `createSlice` | `switch` reducers | write "mutating" code; **Immer** turns it into an immutable update |
| `createSlice` | action types + creators + reducer | one call → the reducer AND its action creators (`name/caseName`) |
| `createAsyncThunk` | hand-written loading/success/error thunks | dispatches `…/pending`, `…/fulfilled`, `…/rejected` for you |
| `createSelector` (reselect) | hand-made caching | a selector that recomputes only when its inputs change (by `===`) |
| `createEntityAdapter` | hand-written `{ ids, entities }` code | normalised collections with ready-made add/update/remove reducers |
| `createListenerMiddleware` | ad-hoc side-effect code | "when THIS action happens, run THAT effect" |
| `combineSlices` | `combineReducers` | combine reducers; can add more later (lazy loading) |
| **RTK Query** (`createApi`) | thunks + loading flags + caching for server data | a data-fetching and caching layer built on all of the above |

### Immer in one paragraph
Inside an RTK reducer you may write `state.toasts.push(toast)`. You are not mutating the real state: RTK passes you a
**draft** (an Immer proxy) that records your changes. When your function returns, Immer builds a NEW state object that
contains your changes and **reuses every untouched object** (structural sharing). If you changed nothing, you get the
SAME state object back.

### `createAsyncThunk` lifecycle
```js
const fetchUsers = createAsyncThunk('people/fetchMissing', async (ids) => api.getUsers(ids));
dispatch(fetchUsers([1, 2]));
// dispatches: { type: 'people/fetchMissing/pending',   meta: { arg: [1,2], requestId } }
// then either { type: 'people/fetchMissing/fulfilled', payload: users, meta }
//          or { type: 'people/fetchMissing/rejected',  error / payload, meta }
```
Reducers listen to those three actions to set loading flags and store results. **RTK Query is built on exactly this:**
every request is an async thunk named `api/executeQuery` or `api/executeMutation`.

## 1.10 RTK Query in one page

**Server state** (tasks, projects, users: owned by the backend, can change behind your back) is different from
**client state** (the sort you picked, open toasts). RTK Query manages server state for you:

| Concept | Meaning | In TaskFlow |
|---|---|---|
| **API slice** | one `createApi(...)` for the whole backend: a reducer + a middleware + endpoints + hooks | `shared/api/apiSlice.ts` |
| **base query** | the ONE function that performs HTTP for every endpoint | `axiosBaseQuery` (uses Axios) |
| **query endpoint** | a READ (`build.query`): `getTasks`, `getTask` | cached |
| **mutation endpoint** | a WRITE (`build.mutation`): `patchTask`, `deleteTask` | not cached; can update/invalidate the cache |
| **cache entry** | the result of ONE query with ONE argument, under a key like `getTasks({"size":100})` | `state.api.queries[key]` |
| **subscription** | "a component is using this entry"; unused entries are deleted after `keepUnusedDataFor` (60 s default) | `state.api.subscriptions` |
| **tags** | labels on cache entries (`providesTags: Task:5`); a mutation `invalidatesTags: Task:5` → every entry with that label refetches | |
| **`onQueryStarted`** | your code that runs when a request starts; can patch the cache before the server answers (**optimistic update**) | `patchTask` |
| **hooks** | `useGetTasksQuery(arg)` = subscribe + fetch + select; `usePatchTaskMutation()` = a trigger function + its status | |

## 1.11 The cycle, in words (keep this picture in mind)

```text
 UI event ──▶ dispatch(action or thunk)
                │
                ▼
        middleware chain (onion): may log, run thunks, start HTTP, dispatch more actions
                │
                ▼
        root reducer: each slice reducer computes its part of the NEW state (immutably)
                │
                ▼
        store notifies subscribers
                │
                ▼
        every useSelector re-runs its selector; components whose selected value changed (!==) re-render
                │
                ▼
        after next(): listeners / RTK Query middleware react to the action (more dispatches → the cycle repeats)
```

Next: [2 · How TaskFlow's store is built, line by line](02-store-creation.md)
