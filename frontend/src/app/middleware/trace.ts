// A LEARNING AID (development only, OFF by default): prints every dispatch's trip through the middleware chain in the
// browser console, as a collapsible tree:
//
//   ▶ dispatch: ƒ thunk: (dispatch, getState) => { const task = selectTaskById(getState(), id); …
//     → crashReporter
//       → listenerMiddleware
//         → thunk
//           ↪ nested dispatch: ƒ thunk: …            (the thunk dispatched something: it starts again at the top)
//           ✋ thunk called the thunk itself; it did NOT pass it on (next was not called)
//
// Turn it on in the browser console, then reload the page:
//   localStorage.setItem('traceRedux', 'all')          every dispatch
//   localStorage.setItem('traceRedux', 'patchTask')    only dispatches whose description contains "patchTask"
// Turn it off:
//   localStorage.removeItem('traceRedux')
//
// How it works: each middleware of the chain is WRAPPED by another middleware (same three layers: storeApi => next =>
// action) that logs before calling it, and wraps its `next` too, to see whether it passed the action on.

import { isAction } from '@reduxjs/toolkit';
import type { Middleware } from '@reduxjs/toolkit';

const STORAGE_KEY = 'traceRedux';

/** The setting from localStorage ('all', a filter word, or null = off). Never throws (private mode, tests…). */
export function readTraceSetting(): string | null {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

/**
 * The names of what getDefaultMiddleware() returned, in order. Redux Toolkit 2 returns, in development:
 * [actionCreatorCheck, immutableCheck, thunk, serializableCheck]; in production: [thunk].
 */
export function defaultMiddlewareNames(count: number): string[] {
  if (count === 4) return ['actionCreatorCheck', 'immutableCheck', 'thunk', 'serializableCheck'];
  if (count === 1) return ['thunk'];
  return Array.from({ length: count }, (_, index) => `rtk default #${index + 1}`);
}

/** State shared by every wrapped middleware of ONE store. */
interface TraceRun {
  /** One entry per dispatch in progress (more than one = a dispatch made while another is still running): shown? */
  visible: boolean[];
  /** True while the innermost dispatch in progress is not shown: nothing is printed. */
  hidden: boolean;
}

/**
 * Replaces every middleware of `chain` (in place) with a logging wrapper around it.
 * `names[i]` is the label of `chain[i]`; `setting` is 'all' / '1' (everything) or a filter word.
 */
export function traceChain(chain: unknown[], names: readonly string[], setting: string): void {
  const filter = setting === 'all' || setting === '1' ? '' : setting.toLowerCase();
  const run: TraceRun = { visible: [], hidden: false };
  const lastIndex = chain.length - 1;
  chain.forEach((middleware, index) => {
    chain[index] = traced(middleware as Middleware, {
      name: names[index] ?? `middleware #${index + 1}`,
      isFirst: index === 0,
      isLast: index === lastIndex,
      run,
      filter,
    });
  });
  console.info(`[trace] Redux middleware tracing is ON (${setting}). Order: ${names.join(' → ')} → reducers`);
}

interface TraceOptions {
  name: string;
  /** The first middleware = the store's entrance: every dispatch starts here. */
  isFirst: boolean;
  /** The last middleware: its `next` is the store's ORIGINAL dispatch, where the reducers run. */
  isLast: boolean;
  run: TraceRun;
  filter: string;
}

function traced(middleware: Middleware, { name, isFirst, isLast, run, filter }: TraceOptions): Middleware {
  // Layer 1: called once, when the store is built. Give the real middleware its storeApi.
  return (storeApi) => {
    const withStore = middleware(storeApi);
    // One flag per call in progress: "did this middleware call next?" (a stack: dispatches can nest).
    const passed: boolean[] = [];

    // Layer 2: called once. Give the real middleware a `next` that records that it was called.
    return (next) => {
      const tracedNext = (action: unknown): unknown => {
        if (passed.length > 0) passed[passed.length - 1] = true;
        if (run.hidden) return next(action);
        if (!isLast) {
          const result = next(action);
          console.log(`%c← back in ${name} (its code after next() runs now)`, 'color:#6b7280');
          return result;
        }
        // The last next = the original dispatch: the reducers compute the new state.
        const before: unknown = storeApi.getState();
        const result = next(action);
        console.log(
          `%c🧮 reducers ran → changed: ${changedKeys(before, storeApi.getState()).join(', ') || 'nothing'}`,
          'color:#059669;font-weight:bold',
        );
        console.log(`%c← back in ${name} (its code after next() runs now)`, 'color:#6b7280');
        return result;
      };
      const handle = withStore(tracedNext);

      // Layer 3: every dispatch.
      return (action) => {
        if (isFirst) openDispatch(run, filter, action);
        if (!run.hidden) console.group(`→ ${name}`);
        passed.push(false);
        let threw = true;
        try {
          const result = handle(action);
          threw = false;
          return result;
        } finally {
          const didPass = passed.pop() ?? false;
          if (!run.hidden) {
            if (threw) console.log(`💥 ${name}: an error was thrown`);
            else if (!didPass) {
              console.log(
                typeof action === 'function'
                  ? `✋ ${name} called the thunk itself; it did NOT pass it on (next was not called)`
                  : `✋ ${name} stopped the action here (next was not called)`,
              );
            }
            console.groupEnd();
          }
          if (isFirst) closeDispatch(run);
        }
      };
    };
  };
}

/**
 * A dispatch enters the chain. It's shown when there's no filter, when it matches the filter, or when the dispatch it
 * was made from is shown. Shown inside a shown dispatch → an open nested group; otherwise a collapsed top group.
 */
function openDispatch(run: TraceRun, filter: string, action: unknown): void {
  const description = describe(action);
  const parentShown = run.visible.at(-1) ?? false;
  const shown = filter === '' || parentShown || description.toLowerCase().includes(filter);
  run.visible.push(shown);
  run.hidden = !shown;
  if (!shown) return;
  if (parentShown) console.group(`↪ nested dispatch: ${description}`);
  else console.groupCollapsed(`▶ dispatch: ${description}`);
}

function closeDispatch(run: TraceRun): void {
  const shown = run.visible.pop() ?? false;
  if (shown) console.groupEnd();
  run.hidden = !(run.visible.at(-1) ?? true);
}

/** A readable one-liner: the action type (+ the RTK Query endpoint), or the start of a thunk's source code. */
function describe(action: unknown): string {
  if (typeof action === 'function') {
    const source = action.toString().replace(/\s+/g, ' ').slice(0, 90);
    return `ƒ thunk${action.name ? ` ${action.name}` : ''}: ${source}…`;
  }
  if (isAction(action)) {
    const endpoint = (action as { meta?: { arg?: { endpointName?: unknown } } }).meta?.arg?.endpointName;
    return typeof endpoint === 'string' ? `${action.type}  (${endpoint})` : action.type;
  }
  return String(action);
}

/** The top-level state keys whose object changed (=== comparison), e.g. ['api', 'ui']. */
function changedKeys(before: unknown, after: unknown): string[] {
  if (typeof before !== 'object' || before === null || typeof after !== 'object' || after === null) return [];
  const previous = before as Record<string, unknown>;
  const next = after as Record<string, unknown>;
  return Object.keys(next).filter((key) => previous[key] !== next[key]);
}
