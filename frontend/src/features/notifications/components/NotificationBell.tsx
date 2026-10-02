import { Bell as BellIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/app/hooks';

import { useGetUnreadCountQuery } from '../api/notificationsApi';

import { Bell, Count } from './NotificationBell.styles';

/**
 * The header's bell. ONE subscription to getUnreadCount does three things:
 *   the first request, POLLING every 60 s (only while the tab is focused) as a fallback,
 *   and, through onCacheEntryAdded, the live SSE stream for as long as this component is mounted.
 * When the stream is open, polling isn't needed: pollingInterval 0 turns it off.
 */
export function NotificationBell() {
  const { t } = useTranslation('notifications');
  const stream = useAppSelector((state) => state.notificationsUi.stream);
  const lastLiveId = useAppSelector((state) => state.notificationsUi.lastLiveId);
  const { data: count = 0 } = useGetUnreadCountQuery(undefined, {
    pollingInterval: stream === 'open' ? 0 : 60_000,
    skipPollingIfUnfocused: true,
  });
  return (
    <Bell icon to="/notifications" $ringing={lastLiveId !== null} key={lastLiveId ?? 0} aria-label={t('bell', { count })}>
      <BellIcon aria-hidden="true" />
      {count > 0 && <Count>{count > 99 ? '99+' : count}</Count>}
    </Bell>
  );
}
