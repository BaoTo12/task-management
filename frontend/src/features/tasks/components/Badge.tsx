import { useTranslation } from 'react-i18next';

import { toKebab } from '@/shared/domain/format';
import type { Priority, TaskStatus } from '@/shared/domain/types';

// S25 (25.13): enum values from the API are translated by KEY: status.TODO, priority.HIGH (common namespace).
export function StatusBadge({ status }: { status: TaskStatus }) {
  const { t } = useTranslation();
  return <span className={`badge badge--${toKebab(status)}`}>{t(`status.${status}`)}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { t } = useTranslation();
  return <span className={`badge badge--priority-${toKebab(priority)}`}>{t(`priority.${priority}`)}</span>;
}
