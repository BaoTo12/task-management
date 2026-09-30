import { skipToken } from '@reduxjs/toolkit/query/react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router';
import styled from 'styled-components';

import { useAuth } from '@/features/auth';
import { QuickFind } from '@/features/search';
import { LIST_QUERY, OpenTasksBadge } from '@/features/tasks';

import { useGetCategoriesQuery, useGetTasksQuery } from '@/shared/api/apiSlice';
import { LanguageSwitcher } from '@/shared/i18n/LanguageSwitcher';
import { ThemeToggle } from '@/shared/theme/ThemeToggle';
import { Button } from '@/shared/ui/Button';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { Avatar } from '@/shared/ui/styled/Avatar';
import { NavItem } from '@/shared/ui/styled/NavItem';
import { Stack } from '@/shared/ui/styled/Stack';

import { reportRenderError } from './middleware/crash-reporter';

/**
 * Extending a styled component (09.06): the header's right-hand group is a Stack pushed to the end.
 * Replaces an inline `style={{ marginLeft: 'auto' }}`. `.attrs` fixes the Stack props this group always uses.
 */
const HeaderActions = styled(Stack).attrs({ $direction: 'row', $gap: 3, $align: 'center' })`
  margin-left: auto;
`;

/** The shell shared by every page: header + nav, the current page (<Outlet/>), footer. */
export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // App-wide SUBSCRIPTIONS (22.06): the list and the categories stay cached while the layout is mounted,
  // so the header badge, the sidebar and every page's selectors can read them. Replaces S18's
  // fetchTasksIfNeeded effect: RTK Query deduplicates (22.02), and StrictMode's double mount is harmless.
  // S24: only with a session. Anonymous requests would answer 401 → sessionExpired (24.13).
  useGetTasksQuery(user ? LIST_QUERY : skipToken);
  useGetCategoriesQuery(user ? undefined : skipToken);

  async function handleLogout() {
    await logout(); // the server session ends, then slices, cache and user cookies are cleared (24.12)
    navigate('/login', { replace: true });
  }

  return (
    <div className="page">
      {/* Keyboard users jump past the header; visible only when focused (.skip-link, styles/utilities/_text.scss) */}
      <a className="skip-link" href="#main">
        {t('nav.skip')}
      </a>
      <header className="page__header">
        <span className="page__brand">{t('brand')}</span>
        <nav className="page__nav" aria-label={t('nav.main')}>
          <NavItem to="/tasks">{t('nav.tasks')}</NavItem>
          <NavItem to="/dashboard">{t('nav.dashboard')}</NavItem>
          {user && <NavItem to="/settings">{t('nav.settings')}</NavItem>}
        </nav>
        <HeaderActions>
          {user && <QuickFind />}
          {user && <OpenTasksBadge />}
          <LanguageSwitcher />
          <ThemeToggle />
          {user ? (
            <>
              <Avatar name={user.displayName} size="sm" />
              <Button size="sm" onClick={() => void handleLogout()}>
                {t('nav.logout')}
              </Button>
            </>
          ) : (
            <NavItem to="/login" compact>
              {t('nav.login')}
            </NavItem>
          )}
        </HeaderActions>
      </header>
      <main id="main" className="page__main" tabIndex={-1}>
        {/* S27: a render error breaks one page, not the app; a new path gets a fresh boundary (key). */}
        <ErrorBoundary key={location.pathname} onError={reportRenderError}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <footer className="page__footer">{t('footer')}</footer>
    </div>
  );
}
