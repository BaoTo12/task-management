import { describe, expect, it } from 'vitest';

import { draftClosed, draftStarted, itemMoved, itemRenamed, undoableChecklistDraftReducer } from '@/features/subtasks';

import { undoAction } from '@/shared/state/undoable';

const subtasks = [
  { id: 1, taskId: 9, title: 'A', done: false, position: 0 },
  { id: 2, taskId: 9, title: 'B', done: true, position: 1 },
  { id: 3, taskId: 9, title: 'C', done: false, position: 2 },
];

describe('checklist draft (createAction + createReducer + undoable)', () => {
  const started = undoableChecklistDraftReducer(undefined, draftStarted(9, subtasks));

  it('prepare keeps only id and title; starting is not an undo step', () => {
    expect(started.present.items).toEqual([{ id: 1, title: 'A' }, { id: 2, title: 'B' }, { id: 3, title: 'C' }]);
    expect(started.past).toHaveLength(0);
  });

  it('moves and renames, and every step can be undone', () => {
    let state = undoableChecklistDraftReducer(started, itemMoved({ from: 2, to: 0 }));
    state = undoableChecklistDraftReducer(state, itemRenamed(3, '  Call   the  vendor '));
    expect(state.present.items.map((item) => item.title)).toEqual(['Call the vendor', 'A', 'B']);
    state = undoableChecklistDraftReducer(state, undoAction('checklistDraft'));
    expect(state.present.items[0]?.title).toBe('C');
  });

  it('an out-of-range move changes nothing (same state object)', () => {
    expect(undoableChecklistDraftReducer(started, itemMoved({ from: 0, to: 7 }))).toBe(started);
  });

  it('closing forgets the draft and its history', () => {
    const closed = undoableChecklistDraftReducer(undoableChecklistDraftReducer(started, itemMoved({ from: 0, to: 1 })), draftClosed());
    expect(closed.present.taskId).toBeNull();
    expect(closed.past).toHaveLength(0);
  });
});
