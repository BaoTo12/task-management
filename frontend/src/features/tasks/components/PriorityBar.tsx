import { useTranslation } from 'react-i18next';

import type { Priority } from '@/shared/domain/types';

import { Segment, Track } from './PriorityBar.styles';

const PRIORITY_LEVEL: Record<Priority, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };

/** Three segments, filled according to priority, in the priority colour (from the theme). */
export function PriorityBar({ priority }: { priority: Priority }) {
  const { t } = useTranslation();
  const level = PRIORITY_LEVEL[priority];
  return (
    <Track role="img" aria-label={t('priorityBar', { priority: t(`priority.${priority}`) })}>
      {[1, 2, 3].map((n) => (
        <Segment key={n} $filled={n <= level} $priority={priority} />
      ))}
    </Track>
  );
}
