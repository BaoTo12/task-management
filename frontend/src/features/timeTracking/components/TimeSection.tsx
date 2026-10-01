import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/app/hooks';

import { useAuth } from '@/features/auth';
import { UserName } from '@/features/people';

import { fieldErrorsOf } from '@/shared/api/api-error';
import { formatDate } from '@/shared/i18n/format';
import { useErrorMessage } from '@/shared/i18n/useErrorMessage';
import { Button } from '@/shared/ui/Button';
import { Stack } from '@/shared/ui/styled/Stack';

import { useDeleteTimeEntryMutation, useGetTimeEntriesQuery, useLogTimeMutation, useStartTimerMutation } from '../api/timeApi';
import { formatMinutes } from '../model/duration';
import { selectRunningTimer } from '../state/timerSlice';

/** "2026-09-30T08:00" (what <input type="datetime-local"> gives) → an ISO instant in UTC. */
const toInstant = (local: string) => new Date(local).toISOString();

/** Tracked time on one task: the total, the entries, a timer button and a "log time by hand" form. */
export function TimeSection({ taskId, canEdit }: { taskId: number; canEdit: boolean }) {
  const { t, i18n } = useTranslation('work');
  const { user } = useAuth();
  const errorMessage = useErrorMessage();
  const { data: entries = [] } = useGetTimeEntriesQuery(taskId);
  const running = useAppSelector(selectRunningTimer);
  const [startTimer, starting] = useStartTimerMutation();
  const [logTime, logging] = useLogTimeMutation();
  const [deleteEntry] = useDeleteTimeEntryMutation();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [note, setNote] = useState('');
  const total = entries.reduce((sum, entry) => sum + entry.minutes, 0);
  const fieldErrors = fieldErrorsOf(logging.error);

  async function handleLog(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await logTime({ taskId, startedAt: toInstant(from), endedAt: toInstant(to), note }).unwrap();
      setFrom('');
      setTo('');
      setNote('');
    } catch {
      // field errors render below
    }
  }

  return (
    <section aria-labelledby="time-title" className="time">
      <h2 id="time-title">{t('time.title', { total: formatMinutes(total) })}</h2>
      {canEdit && running?.taskId !== taskId && (
        <Button size="sm" variant="primary" disabled={starting.isLoading} onClick={() => void startTimer(taskId)}>
          {running ? t('time.switch') : t('time.start')}
        </Button>
      )}
      {running?.taskId === taskId && <p className="text-muted">{t('time.running')}</p>}
      <ul className="time__entries">
        {entries.map((entry) => (
          <li key={entry.id}>
            <UserName id={entry.userId} /> · {formatDate(entry.startedAt.slice(0, 10), i18n.language)} ·{' '}
            {entry.endedAt === null ? t('time.inProgress') : formatMinutes(entry.minutes)}
            {entry.note && <span className="text-muted"> · {entry.note}</span>}
            {entry.userId === user?.id && entry.endedAt !== null && (
              <Button size="sm" variant="danger" aria-label={t('time.delete')} onClick={() => void deleteEntry({ taskId, id: entry.id })}>
                ×
              </Button>
            )}
          </li>
        ))}
      </ul>
      {canEdit && (
        <form className="form--inline" onSubmit={(event) => void handleLog(event)}>
          <Stack $direction="row" $gap={2} $wrap>
            <label>
              {t('time.from')} <input type="datetime-local" value={from} onChange={(event) => setFrom(event.target.value)} required />
            </label>
            <label>
              {t('time.to')} <input type="datetime-local" value={to} onChange={(event) => setTo(event.target.value)} required />
            </label>
            <input aria-label={t('time.note')} placeholder={t('time.note')} value={note} onChange={(event) => setNote(event.target.value)} maxLength={200} />
            <Button size="sm" type="submit" disabled={logging.isLoading}>
              {t('time.log')}
            </Button>
          </Stack>
          {logging.error && (
            <p role="alert" className="text-danger">
              {fieldErrors?.endedAt ?? errorMessage(logging.error)}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
