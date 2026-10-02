import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/app/hooks';

import { Pill } from '@/shared/ui/styled/Pill';

import { selectOpenTaskCount } from '../state/taskSelectors';

/**
 * "N open" next to Tasks in the sidebar. Selects a NUMBER, so it re-renders only when the count changes:
 * not when a title is edited, not when the sort preference changes, not on toasts (17.13).
 * `onDark`: the bright lamp tone for the graphite rail (the light-surface tones are too dim there).
 */
export function OpenTasksBadge({ onDark = false }: { onDark?: boolean }) {
  const openCount = useAppSelector(selectOpenTaskCount);
  const { t } = useTranslation();
  const tone = onDark ? 'lamp' : openCount === 0 ? 'success' : 'primary';
  return (
    <Pill $tone={tone} aria-live="polite" title={t('openTasks.title')}>
      {t('openTasks.badge', { count: openCount })}
    </Pill>
  );
}
