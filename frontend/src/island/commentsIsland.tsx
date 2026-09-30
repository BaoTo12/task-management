// S49 (49.12): the comments of one task as an island in the JSP details page (/taskflow/tasks/view?id=N).

import { authApi } from '@/features/auth';
import { CommentsSection } from '@/features/comments';

import type { User } from '@/shared/domain/types';

import { mountIsland, readInitialData } from './island';

/** The task id comes from a data- attribute, the user from the JSON block: both written by TaskViewServlet. */
const root = document.getElementById('comments-root');
const taskId = Number(root?.dataset.taskId);
const { user } = readInitialData<{ user: User }>('comments-data');

if (Number.isInteger(taskId) && taskId > 0) {
  // The server-rendered comments inside #comments-root are replaced by React on mount (they were the no-JS fallback).
  mountIsland('comments-root', <CommentsSection taskId={taskId} />, (store) =>
    store.dispatch(authApi.util.upsertQueryData('getMe', undefined, user)),
  );
}
