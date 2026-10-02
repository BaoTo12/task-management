import { skipToken } from '@reduxjs/toolkit/query/react';
import { Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useAppSelector } from '@/app/hooks';

import { useGetTaskQuery } from '@/shared/api/apiSlice';

import { useGetRunningTimerQuery, useStopTimerMutation } from '../api/timeApi';
import { formatStopwatch } from '../model/duration';
import { selectElapsedSeconds } from '../state/timerSelectors';
import { selectRunningTimer } from '../state/timerSlice';

import styles from './TimerWidget.module.scss';

/**
 * The header stopwatch. It subscribes to GET /api/timer once (the slice mirrors the answer); after that the seconds come
 * from timerMiddleware's ticks, not from the server. `selectFromResult` picks only the TITLE from the task's cache
 * entry: this component re-renders when the title changes, not when anything else about the task does.
 */
export function TimerWidget() {
  const { t } = useTranslation('work');
  useGetRunningTimerQuery();
  const running = useAppSelector(selectRunningTimer);
  const seconds = useAppSelector(selectElapsedSeconds);
  const { title } = useGetTaskQuery(running ? running.taskId : skipToken, {
    selectFromResult: ({ data }) => ({ title: data?.title }),
  });
  const [stopTimer, stopping] = useStopTimerMutation();

  if (!running) return null;
  // A lit lamp while time is running.
  return (
    <span className={styles.widget} role="timer" aria-live="off">
      <span className={styles.lamp} aria-hidden="true" />
      <Link className={styles.task} to={`/tasks/${running.taskId}`}>
        {title ?? t('timer.task', { id: running.taskId })}
      </Link>
      <strong className={styles.time}>{formatStopwatch(seconds)}</strong>
      <button
        type="button"
        className={styles.stop}
        aria-label={t('timer.stop')}
        title={t('timer.stop')}
        disabled={stopping.isLoading}
        onClick={() => void stopTimer()}
      >
        <Square aria-hidden="true" size={12} fill="currentColor" />
      </button>
    </span>
  );
}
