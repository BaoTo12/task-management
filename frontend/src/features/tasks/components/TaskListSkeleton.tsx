import { useTranslation } from 'react-i18next';

import { SkeletonCard, SkeletonLine } from '@/shared/ui/styled/Skeleton';

/**
 * S27: placeholder cards while the FIRST page loads (isLoading, 22.05). Same grid as the real list, so nothing
 * jumps when the data arrives. Screen readers get one "Loading tasks…" status instead of empty boxes.
 */
export function TaskListSkeleton({ count = 3 }: { count?: number }) {
  const { t } = useTranslation('tasks');
  return (
    <div className="task-grid" aria-busy="true">
      <span role="status" className="visually-hidden">
        {t('loadingList')}
      </span>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index}>
          <SkeletonLine $width="60%" />
          <SkeletonLine />
          <SkeletonLine $width="40%" />
        </SkeletonCard>
      ))}
    </div>
  );
}
