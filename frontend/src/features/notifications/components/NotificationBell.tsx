import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import styled, { css, keyframes } from 'styled-components';

import { useAppSelector } from '@/app/hooks';

import { useGetUnreadCountQuery } from '../api/notificationsApi';

const ring = keyframes`
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(12deg); }
  75% { transform: rotate(-12deg); }
`;

const Bell = styled(Link)<{ $ringing: boolean }>`
  position: relative;
  text-decoration: none;
  ${({ $ringing }) => $ringing && css`animation: ${ring} 0.4s ease-in-out 2;`}
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Count = styled.span`
  position: absolute;
  top: -6px;
  right: -10px;
  min-width: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: ${({ theme }) => theme.colors.danger};
  color: #fff;
  font-size: 11px;
  text-align: center;
`;

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
    <Bell to="/notifications" $ringing={lastLiveId !== null} key={lastLiveId ?? 0} aria-label={t('bell', { count })}>
      🔔{count > 0 && <Count>{count > 99 ? '99+' : count}</Count>}
    </Bell>
  );
}
