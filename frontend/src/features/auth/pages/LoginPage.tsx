import { useState } from 'react';
// React's SubmitEvent, not the DOM global of the same name: this import shadows it (13B.03)
import type { SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useSearchParams } from 'react-router';

import { useErrorMessage } from '@/shared/i18n/useErrorMessage';
import { Button } from '@/shared/ui/Button';
import { FormField } from '@/shared/ui/forms/FormField';

import { useAuth } from '../context/auth-context';
import { safeReturnTo } from '../model/safe-redirect';

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
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="page__title">{t('auth.title')}</h1>
      <form className="form" onSubmit={handleSubmit} aria-label={t('auth.title')} noValidate>
        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        <FormField label={t('auth.username')} help={t('auth.usernameHelp')}>
          {(control) => (
            <input
              {...control}
              className="form-field__input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
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
    </>
  );
}
