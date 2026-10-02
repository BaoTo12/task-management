import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from '../context/auth-context';


export function RequireAuth({ children }: { children?: ReactNode }) {
  const { user, isChecking } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (isChecking) return <p className="text-muted">{t('auth.checking')}</p>;
  if (user === null) {
    const returnTo = location.pathname + location.search;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }
  return children ?? <Outlet />;
}
