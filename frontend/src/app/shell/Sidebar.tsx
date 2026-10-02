import { Bell, ChartColumn, FolderKanban, LayoutDashboard, ListChecks, LogOut, Settings, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode, Ref } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/features/auth';
import { OpenTasksBadge } from '@/features/tasks';

import { LanguageSwitcher } from '@/shared/i18n/LanguageSwitcher';
import { Avatar } from '@/shared/ui/styled/Avatar';
import { BrandMark } from '@/shared/ui/BrandMark';

import {
  Account,
  AccountName,
  Brand,
  CloseButton,
  LinkLabel,
  LogoutButton,
  NavList,
  Rail,
  RailFoot,
  RailHead,
  RailNavLink,
} from './Sidebar.styles';

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
