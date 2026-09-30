// Parsing the Settings form: FormData in, a typed result out. Framework-free (tested without React).
// 11.03: the DOM speaks STRINGS. Every value is checked against an allow-list before it becomes app state:
// a form is user input, and DevTools can put any value in any field.
import { PAGE_SIZES } from '@/features/listPrefs';
import type { PageSize } from '@/features/listPrefs';

import { isAppLanguage } from '@/shared/i18n/i18n';
import type { AppLanguage } from '@/shared/i18n/i18n';
import { isThemePreference } from '@/shared/theme/theme-context';
import type { ThemePreference } from '@/shared/theme/theme-context';

export interface Settings {
  theme: ThemePreference;
  language: AppLanguage;
  pageSize: PageSize;
  rememberLastTask: boolean;
}

/** Field name → message key (translated by the page). Only the fields that can be invalid. */
export type SettingsErrors = Partial<Record<keyof Settings, 'invalid' | 'pageSize'>>;

/** A discriminated union (06.06) for the action's result: callers must check `ok` before using `settings`. */
export type ParseResult = { ok: true; settings: Settings } | { ok: false; errors: SettingsErrors };

/** `number` → PageSize, through the generic guard (13B.05): PAGE_SIZES is `readonly [10, 20, 50]`. */
const isPageSize = (value: number): value is PageSize => (PAGE_SIZES as readonly number[]).includes(value);

export function parseSettings(form: FormData): ParseResult {
  const theme = form.get('theme');
  const language = form.get('language');
  // 11.03 §5: a number input still submits a STRING; Number('') is 0, so check for '' first.
  const rawPageSize = form.get('pageSize');
  const pageSize = typeof rawPageSize === 'string' && rawPageSize !== '' ? Number(rawPageSize) : Number.NaN;
  // 11.03 §3: an unchecked checkbox is simply ABSENT from FormData; a checked one sends its value ("on").
  const rememberLastTask = form.get('rememberLastTask') === 'on';

  const errors: SettingsErrors = {};
  if (!isThemePreference(theme)) errors.theme = 'invalid';
  if (!isAppLanguage(language)) errors.language = 'invalid';
  if (!isPageSize(pageSize)) errors.pageSize = 'pageSize';

  if (!isThemePreference(theme) || !isAppLanguage(language) || !isPageSize(pageSize)) return { ok: false, errors };
  return { ok: true, settings: { theme, language, pageSize, rememberLastTask } };
}
