import { describe, expect, it } from 'vitest';

import { EMPTY_TASK_FORM } from '@/features/tasks/model/task-form';
import { initTaskForm, isTaskFormDirty, taskFormReducer, visibleError } from '@/features/tasks/model/task-form-reducer';
import type { TaskFormAction } from '@/features/tasks/model/task-form-reducer';

const start = initTaskForm(EMPTY_TASK_FORM);
const run = (...actions: TaskFormAction[]) => actions.reduce(taskFormReducer, start);

describe('taskFormReducer (08.07)', () => {
  it('changes one field and clears only that field’s server error', () => {
    const withErrors = taskFormReducer(start, {
      type: 'submitFinished',
      serverErrors: { title: 'Taken', dueDate: 'In the past' },
    });
    const next = taskFormReducer(withErrors, { type: 'fieldChanged', field: 'title', value: 'New' });
    expect(next.values.title).toBe('New');
    expect(next.serverErrors).toEqual({ dueDate: 'In the past' });
  });

  it('returns the SAME state when an already-touched field is blurred again (no re-render)', () => {
    const touched = run({ type: 'fieldBlurred', field: 'title' });
    expect(taskFormReducer(touched, { type: 'fieldBlurred', field: 'title' })).toBe(touched);
  });

  it('hides a client error until the field is touched or a submit is attempted', () => {
    const errors = { title: 'Required' };
    expect(visibleError(start, errors, 'title')).toBeUndefined();
    expect(visibleError(run({ type: 'submitAttempted' }), errors, 'title')).toBe('Required');
  });

  it('reset goes back to the initial values and forgets everything else', () => {
    const edited = run(
      { type: 'fieldChanged', field: 'title', value: 'x' },
      { type: 'submitAttempted' },
      { type: 'reset' },
    );
    expect(edited).toEqual(start);
    expect(isTaskFormDirty(edited)).toBe(false);
  });

  it('rejects a value of the wrong type for a field (compile time)', () => {
    // @ts-expect-error status must be a TaskStatus, not any string
    taskFormReducer(start, { type: 'fieldChanged', field: 'status', value: 'ARCHIVED' });
  });
});
