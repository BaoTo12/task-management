import { isFulfilled } from '@reduxjs/toolkit';

import type { AppStartListening } from '@/app/listeners';

import { fetchMissingUsers } from './userThunks';

/** Fields that hold a USER id anywhere in TaskFlow's API shapes. */
const USER_ID_KEYS = new Set(['ownerId', 'assigneeId', 'userId', 'actorId', 'createdBy', 'authorId']);

/** Every user id inside a response, however it's nested (pages, arrays, infinite-query pages). Bounded depth. */
export function userIdsIn(value: unknown, depth = 0, found = new Set<number>()): Set<number> {
  if (depth > 5 || value === null || typeof value !== 'object') return found;
  if (Array.isArray(value)) {
    for (const item of value) userIdsIn(item, depth + 1, found);
    return found;
  }
  for (const [key, field] of Object.entries(value)) {
    if (USER_ID_KEYS.has(key) && typeof field === 'number') found.add(field);
    else if (typeof field === 'object') userIdsIn(field, depth + 1, found);
  }
  return found;
}

/**
 * "Whatever the server sent, make sure we know the people it mentions." A listener on a MATCHER that accepts every
 * fulfilled async action (RTK Query's and createAsyncThunk's alike: `isFulfilled`), so the people feature needs to
 * know nothing about tasks, projects or notifications.
 * DEBOUNCED with the listener API: cancelActiveListeners() aborts the previous run's delay, so a burst of responses
 * (a page load fires several) collects its ids and sends ONE request after 50 ms of quiet.
 * `waiting` is per store: this function runs once per store (createAppListenerMiddleware).
 */
export function addPeopleListeners(startAppListening: AppStartListening) {
  const waiting = new Set<number>();
  startAppListening({
    matcher: isFulfilled,
    effect: async (action, listenerApi) => {
      for (const id of userIdsIn(action.payload)) waiting.add(id);
      if (waiting.size === 0) return;
      listenerApi.cancelActiveListeners();
      await listenerApi.delay(50);                 // throws (and ends this run) if a newer action cancelled it
      const ids = [...waiting];
      waiting.clear();
      void listenerApi.dispatch(fetchMissingUsers(ids));   // `condition` drops ids we already have
    },
  });
}
