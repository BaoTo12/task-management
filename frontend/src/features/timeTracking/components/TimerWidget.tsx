import { skipToken } from '@reduxjs/toolkit/query/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useAppSelector } from '@/app/hooks';

import { useGetTaskQuery } from '@/shared/api/apiSlice';
import { Button } from '@/shared/ui/Button';

import { useGetRunningTimerQuery, useStopTimerMutation } from '../api/timeApi';
import { formatStopwatch } from '../model/duration';
import { selectElapsedSeconds } from '../state/timerSelectors';
import { selectRunningTimer } from '../state/timerSlice';

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
  return (
    <span className="timer-widget" role="timer" aria-live="off">
      <Link to={`/tasks/${running.taskId}`}>{title ?? t('timer.task', { id: running.taskId })}</Link>{' '}
      <strong>{formatStopwatch(seconds)}</strong>{' '}
      <Button size="sm" disabled={stopping.isLoading} onClick={() => void stopTimer()}>
        {t('timer.stop')}
      </Button>
    </span>
  );
}
