import { useMemo } from 'react';

import { useAppSelector } from '@/app/hooks';

import { Tag } from '@/shared/ui/styled/Tag';

import { makeSelectLabelsOf } from '../state/labelSelectors';

import styles from './LabelChips.module.scss';

/** The labels of one task as coloured tags. Each instance owns its memoized selector (factory + useMemo). */
export function LabelChips({ labelIds }: { labelIds: readonly number[] }) {
  const selectLabelsOf = useMemo(makeSelectLabelsOf, []);
  const labels = useAppSelector((state) => selectLabelsOf(state, labelIds));
  if (labels.length === 0) return null;
  return (
    <span className={styles.chips}>
      {labels.map((label) => (
        <Tag key={label.id} label={label.name} color={label.color} />
      ))}
    </span>
  );
}
