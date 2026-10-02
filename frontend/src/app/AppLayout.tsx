import { skipToken } from '@reduxjs/toolkit/query/react';
import { Menu } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router';

import { useAuth } from '@/features/auth';
import { NotificationBell } from '@/features/notifications';
import { useGetProjectsQuery } from '@/features/projects';
import { QuickFind } from '@/features/search';
import { LIST_QUERY } from '@/features/tasks';
import { TimerWidget } from '@/features/timeTracking';

import { useGetCategoriesQuery, useGetTasksQuery } from '@/shared/api/apiSlice';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { ThemeToggle } from '@/shared/theme/ThemeToggle';
import { theme as appTheme } from '@/shared/theme/theme';
import { BrandMark } from '@/shared/ui/BrandMark';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';

import { reportRenderError } from './middleware/crash-reporter';
import { Sidebar } from './shell/Sidebar';

import {
  Actions,
  Backdrop,
  Column,
  Main,
  MenuButton,
  MobileBrand,
  SearchSlot,
  Shell,
  Topbar,
} from './AppLayout.styles';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const drawerId = useId();
  const isDesktop = useMediaQuery(`(min-width: ${appTheme.breakpoints.lg})`);

  // The drawer remembers the PAGE it was opened on. Following a link (a new pathname) or widening the window to
  // desktop closes it with no effect and no extra render: `menuOpen` is derived, not stored.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const menuOpen = !isDesktop && openedOn === location.pathname;

  // Focus follows the drawer (a modal while open): into it when it opens, back to the menu button when the user
  // closes it (Escape, the backdrop, the X). After a link inside it, focus stays with the new page instead.
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const closeMenu = useCallback(() => {
    returnFocus.current = true;
    setOpenedOn(null);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      closeButton.current?.focus();
    } else if (returnFocus.current) {
      returnFocus.current = false;
      menuButton.current?.focus(); // after the render that removed `inert` from the page
    }
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen, closeMenu]);

  // App-wide SUBSCRIPTIONS (22.06): the list and the categories stay cached while the layout is mounted,
  // so the header badge, the sidebar and every page's selectors can read them. Replaces S18's
  // fetchTasksIfNeeded effect: RTK Query deduplicates (22.02), and StrictMode's double mount is harmless.
  // S24: only with a session. Anonymous requests would answer 401 → sessionExpired (24.13).
  useGetTasksQuery(user ? LIST_QUERY : skipToken);
  useGetCategoriesQuery(user ? undefined : skipToken);
  useGetProjectsQuery(user ? undefined : skipToken); // project names and MY role, read by many screens' selectors

  async function handleLogout() {
    await logout(); // the server session ends, then slices, cache and user cookies are cleared (24.12)
    navigate('/login', { replace: true });
  }

  return (
    <Shell>
      {/* Keyboard users jump past the navigation; visible only when focused (.skip-link, styles/utilities/_text.scss) */}
      <a className="skip-link" href="#main" inert={menuOpen}>
        {t('nav.skip')}
      </a>
      <Sidebar
        id={drawerId}
        open={menuOpen}
        inert={!isDesktop && !menuOpen}
        closeButtonRef={closeButton}
        onClose={closeMenu}
        onLogout={() => void handleLogout()}
      />
      {menuOpen && <Backdrop onClick={closeMenu} />}

      {/* While the drawer is open, the page behind it is inert: Tab stays inside the drawer. */}
      <Column inert={menuOpen}>
        <Topbar>
          <MenuButton
            ref={menuButton}
            icon
            aria-label={t('nav.menu')}
            aria-expanded={menuOpen}
            aria-controls={drawerId}
            onClick={() => setOpenedOn(location.pathname)}
          >
            <Menu aria-hidden="true" />
          </MenuButton>
          <MobileBrand to="/tasks">
            <BrandMark $size={28} />
            {t('brand')}
          </MobileBrand>
          <SearchSlot>{user && <QuickFind />}</SearchSlot>
          <Actions>
            {user && <TimerWidget />}
            {user && <NotificationBell />}
            <ThemeToggle />
          </Actions>
        </Topbar>

        <Main id="main" tabIndex={-1}>
          {/* S27: a render error breaks one page, not the app; a new path gets a fresh boundary (key). */}
          <ErrorBoundary key={location.pathname} onError={reportRenderError}>
            <Outlet />
          </ErrorBoundary>
        </Main>
      </Column>
    </Shell>
  );
}
