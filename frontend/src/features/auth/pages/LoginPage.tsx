import { useRef, useState } from 'react';
// React's SubmitEvent, not the DOM global of the same name: this import shadows it (13B.03)
import type { SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import styled from 'styled-components';

import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { LanguageSwitcher } from '@/shared/i18n/LanguageSwitcher';
import { useErrorMessage } from '@/shared/i18n/useErrorMessage';
import { theme as appTheme } from '@/shared/theme/theme';
import { ThemeToggle } from '@/shared/theme/ThemeToggle';
import { BrandMark } from '@/shared/ui/BrandMark';
import { Button } from '@/shared/ui/Button';
import { FormField } from '@/shared/ui/forms/FormField';
import { media } from '@/shared/ui/styled/media';

import { LoginMascot } from '../components/LoginMascot';
import type { LoginMascotHandle } from '../components/LoginMascot';
import { useAuth } from '../context/auth-context';
import { safeReturnTo } from '../model/safe-redirect';

/*
 * Layout, mobile first:
 *   phone     graphite band (droid + speech bubble) above the form
 *   desktop   graphite "workbench" on the left (the droid is the one bold thing on the page) | form on the right
 */
const Screen = styled.div`
  display: grid;
  min-height: 100dvh;
  background: ${({ theme }) => theme.colors.background};

  ${media.lg`
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  `}
`;

const Bench = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(6)};
  padding: ${({ theme }) => `${theme.space(5)} ${theme.space(5)} ${theme.space(8)}`};
  background: ${({ theme }) => theme.colors.rail};
  color: ${({ theme }) => theme.colors.railText};
  overflow: hidden;

  /* A faint dot grid: the workbench's cutting mat. Decoration, so it sits behind everything. */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(${({ theme }) => theme.colors.railActive} 1px, transparent 1px);
    background-size: 22px 22px;
    pointer-events: none;
  }

  ${media.lg`
    padding: ${({ theme }) => theme.space(10)};
  `}
`;

const Brand = styled.p`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2.5)};
  margin: 0;
  color: ${({ theme }) => theme.colors.onRail};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 1.35rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: -0.02em;
`;

const Stage = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space(5)};
  margin: auto 0;

  ${media.sm`
    flex-direction: row;
    justify-content: center;
  `}

  ${media.lg`
    flex-direction: column;
    gap: ${({ theme }) => theme.space(8)};
  `}
`;

/** The droid sits on a white porthole with an inked rim, the same "sticker" treatment as a lifted card. */
const Porthole = styled.div`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: var(--porthole);
  height: var(--porthole);
  border: 2px solid ${({ theme }) => theme.colors.ink};
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.paperMuted};
  box-shadow:
    6px 6px 0 ${({ theme }) => theme.colors.lamp},
    0 0 0 10px ${({ theme }) => theme.colors.railField};
  --porthole: 168px;

  ${media.lg`
    --porthole: 300px;
  `}
`;

const Bubble = styled.div`
  position: relative;
  max-width: 22rem;
  padding: ${({ theme }) => `${theme.space(4)} ${theme.space(5)}`};
  border: 2px solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.paper};
  color: ${({ theme }) => theme.colors.onPaper};
  box-shadow: 4px 4px 0 ${({ theme }) => theme.colors.railShadow};

  /* The tail points at the droid: up while the bubble is under it (phone, desktop), left while beside it (sm–lg). */
  &::before {
    content: '';
    position: absolute;
    top: -9px;
    left: 50%;
    width: 16px;
    height: 16px;
    border-top: 2px solid ${({ theme }) => theme.colors.ink};
    border-left: 2px solid ${({ theme }) => theme.colors.ink};
    background: ${({ theme }) => theme.colors.paper};
    transform: translateX(-50%) rotate(45deg);
  }

  ${media.sm`
    &::before {
      top: 50%;
      left: -9px;
      transform: translateY(-50%) rotate(-45deg);
    }
  `}

  ${media.lg`
    &::before {
      top: -9px;
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
    }
  `}

  strong {
    display: block;
    margin-bottom: ${({ theme }) => theme.space(1)};
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 1.35rem;
    letter-spacing: -0.01em;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.onPaperMuted};
  }
`;

const FormSide = styled.main`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => `${theme.space(5)} ${theme.space(5)} ${theme.space(10)}`};

  ${media.lg`
    padding: ${({ theme }) => theme.space(10)};
  `}
`;

const Tools = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space(2)};

  select {
    width: auto;
  }
`;

const FormBlock = styled.div`
  width: 100%;
  max-width: 400px;
  margin: auto;
  padding-top: ${({ theme }) => theme.space(8)};

  h1 {
    margin: 0 0 ${({ theme }) => theme.space(2)};
    font-size: clamp(2rem, 1.6rem + 1.5vw, 2.75rem);
    letter-spacing: -0.03em;
  }

  .form {
    max-width: none;
    margin-top: ${({ theme }) => theme.space(8)};
  }

  .form__actions .btn {
    flex: 1;
    min-height: 46px;
    font-size: 1rem;
  }
`;

const Alert = styled.p`
  margin: 0;
  padding: ${({ theme }) => `${theme.space(3)} ${theme.space(4)}`};
  border: 1.5px solid ${({ theme }) => theme.colors.danger};
  border-radius: ${({ theme }) => theme.radii.md};
  background: color-mix(in srgb, ${({ theme }) => theme.colors.danger} 8%, transparent);
  color: ${({ theme }) => theme.colors.danger};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const Demo = styled.p`
  margin: ${({ theme }) => theme.space(6)} 0 0;
  padding: ${({ theme }) => `${theme.space(3)} ${theme.space(4)}`};
  border: 1.5px dashed ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
`;

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
