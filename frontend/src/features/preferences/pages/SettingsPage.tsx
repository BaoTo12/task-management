import { useActionState, useId } from 'react';
import { useFormStatus } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { PAGE_SIZES, pageSizeChanged } from '@/features/listPrefs';

import { SUPPORTED_LANGUAGES } from '@/shared/i18n/i18n';
import { THEME_PREFERENCES, useTheme as useThemePreference } from '@/shared/theme/theme-context';
import { useToast } from '@/shared/toast/toast-context';
import { Button } from '@/shared/ui/Button';

import { isRememberLastTaskEnabled, setRememberLastTaskEnabled } from '../model/rememberedCookies';
import { parseSettings } from '../model/settings-form';
import type { SettingsErrors } from '../model/settings-form';

import { Fieldset } from './SettingsPage.styles';

/** What the action returns, and therefore what `useActionState` holds between submissions. */
type SaveState = { status: 'idle' } | { status: 'saved' } | { status: 'invalid'; errors: SettingsErrors };

/**
 * useFormStatus (react-dom): reads the PENDING state of the <form> it is rendered INSIDE. It must be a child
 * component of the form: called in SettingsPage itself it would see no form and always report pending=false.
 */
function SaveButton() {
  const { pending } = useFormStatus();
  const { t } = useTranslation();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? t('settings.saving') : t('settings.save')}
    </Button>
  );
}

/**
 * User preferences, as an UNCONTROLLED form (11.01) submitted through a React 19 form ACTION.
 *
 * - The DOM owns the values: `defaultValue` / `defaultChecked`, no state per field, no onChange handlers.
 *   On submit the browser gathers them into a FormData (11.03), parsed and validated in model/settings-form.
 * - `<form action={fn}>`: React calls fn(formData) inside a transition. `useActionState` keeps the action's last
 *   result (saved / field errors) and gives `isPending`, so there is no hand-written submitting flag.
 * - Uncontrolled is the right choice here: the values are only needed ONCE, at submit (11.01 §3 trade-offs).
 */
export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const { preference, setPreference } = useThemePreference();
  const pageSize = useAppSelector((state) => state.listPrefs.pageSize);
  const { show } = useToast();
  const pageSizeHelpId = useId();

  const [state, formAction] = useActionState<SaveState, FormData>(async (_previous, formData) => {
    const result = parseSettings(formData);
    if (!result.ok) return { status: 'invalid', errors: result.errors };

    const { theme, language, pageSize: size, rememberLastTask } = result.settings;
    setPreference(theme);
    dispatch(pageSizeChanged(size));
    setRememberLastTaskEnabled(rememberLastTask);
    await i18n.changeLanguage(language); // async: loads the language's namespaces; the form stays pending meanwhile
    show({ tone: 'success', message: 'Settings saved.', i18nKey: 'settings.saved' });
    return { status: 'saved' };
  }, { status: 'idle' });

  const errors = state.status === 'invalid' ? state.errors : {};

  return (
    <>
      <h1 className="page__title">{t('settings.title')}</h1>
      {/* key: after a language change the defaults below are re-read (an uncontrolled form ignores new defaultValues) */}
      <form key={i18n.resolvedLanguage} action={formAction} className="form panel form--panel" noValidate>
        <Fieldset>
          <legend>{t('settings.theme')}</legend>
          {THEME_PREFERENCES.map((option) => (
            <label key={option}>
              <input type="radio" name="theme" value={option} defaultChecked={option === preference} />
              {t(`theme.${option}`)}
            </label>
          ))}
        </Fieldset>

        <div className="form-field">
          <label className="form-field__label" htmlFor="settings-language">
            {t('language.label')}
          </label>
          <select id="settings-language" name="language" className="form-field__input" defaultValue={i18n.resolvedLanguage}>
            {SUPPORTED_LANGUAGES.map((language) => (
              <option key={language} value={language} lang={language}>
                {t(`language.${language}`)}
              </option>
            ))}
          </select>
        </div>

        <div className={`form-field${errors.pageSize ? ' form-field--error' : ''}`}>
          <label className="form-field__label" htmlFor="settings-page-size">
            {t('settings.pageSize')}
          </label>
          <input
            id="settings-page-size"
            name="pageSize"
            type="number"
            className="form-field__input"
            defaultValue={pageSize}
            min={PAGE_SIZES[0]}
            max={PAGE_SIZES[PAGE_SIZES.length - 1]}
            step={10}
            aria-invalid={Boolean(errors.pageSize)}
            aria-describedby={pageSizeHelpId}
          />
          <p id={pageSizeHelpId} className={errors.pageSize ? 'form-field__error' : 'form-field__help'}>
            {t('settings.pageSizeHelp', { sizes: PAGE_SIZES.join(', ') })}
          </p>
        </div>

        <label>
          <input type="checkbox" name="rememberLastTask" defaultChecked={isRememberLastTaskEnabled()} />{' '}
          {t('settings.rememberLastTask')}
        </label>

        <div className="form__actions">
          <SaveButton />
          {state.status === 'saved' && (
            <span className="text-muted" role="status">
              {t('settings.saved')}
            </span>
          )}
        </div>
      </form>
    </>
  );
}
