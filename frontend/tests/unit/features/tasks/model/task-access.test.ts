import { describe, expect, it } from 'vitest';

import { canEditTask } from '@/features/tasks/model/task-access';
import type { Task, User } from '@/shared/domain/types';

const task = { id: 5, ownerId: 1, assigneeId: 4, projectId: 1 } as Task;
const user = (id: number, role: User['role'] = 'USER'): User => ({ id, username: `u${id}`, displayName: `U${id}`, role, locale: 'en' });

describe('canEditTask', () => {
  it('owner, assignee and admin may edit', () => {
    expect(canEditTask(task, user(1), null)).toBe(true);
    expect(canEditTask(task, user(4), null)).toBe(true);
    expect(canEditTask(task, user(3, 'ADMIN'), null)).toBe(true);
  });

  it('a project member may edit; a viewer may not', () => {
    expect(canEditTask(task, user(2), 'MEMBER')).toBe(true);
    expect(canEditTask(task, user(5), 'VIEWER')).toBe(false);
  });

  it('nobody logged in: no', () => {
    expect(canEditTask(task, null, 'OWNER')).toBe(false);
  });
});
