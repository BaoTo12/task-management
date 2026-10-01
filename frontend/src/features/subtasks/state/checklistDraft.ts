// A LOCAL draft of a task's checklist order and titles: the user rearranges and renames, can undo/redo every step,
// and only "Save" sends the result (one reorder request instead of one per click).
// Written with createAction + createReducer (no createSlice): the classic RTK building blocks, then wrapped by the
// undoable() reducer enhancer from shared/state.

import { createAction, createReducer, isAnyOf } from '@reduxjs/toolkit';

import type { Subtask } from '@/shared/domain/types';
import { loggedOut } from '@/shared/session/authActions';
import { undoable } from '@/shared/state/undoable';

export interface DraftItem {
  id: number;
  title: string;
}

export interface ChecklistDraft {
  taskId: number | null;
  items: DraftItem[];
}

const initialDraft: ChecklistDraft = { taskId: null, items: [] };

/** prepare: callers pass the server's subtasks; the action carries only what the draft needs. */
export const draftStarted = createAction('checklistDraft/started', (taskId: number, subtasks: readonly Subtask[]) => ({
  payload: { taskId, items: subtasks.map(({ id, title }) => ({ id, title })) },
}));

export const itemMoved = createAction<{ from: number; to: number }>('checklistDraft/itemMoved');

/** prepare normalises the input ONCE, where the action is created: reducers receive clean data. */
export const itemRenamed = createAction('checklistDraft/itemRenamed', (id: number, title: string) => ({
  payload: { id, title: title.replace(/\s+/g, ' ').trim() },
}));

export const draftClosed = createAction('checklistDraft/closed');

const checklistDraftReducer = createReducer(initialDraft, (builder) => {
  builder
    .addCase(draftStarted, (_state, action) => action.payload)   // returning a value REPLACES the state
    .addCase(itemMoved, (state, action) => {
      const { from, to } = action.payload;
      if (to < 0 || to >= state.items.length || from === to) return;
      const [moved] = state.items.splice(from, 1);
      if (moved) state.items.splice(to, 0, moved);
    })
    .addCase(itemRenamed, (state, action) => {
      const item = state.items.find((candidate) => candidate.id === action.payload.id);
      if (item && action.payload.title !== '' && item.title !== action.payload.title) item.title = action.payload.title;
    })
    .addMatcher(isAnyOf(draftClosed, loggedOut), () => initialDraft);
});

/**
 * The reducer the store mounts: undo/redo on top. Starting or closing a draft isn't an undo STEP: those clear the
 * history (skipHistory), so "undo" never jumps back into another task's checklist.
 */
export const undoableChecklistDraftReducer = undoable(checklistDraftReducer, {
  name: 'checklistDraft',
  limit: 30,
  skipHistory: isAnyOf(draftStarted, draftClosed, loggedOut),
});
