import { isAnyOf } from '@reduxjs/toolkit';
import type { AppStartListening } from '@/app/listeners';
import { toastShown } from '@/features/ui';
import { loggedOut, sessionExpired } from '@/shared/session/authActions';
import { authApi } from '../api/authApi';
import { clearUserData } from './clearUserData';

const selectMe = authApi.endpoints.getMe.select();
/** Tomcat's default session timeout is 30 minutes (28.10): ping well inside it. */
const KEEP_ALIVE_MS = 10 * 60 * 1000;

/**
 * 24.13: the server said 401 to a request that needed a session. Forget the user and their data; `RequireAuth`
 * then sends them to /login?returnTo=<where they were>. After a successful login they come back there.
 */
export function addAuthListeners(startAppListening: AppStartListening) {
  startAppListening({
    actionCreator: sessionExpired,
    effect: (_action, listenerApi) => {
      // Several requests can fail with 401 at once: react to the first only. Once "me" is null, ignore.
      if (!selectMe(listenerApi.getState()).data) return;
      listenerApi.dispatch(clearUserData());
      listenerApi.dispatch(authApi.util.upsertQueryData('getMe', undefined, null));
      listenerApi.dispatch(toastShown({ tone: 'info', message: 'Your session has expired. Please log in again.', i18nKey: 'auth.sessionExpired' }));
    },
  });

  /**
   * Session keep-alive (21.14 in full): while someone is logged in AND the tab is visible, ask "who am I?" every
   * few minutes. The server session's idle timer restarts, and an expired session is noticed within minutes
   * (401 → sessionExpired → the listener above) instead of at the next click.
   *
   * - predicate(action, current, previous): runs on EVERY action; true only on the transition nobody → someone.
   * - fork: a child task running the loop, cancelled with its parent.
   * - forkApi.delay: a cancellable sleep (it throws TaskAbortError when the fork is cancelled).
   * - take(matcher): pause the effect until logout / expiry, then cancel the loop.
   * - cancelActiveListeners: a second login in the same tab replaces the first loop instead of adding one.
   */
  startAppListening({
    predicate: (_action, currentState, previousState) =>
      Boolean(selectMe(currentState).data) && !selectMe(previousState).data,
    effect: async (_action, listenerApi) => {
      listenerApi.cancelActiveListeners();
      const loop = listenerApi.fork(async (forkApi) => {
        for (; ;) {
          await forkApi.delay(KEEP_ALIVE_MS);
          if (document.visibilityState !== 'visible') continue; // a hidden tab lets the session idle out
          await listenerApi.dispatch(
            authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true, subscribe: false }),
          );
        }
      });
      await listenerApi.take(isAnyOf(loggedOut, sessionExpired));
      loop.cancel();
    },
  });
}
