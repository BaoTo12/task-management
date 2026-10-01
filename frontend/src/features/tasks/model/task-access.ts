// Who may edit a task, as the UI needs it: the SAME rule as the server's TaskAccess.canEdit (the server checks again;
// this only decides which controls to show). Pure: testable without React or a store.
import type { ProjectRole, Task, User } from '@/shared/domain/types';

const EDITOR_ROLES: readonly ProjectRole[] = ['OWNER', 'MAINTAINER', 'MEMBER'];

export function canEditTask(task: Task, user: User | null | undefined, projectRole: ProjectRole | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN' || task.ownerId === user.id || task.assigneeId === user.id) return true;
  return projectRole != null && EDITOR_ROLES.includes(projectRole);
}
