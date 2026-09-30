import { memo, useDeferredValue, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/app/hooks';

import { TASK_STATUSES } from '@/shared/domain/types';
import type { TaskStatus } from '@/shared/domain/types';

import { makeSelectTaskIdsByStatus } from '../state/taskListSelectors';
import { TaskListItem } from './TaskListItem';

import styles from './Board.module.scss';

interface BoardProps {
  onToggle: (id: number) => void;
  onEditTitle: (id: number, title: string) => void;
}

export function Board({ onToggle, onEditTitle }: BoardProps) {
  const { t } = useTranslation('tasks');
  const filterId = useId();
  const [filter, setFilter] = useState('');
  // 08.14 §4 useDeferredValue: the INPUT renders with `filter` (urgent: every keystroke shows at once); the
  // COLUMNS render with `deferredFilter`, a copy React updates in a background render it can interrupt when the
  // next key arrives. Unlike a debounce (08.12) there is no fixed delay: a fast machine updates almost instantly.
  // It works because BoardColumn is memoised: with the OLD deferred value its props are unchanged, so it's skipped.
  const deferredFilter = useDeferredValue(filter.trim().toLowerCase());
  const isStale = deferredFilter !== filter.trim().toLowerCase();

  return (
    <>
      <div className="form-field">
        <label className="form-field__label" htmlFor={filterId}>
          {t('board.filter')}
        </label>
        <input
          id={filterId}
          type="search"
          className="form-field__input"
          placeholder={t('board.filterPlaceholder')}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className={styles.board} style={{ opacity: isStale ? 0.7 : 1 }}>
        {TASK_STATUSES.map((status) => (
          <BoardColumn key={status} status={status} filter={deferredFilter} onToggle={onToggle} onEditTitle={onEditTitle} />
        ))}
      </div>
    </>
  );
}

interface BoardColumnProps {
  status: TaskStatus;
  filter: string;
  onToggle: (id: number) => void;
  onEditTitle: (id: number, title: string) => void;
}

const BoardColumn = memo(function BoardColumn({ status, filter, onToggle, onEditTitle }: BoardColumnProps) {
  // One selector INSTANCE per column (21.07): created once per mounted column, never shared.
  const selectTaskIdsByStatus = useMemo(() => makeSelectTaskIdsByStatus(), []);
  const taskIds = useAppSelector((state) => selectTaskIdsByStatus(state, status));
  const headingId = `column-${status}`;
  const { t } = useTranslation(['tasks', 'common']);

  return (
    <section className={styles.column} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        {t(`common:status.${status}`)} <span className={styles.count}>{taskIds.length}</span>
      </h2>
      {taskIds.length === 0 ? (
        <p className={styles.empty}>{t('board.empty')}</p>
      ) : (
        <div className={styles.cards}>
          {taskIds.map((id) => (
            <TaskListItem key={id} taskId={id} filter={filter} onToggle={onToggle} onEditTitle={onEditTitle} />
          ))}
        </div>
      )}
    </section>
  );
});
