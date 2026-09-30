import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/app/hooks';

import { Pill } from '@/shared/ui/styled/Pill';

import { selectOpenTaskCount } from '../state/taskSelectors';

/**
 * "N open" in the header. Selects a NUMBER, so it re-renders only when the count changes:
 * not when a title is edited, not when the sort preference changes, not on toasts (17.13).
 */
export function OpenTasksBadge() {
  const openCount = useAppSelector(selectOpenTaskCount);
  const { t } = useTranslation();
  return (
    <Pill $tone={openCount === 0 ? 'success' : 'primary'} aria-live="polite" title={t('openTasks.title')}>
      {t('openTasks.badge', { count: openCount })}
    </Pill>
  );
}
