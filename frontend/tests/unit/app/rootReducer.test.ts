import { createStore } from 'redux';
import { describe, expect, it } from 'vitest';

import { rootReducer } from '@/app/rootReducer';

import { pageSizeChanged, sortChanged } from '@/features/listPrefs';
import { taskSelectionToggled, toastShown } from '@/features/ui';

import { loggedOut } from '@/shared/session/authActions';

import { mutationFulfilled } from '@tests/helpers/rtk-query-actions';

describe('rootReducer', () => {
  it('builds the initial state from every slice', () => {
    const store = createStore(rootReducer);
    expect(Object.keys(store.getState())).toEqual(['api', 'listPrefs', 'ui', 'quickFind']);
    expect(store.getState().listPrefs).toEqual({ sort: { key: 'dueDate', direction: 'asc' }, pageSize: 20 });
  });

  it('one action, several reducers: the deleteTask mutation also clears the selection', () => {
    const store = createStore(rootReducer);
    store.dispatch(taskSelectionToggled(5));
    store.dispatch(taskSelectionToggled(7));
    store.dispatch(mutationFulfilled('deleteTask', 5, undefined));
    expect(store.getState().ui.selectedTaskIds).toEqual([7]);
  });

  it('auth/loggedOut resets every slice', () => {
    const store = createStore(rootReducer);
    const initial = store.getState();
    store.dispatch(sortChanged('title', 'desc'));
    store.dispatch(pageSizeChanged(50));
    store.dispatch(toastShown({ tone: 'info', message: 'Hi' }));
    store.dispatch(loggedOut());
    expect(store.getState()).toEqual(initial);
  });

  it('returns the SAME root object when no slice changed', () => {
    const store = createStore(rootReducer);
    const before = store.getState();
    store.dispatch(sortChanged('dueDate', 'asc')); // already the current sort
    expect(store.getState()).toBe(before);
  });
});
