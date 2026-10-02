import { useRef, useState } from 'react';
// React's SubmitEvent, not the DOM global of the same name: this import shadows it (13B.03)
import type { SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useSearchParams } from 'react-router';

import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { LanguageSwitcher } from '@/shared/i18n/LanguageSwitcher';
import { useErrorMessage } from '@/shared/i18n/useErrorMessage';
import { theme as appTheme } from '@/shared/theme/theme';
import { ThemeToggle } from '@/shared/theme/ThemeToggle';
import { BrandMark } from '@/shared/ui/BrandMark';
import { Button } from '@/shared/ui/Button';
import { FormField } from '@/shared/ui/forms/FormField';

import { LoginMascot } from '../components/LoginMascot';
import type { LoginMascotHandle } from '../components/LoginMascot';
import { useAuth } from '../context/auth-context';
import { safeReturnTo } from '../model/safe-redirect';

import {
  Alert,
  Bench,
  Brand,
  Bubble,
  Demo,
  FormBlock,
  FormSide,
  Porthole,
  Screen,
  Stage,
  Tools,
} from './LoginPage.styles';

export function LoginPage() {
  const { user, login } = useAuth();
  const { t } = useTranslation();
  const errorMessage = useErrorMessage(); // translated by error CODE (25.13)
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const mascot = useRef<LoginMascotHandle>(null);
  const wide = useMediaQuery(`(min-width: ${appTheme.breakpoints.lg})`);
  const returnTo = safeReturnTo(searchParams.get('returnTo'));

  if (user) return <Navigate to={returnTo} replace />; // already logged in (e.g. Back after login)

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (username.trim() === '' || password === '') return setError(t('auth.missing'));
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate(returnTo, { replace: true });
    } catch (err) {
      // One message for "no such user" and "wrong password": the server doesn't say which, neither do we.
      setError(errorMessage(err));
      setPassword('');
      mascot.current?.dizzy();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Bench aria-label={t('auth.mascotLabel')}>
        <Brand>
          <BrandMark $size={34} />
          {t('brand')}
        </Brand>
        <Stage>
          <Porthole>
            <LoginMascot ref={mascot} size={wide ? 236 : 132} label={t('auth.mascotName')} />
          </Porthole>
          <Bubble>
            <strong>{t('auth.greeting')}</strong>
            <p>{t('auth.pitch')}</p>
          </Bubble>
        </Stage>
      </Bench>

      <FormSide>
        <Tools>
          <LanguageSwitcher />
          <ThemeToggle />
        </Tools>
        <FormBlock>
          <h1>{t('auth.title')}</h1>
          <form className="form" onSubmit={handleSubmit} aria-label={t('auth.title')} noValidate>
            {error && <Alert role="alert">{error}</Alert>}
            <FormField label={t('auth.username')}>
              {(control) => (
                <input
                  {...control}
                  className="form-field__input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                />
              )}
            </FormField>
            <FormField label={t('auth.password')}>
              {(control) => (
                <input
                  {...control}
                  type="password"
                  className="form-field__input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              )}
            </FormField>
            <div className="form__actions">
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? t('auth.submitting') : t('auth.submit')}
              </Button>
            </div>
          </form>
          <Demo>{t('auth.usernameHelp')}</Demo>
        </FormBlock>
      </FormSide>
    </Screen>
  );
}
