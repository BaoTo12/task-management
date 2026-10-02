import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useAppDispatch, useAppSelector } from '@/app/hooks';

import { UserName } from '@/features/people';

import { NOTIFICATION_TYPES } from '@/shared/domain/types';
import type { AppNotification } from '@/shared/domain/types';
import { formatDate } from '@/shared/i18n/format';
import { useErrorMessage } from '@/shared/i18n/useErrorMessage';
import { Button } from '@/shared/ui/Button';
import { Stack } from '@/shared/ui/styled/Stack';

import { useGetNotificationsInfiniteQuery, useMarkAllReadMutation, useMarkReadMutation } from '../api/notificationsApi';
import { typeMuteToggled } from '../state/notificationActions';

import styles from './NotificationsPage.module.scss';

/**
 * The inbox: an INFINITE query. `data.pages` is every page loaded so far; fetchNextPage() loads the next (older)
 * one with the cursor from getNextPageParam; hasNextPage says whether there is one.
 * The argument ({ unreadOnly }) is part of the cache key: "all" and "unread" are two independent infinite lists.
 */
export function NotificationsPage() {
  const { t, i18n } = useTranslation('notifications');
  const errorMessage = useErrorMessage();
  const dispatch = useAppDispatch();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const muted = useAppSelector((state) => state.notificationsUi.mutedTypes);
  const { data, error, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useGetNotificationsInfiniteQuery({ unreadOnly });
  const [markRead] = useMarkReadMutation();
  const [markAllRead, markingAll] = useMarkAllReadMutation();
  const items: AppNotification[] = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <section>
      <div className="page-head">
        <h1 className="page__title">{t('title')}</h1>
      </div>
      <Stack $direction="row" $gap={3} $align="center" $wrap>
        <label className="form-check">
          <input type="checkbox" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} /> {t('unreadOnly')}
        </label>
        <Button size="sm" disabled={markingAll.isLoading} onClick={() => void markAllRead()}>
          {t('markAllRead')}
        </Button>
      </Stack>

      {isLoading && <p className="text-muted">{t('loading')}</p>}
      {error && (
        <p role="alert" className="text-danger">
          {errorMessage(error)}
        </p>
      )}
      {!isLoading && items.length === 0 && <p className="text-muted">{t('empty')}</p>}

      <ol className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={item.read ? styles.item : `${styles.item} ${styles.unread}`}>
            <UserName id={item.actorId} /> {t(`type.${item.type}`, { subject: item.subject })}{' '}
            {item.taskId != null && <Link to={`/tasks/${item.taskId}`}>{t('open')}</Link>}
            {item.taskId == null && item.projectId != null && <Link to={`/projects/${item.projectId}`}>{t('open')}</Link>}{' '}
            <time className="text-muted" dateTime={item.createdAt}>
              {formatDate(item.createdAt.slice(0, 10), i18n.language)}
            </time>{' '}
            {!item.read && (
              <Button size="sm" onClick={() => void markRead(item.id)}>
                {t('markRead')}
              </Button>
            )}
          </li>
        ))}
      </ol>
      {hasNextPage && (
        <Button size="sm" disabled={isFetchingNextPage} onClick={() => void fetchNextPage()}>
          {isFetchingNextPage ? t('loading') : t('more')}
        </Button>
      )}

      <details className={styles.settings}>
        <summary>{t('settings')}</summary>
        {NOTIFICATION_TYPES.map((type) => (
          <label key={type} className="form-check">
            <input type="checkbox" checked={!muted.includes(type)} onChange={() => dispatch(typeMuteToggled(type))} />{' '}
            {t(`toastFor.${type}`)}
          </label>
        ))}
      </details>
    </section>
  );
}
