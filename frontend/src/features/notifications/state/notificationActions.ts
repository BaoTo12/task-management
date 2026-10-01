import { createAction } from '@reduxjs/toolkit';

import type { AppNotification, NotificationType } from '@/shared/domain/types';

/**
 * A notification arrived LIVE (Server-Sent Events). createAction with a PREPARE callback: the caller passes the
 * notification; prepare adds when the browser received it. Non-deterministic values (now, random ids) belong in
 * prepare or the caller, never in a reducer (reducers must be pure).
 * In its own module: the API (which dispatches it) and the UI reducer (which handles it) both import it.
 */
export const notificationReceived = createAction('notifications/received', (notification: AppNotification) => ({
  payload: notification,
  meta: { receivedAt: Date.now() },
}));

export const panelToggled = createAction<boolean | undefined>('notifications/panelToggled');

/** Don't pop a toast for this type any more (the inbox still lists it). */
export const typeMuteToggled = createAction<NotificationType>('notifications/typeMuteToggled');

/** The live stream's state, so the UI can fall back to polling when it's down. */
export const streamStatusChanged = createAction<'connecting' | 'open' | 'closed'>('notifications/streamStatusChanged');
