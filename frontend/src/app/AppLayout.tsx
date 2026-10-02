import { skipToken } from '@reduxjs/toolkit/query/react';
import { Menu } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import styled from 'styled-components';

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
import { Button } from '@/shared/ui/Button';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { media } from '@/shared/ui/styled/media';

import { reportRenderError } from './middleware/crash-reporter';
import { Sidebar } from './shell/Sidebar';

/**
 * The app shell, mobile first:
 *   phone/tablet   top bar (menu · brand · actions) + search on its own row; the sidebar is a drawer
 *   desktop (lg+)  graphite sidebar | top bar (search · actions) over the page
 */
const Shell = styled.div`
  min-height: 100dvh;

  ${media.lg`
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
  `}
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100dvh;
`;

const Topbar = styled.header`
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndices.header};
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  grid-template-areas:
    'menu brand . actions'
    'search search search search';
  align-items: center;
  gap: ${({ theme }) => `${theme.space(3)} ${theme.space(2)}`};
  padding: ${({ theme }) => `${theme.space(3)} ${theme.space(4)}`};
  background: color-mix(in srgb, ${({ theme }) => theme.colors.background} 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  ${media.md`
    grid-template-columns: auto auto minmax(0, 28rem) 1fr auto;
    grid-template-areas: 'menu brand search . actions';
    padding: ${({ theme }) => `${theme.space(3)} ${theme.space(6)}`};
  `}

  ${media.lg`
    grid-template-columns: minmax(0, 30rem) 1fr auto;
    grid-template-areas: 'search . actions';
    padding: ${({ theme }) => `${theme.space(3)} ${theme.space(8)}`};
  `}
`;

/** The design system's square icon button, placed in the grid and hidden once the sidebar is permanent. */
const MenuButton = styled(Button)`
  grid-area: menu;

  ${media.lg`
    display: none;
  `}
`;

const MobileBrand = styled(Link)`
  grid-area: brand;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 1.15rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-decoration: none;

  ${media.lg`
    display: none;
  `}
`;

const SearchSlot = styled.div`
  grid-area: search;
  min-width: 0;
`;

const Actions = styled.div`
  grid-area: actions;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space(2)};
  min-width: 0;
`;

const Main = styled.main`
  flex: 1;
  width: 100%;
  max-width: 1240px;
  padding: ${({ theme }) => `${theme.space(6)} ${theme.space(4)} ${theme.space(12)}`};

  &:focus {
    outline: none;
  }

  ${media.md`
    padding: ${({ theme }) => `${theme.space(8)} ${theme.space(6)} ${theme.space(16)}`};
  `}

  ${media.lg`
    padding: ${({ theme }) => `${theme.space(8)} ${theme.space(8)} ${theme.space(16)}`};
  `}
`;

/** Dims the page behind the open drawer; a click on it closes the drawer. */
const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: calc(${({ theme }) => theme.zIndices.drawer} - 1);
  background: ${({ theme }) => theme.colors.scrim};

  ${media.lg`
    display: none;
  `}
`;

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
