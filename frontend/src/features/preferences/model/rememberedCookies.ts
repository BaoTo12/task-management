// S24 Your Turn (24.16): cookies with the attributes their PURPOSE needs.

import { readCookie, removeCookie, writeCookie } from '@/shared/api/cookies';

// S25: `tf_lang` is now read AND written by i18next's language detector (25.05: lookupCookie + caches), so
// S24's rememberLanguage/readRememberedLanguage were retired: two writers for one cookie would disagree.

/** The Settings page's switch. A PREFERENCE (not user data): persistent, one year. Default: on. */
export function isRememberLastTaskEnabled(): boolean {
  return readCookie('rememberLastTask') !== '0';
}

export function setRememberLastTaskEnabled(enabled: boolean): void {
  writeCookie('rememberLastTask', enabled ? '1' : '0', { days: 365 });
  if (!enabled) removeCookie('lastTask'); // turning it off also forgets what was remembered
}

/**
 * "Remember the last visited task": USER data (it points at one of this user's tasks). A SESSION cookie (no
 * expiry: gone when the browser session ends) and removed on logout by `clearUserData` (23.11).
 */
export function rememberLastTask(taskId: number): void {
  if (!isRememberLastTaskEnabled()) return;
  writeCookie('lastTask', String(taskId));
}

export function readLastTaskId(): number | undefined {
  const raw = readCookie('lastTask');
  if (raw === undefined || !/^[1-9]\d{0,9}$/.test(raw)) return undefined; // a positive integer, nothing else
  return Number(raw);
}
