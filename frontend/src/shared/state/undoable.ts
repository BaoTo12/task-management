// A REDUCER ENHANCER (a higher-order reducer): a function that takes a reducer and returns a NEW reducer with extra
// behaviour. Redux's own combineReducers is one; this one adds undo/redo to ANY reducer, without that reducer knowing.
//
//   const reducer = undoable(checklistReducer, { name: 'checklist', limit: 50 });
//   state shape:  { past: S[], present: S, future: S[] }
//   dispatch(undoAction('checklist')) / dispatch(redoAction('checklist'))
//
// It works because reducers are pure and states are immutable: keeping old states is just keeping references.

import { createAction } from '@reduxjs/toolkit';
import type { Reducer, UnknownAction } from '@reduxjs/toolkit';

export interface UndoableState<S> {
  past: S[];
  present: S;
  future: S[];
}

/** Undo and redo are NAMESPACED: several undoable reducers can live in one store without undoing each other. */
export const undoAction = createAction<string>('undoable/undo');
export const redoAction = createAction<string>('undoable/redo');
export const historyCleared = createAction<string>('undoable/historyCleared');

export interface UndoableOptions {
  /** Which undo/redo actions are for THIS reducer. */
  name: string;
  /** How many steps to remember (memory bound). */
  limit?: number;
  /** Actions that change the state but shouldn't be an undo STEP (e.g. loading the initial data): true = skip. */
  skipHistory?: (action: UnknownAction) => boolean;
}

export function undoable<S>(reducer: Reducer<S>, { name, limit = 50, skipHistory = () => false }: UndoableOptions): Reducer<UndoableState<S>> {
  const initialState: UndoableState<S> = { past: [], present: reducer(undefined, { type: '@@undoable/INIT' }), future: [] };

  return (state = initialState, action) => {
    const { past, present, future } = state;

    if (undoAction.match(action) && action.payload === name) {
      if (past.length === 0) return state;
      return { past: past.slice(0, -1), present: past[past.length - 1] as S, future: [present, ...future] };
    }
    if (redoAction.match(action) && action.payload === name) {
      if (future.length === 0) return state;
      return { past: [...past, present], present: future[0] as S, future: future.slice(1) };
    }
    if (historyCleared.match(action) && action.payload === name) {
      return { past: [], present, future: [] };
    }

    const next = reducer(present, action);
    if (next === present) return state;                       // unrelated action: keep the SAME state object
    if (skipHistory(action)) return { past: [], present: next, future: [] };
    // A new step: remember the old present; a new change makes the redo branch meaningless, so future is dropped.
    return { past: [...past, present].slice(-limit), present: next, future: [] };
  };
}

export const canUndo = (state: UndoableState<unknown>) => state.past.length > 0;
export const canRedo = (state: UndoableState<unknown>) => state.future.length > 0;
