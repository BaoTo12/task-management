import type { AppStartListening } from '@/app/listeners';

import { projectsApi } from '@/features/projects';
import { toastShown } from '@/features/ui';

import { apiSlice } from '@/shared/api/apiSlice';

import { notificationReceived } from './notificationActions';

/**
 * Reactions to a LIVE notification:
 *   1. a toast, unless the user muted that type (the listener reads the state: getState())
 *   2. the data it's about may have changed on the server: invalidate those cache entries so subscribed screens
 *      refetch (an assignment adds a task to MY lists; a project invitation adds a project).
 */
export function addNotificationListeners(startAppListening: AppStartListening) {
  startAppListening({
    actionCreator: notificationReceived,
    effect: (action, listenerApi) => {
      const notification = action.payload;
      if (!listenerApi.getState().notificationsUi.mutedTypes.includes(notification.type)) {
        listenerApi.dispatch(
          toastShown({
            tone: 'info',
            message: notification.subject,
            i18nKey: `notifications:toast.${notification.type}`,
            values: { subject: notification.subject },
          }),
        );
      }
      if (notification.taskId != null) {
        listenerApi.dispatch(apiSlice.util.invalidateTags([{ type: 'Task', id: notification.taskId }, { type: 'Task', id: 'LIST' }]));
      }
      if (notification.type === 'PROJECT_INVITED' || notification.type === 'PROJECT_REMOVED') {
        // projectsApi.util knows the 'Project' tag type (added by its enhanceEndpoints); apiSlice.util doesn't.
        listenerApi.dispatch(projectsApi.util.invalidateTags([{ type: 'Project', id: 'LIST' }, { type: 'Task', id: 'LIST' }]));
      }
    },
  });
}
