import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/hooks';

import { UserName } from '@/features/people';

import { formatDate } from '@/shared/i18n/format';
import { Button } from '@/shared/ui/Button';

import { activityAdapter, loadActivity, selectFeed } from '../state/activitySlice';
import type { FeedScope } from '../state/activitySlice';

const { selectAll } = activityAdapter.getSelectors();

/**
 * A feed for a scope. The effect dispatches the thunk and returns its .abort() as cleanup: leaving the page (or
 * StrictMode's test unmount) cancels the HTTP request, and the slice treats an aborted request as "idle", not an error.
 */
export function ActivityFeed({ kind, id = 0 }: { kind: FeedScope['kind']; id?: number }) {
  const { t, i18n } = useTranslation('activity');
  const dispatch = useAppDispatch();
  // PRIMITIVE props, one memoized scope object: an object prop would be a new reference every parent render, and the
  // effect below would re-run (and re-fetch) each time.
  const stableScope = useMemo<FeedScope>(() => (kind === 'all' ? { kind } : { kind, id }), [kind, id]);
  const feed = useAppSelector((state) => selectFeed(state, stableScope));
  const items = useMemo(() => (feed ? selectAll(feed) : []), [feed]);

  useEffect(() => {
    const request = dispatch(loadActivity({ scope: stableScope }));
    return () => request.abort();
  }, [dispatch, stableScope]);

  return (
    <section aria-labelledby="activity-title" className="activity">
      <h2 id="activity-title">{t('title')}</h2>
      {feed?.status === 'failed' && (
        <p role="alert" className="text-danger">
          {feed.error}
        </p>
      )}
      {items.length === 0 && feed?.status === 'succeeded' && <p className="text-muted">{t('empty')}</p>}
      <ol className="activity__list">
        {items.map((entry) => (
          <li key={entry.id}>
            <UserName id={entry.actorId} />{' '}
            {t(`type.${entry.type}`, { subject: entry.subject, details: entry.details })}{' '}
            <time className="text-muted" dateTime={entry.createdAt}>
              {formatDate(entry.createdAt.slice(0, 10), i18n.language)}
            </time>
          </li>
        ))}
      </ol>
      {feed?.nextCursor != null && (
        <Button size="sm" disabled={feed.status === 'loading'} onClick={() => void dispatch(loadActivity({ scope: stableScope, more: true }))}>
          {feed.status === 'loading' ? t('loading') : t('more')}
        </Button>
      )}
    </section>
  );
}
