import { Bell as BellIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styled, { css, keyframes } from 'styled-components';

import { useAppSelector } from '@/app/hooks';

import { ButtonLink } from '@/shared/ui/ButtonLink';

import { useGetUnreadCountQuery } from '../api/notificationsApi';

const ring = keyframes`
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(12deg); }
  75% { transform: rotate(-12deg); }
`;

/** The design system's square icon button (.btn--icon), plus room for the count and the ring animation. */
const Bell = styled(ButtonLink)<{ $ringing: boolean }>`
  position: relative;

  svg {
    ${({ $ringing }) => $ringing && css`animation: ${ring} 0.4s ease-in-out 2;`}
  }

  @media (prefers-reduced-motion: reduce) {
    svg {
      animation: none;
    }
  }
`;

/** Unread count: the amber lamp with graphite text, the same signal colour as everywhere else. */
const Count = styled.span`
  position: absolute;
  top: -7px;
  right: -7px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border: 1.5px solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.lamp};
  color: ${({ theme }) => theme.colors.onLamp};
  font-size: 0.6875rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  line-height: 17px;
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
    <Bell icon to="/notifications" $ringing={lastLiveId !== null} key={lastLiveId ?? 0} aria-label={t('bell', { count })}>
      <BellIcon aria-hidden="true" />
      {count > 0 && <Count>{count > 99 ? '99+' : count}</Count>}
    </Bell>
  );
}
