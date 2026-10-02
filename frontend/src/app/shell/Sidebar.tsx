import { Bell, ChartColumn, FolderKanban, LayoutDashboard, ListChecks, LogOut, Settings, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode, Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router';
import styled, { css } from 'styled-components';

import { useAuth } from '@/features/auth';
import { OpenTasksBadge } from '@/features/tasks';

import { LanguageSwitcher } from '@/shared/i18n/LanguageSwitcher';
import { Avatar } from '@/shared/ui/styled/Avatar';
import { BrandMark } from '@/shared/ui/BrandMark';
import { media } from '@/shared/ui/styled/media';

/**
 * The graphite rail: the droid's visor band, in both themes. On wide screens it's a permanent column of the layout;
 * below `lg` it becomes a drawer that slides in over the page (AppLayout owns `open`).
 */
const Rail = styled.aside<{ $open: boolean }>`
  /* Mobile first: a drawer fixed to the left edge, slid out of view until it's open. */
  position: fixed;
  inset: 0 auto 0 0;
  z-index: ${({ theme }) => theme.zIndices.drawer};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(6)};
  width: min(300px, 86vw);
  height: 100dvh;
  padding: ${({ theme }) => `${theme.space(5)} ${theme.space(3)}`};
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.rail};
  color: ${({ theme }) => theme.colors.railText};
  box-shadow: ${({ theme }) => theme.shadows.md};
  transform: translateX(${({ $open }) => ($open ? '0' : '-105%')});
  visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  transition:
    transform ${({ theme }) => theme.motion.normal} ${({ theme }) => theme.motion.easing},
    visibility ${({ theme }) => theme.motion.normal};

  /* Desktop: a permanent column of the layout that stays in view while the page scrolls. */
  ${media.lg`
    position: sticky;
    top: 0;
    z-index: auto;
    width: 260px;
    box-shadow: none;
    transform: none;
    visibility: visible;
    transition: none;
  `}
`;

const RailHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.space(2)};
`;

const Brand = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2.5)};
  color: ${({ theme }) => theme.colors.onRail};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 1.3rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: -0.02em;
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.onRail};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.lamp};
    outline-offset: 4px;
    border-radius: ${({ theme }) => theme.radii.sm};
  }
`;

const CloseButton = styled.button.attrs({ type: 'button' })`
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.railMuted};

  &:hover {
    color: ${({ theme }) => theme.colors.onRail};
    background: ${({ theme }) => theme.colors.railActive};
  }

  /* Amber on graphite: the lamp has plenty of contrast on the rail. */
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.lamp};
    outline-offset: 2px;
  }

  ${media.lg`
    display: none;
  `}
`;

const NavList = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const linkStyles = css`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  min-height: 42px;
  padding: 0 ${({ theme }) => theme.space(3)} 0 ${({ theme }) => theme.space(4)};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.railMuted};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-decoration: none;
  transition:
    color ${({ theme }) => theme.motion.fast},
    background-color ${({ theme }) => theme.motion.fast};

  svg {
    flex-shrink: 0;
    width: 19px;
    height: 19px;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.onRail};
    background: ${({ theme }) => theme.colors.railHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.lamp};
    outline-offset: -2px;
  }

  /* The current page: white text and the droid's lamp lit at the left edge. */
  &[aria-current='page'] {
    color: ${({ theme }) => theme.colors.onRail};
    background: ${({ theme }) => theme.colors.railActive};

    &::before {
      content: '';
      position: absolute;
      left: 4px;
      top: 50%;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: ${({ theme }) => theme.colors.lamp};
      box-shadow: 0 0 10px ${({ theme }) => theme.colors.lamp};
      transform: translateY(-50%);
    }
  }
`;

const RailNavLink = styled(NavLink)`
  ${linkStyles}
`;

const LinkLabel = styled.span`
  flex: 1;
  min-width: 0;
`;

const RailFoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
  margin-top: auto;
  padding-top: ${({ theme }) => theme.space(4)};
  border-top: 1px solid ${({ theme }) => theme.colors.railLine};

  select {
    width: 100%;
    color: ${({ theme }) => theme.colors.railText};
    background-color: ${({ theme }) => theme.colors.railField};
    border-color: ${({ theme }) => theme.colors.railLine};

    /* On graphite the bright lamp is the focus colour (the dark amber used on light surfaces is too dim here). */
    &:focus {
      border-color: ${({ theme }) => theme.colors.lamp};
    }
  }

  select option {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.surface};
  }
`;

const Account = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => theme.space(2)};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.railField};
`;

const AccountName = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  line-height: 1.3;

  strong,
  span {
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  strong {
    color: ${({ theme }) => theme.colors.onRail};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }

  span {
    color: ${({ theme }) => theme.colors.railMuted};
    font-size: 0.8125rem;
  }
`;

const LogoutButton = styled.button.attrs({ type: 'button' })`
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.railMuted};

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.onRail};
    background: ${({ theme }) => theme.colors.railActive};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.lamp};
  }
`;

function RailLink({ to, icon: Icon, children, extra }: { to: string; icon: LucideIcon; children: ReactNode; extra?: ReactNode }) {
  return (
    <RailNavLink to={to}>
      <Icon aria-hidden="true" />
      <LinkLabel>{children}</LinkLabel>
      {extra}
    </RailNavLink>
  );
}

interface SidebarProps {
  id: string;
  open: boolean;
  /** Below `lg`: a closed drawer is `inert` (no focus, hidden from screen readers). */
  inert: boolean;
  /** AppLayout moves focus to the close button when the drawer opens. */
  closeButtonRef: Ref<HTMLButtonElement>;
  onClose: () => void;
  onLogout: () => void;
}

export function Sidebar({ id, open, inert, closeButtonRef, onClose, onLogout }: SidebarProps) {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <Rail id={id} $open={open} inert={inert} aria-label={t('nav.menu')}>
      <RailHead>
        <Brand to="/tasks">
          <BrandMark $size={34} />
          {t('brand')}
        </Brand>
        <CloseButton ref={closeButtonRef} aria-label={t('nav.closeMenu')} onClick={onClose}>
          <X aria-hidden="true" />
        </CloseButton>
      </RailHead>

      <NavList aria-label={t('nav.main')}>
        <RailLink to="/tasks" icon={ListChecks} extra={user && <OpenTasksBadge onDark />}>
          {t('nav.tasks')}
        </RailLink>
        <RailLink to="/dashboard" icon={LayoutDashboard}>
          {t('nav.dashboard')}
        </RailLink>
        {user && (
          <>
            <RailLink to="/projects" icon={FolderKanban}>
              {t('nav.projects')}
            </RailLink>
            <RailLink to="/notifications" icon={Bell}>
              {t('nav.notifications')}
            </RailLink>
            <RailLink to="/reports" icon={ChartColumn}>
              {t('nav.reports')}
            </RailLink>
            <RailLink to="/settings" icon={Settings}>
              {t('nav.settings')}
            </RailLink>
          </>
        )}
      </NavList>

      <RailFoot>
        <LanguageSwitcher />
        {user ? (
          <Account>
            <Avatar name={user.displayName} size="md" />
            <AccountName>
              <strong>{user.displayName}</strong>
              <span>@{user.username}</span>
            </AccountName>
            <LogoutButton aria-label={t('nav.logout')} title={t('nav.logout')} onClick={onLogout}>
              <LogOut aria-hidden="true" />
            </LogoutButton>
          </Account>
        ) : (
          <RailNavLink to="/login">{t('nav.login')}</RailNavLink>
        )}
      </RailFoot>
    </Rail>
  );
}
