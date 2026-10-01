import { createAction, createReducer } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';

import { canRedo, canUndo, historyCleared, redoAction, undoAction, undoable } from '@/shared/state/undoable';

const added = createAction<number>('counter/added');
const counter = createReducer(0, (builder) => builder.addCase(added, (state, action) => state + action.payload));
const reducer = undoable(counter, { name: 'counter', limit: 3 });
const init = reducer(undefined, { type: '@@INIT' });

describe('undoable reducer enhancer', () => {
  it('records every change and walks back and forth', () => {
    let state = reducer(init, added(1));
    state = reducer(state, added(2));
    expect(state.present).toBe(3);
    state = reducer(state, undoAction('counter'));
    expect(state.present).toBe(1);
    expect(canRedo(state)).toBe(true);
    state = reducer(state, redoAction('counter'));
    expect(state.present).toBe(3);
  });

  it('a new change after an undo drops the redo branch', () => {
    let state = reducer(reducer(init, added(1)), undoAction('counter'));
    state = reducer(state, added(5));
    expect(canRedo(state)).toBe(false);
  });

  it('ignores other reducers’ undo, and unrelated actions keep the same state object', () => {
    const state = reducer(init, added(1));
    expect(reducer(state, undoAction('somethingElse'))).toBe(state);
    expect(reducer(state, { type: 'unrelated' })).toBe(state);
  });

  it('keeps at most `limit` steps, and can clear its history', () => {
    let state = init;
    for (let i = 0; i < 10; i++) state = reducer(state, added(1));
    expect(state.past).toHaveLength(3);
    state = reducer(state, historyCleared('counter'));
    expect(canUndo(state)).toBe(false);
    expect(state.present).toBe(10);
  });
});
