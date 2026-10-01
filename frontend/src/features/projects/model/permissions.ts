// The project rules the UI needs, as PURE functions (the server enforces the same rules again: ProjectService).

import { PROJECT_ROLES } from '@/shared/domain/types';
import type { ProjectRole } from '@/shared/domain/types';

/** OWNER.atLeast(MEMBER) → true. The index in PROJECT_ROLES is the rank: lower = stronger. */
export function roleAtLeast(role: ProjectRole | null | undefined, minimum: ProjectRole): boolean {
  return role != null && PROJECT_ROLES.indexOf(role) <= PROJECT_ROLES.indexOf(minimum);
}

export const canEditProject = (role: ProjectRole | null | undefined) => roleAtLeast(role, 'MAINTAINER');
export const canManageMembers = (role: ProjectRole | null | undefined) => roleAtLeast(role, 'MAINTAINER');
export const canArchive = (role: ProjectRole | null | undefined) => roleAtLeast(role, 'OWNER');
export const canAddTasks = (role: ProjectRole | null | undefined) => roleAtLeast(role, 'MEMBER');

/** The roles a caller may hand out: only an OWNER can make owners. */
export function assignableRoles(callerRole: ProjectRole | null | undefined): ProjectRole[] {
  return PROJECT_ROLES.filter((role) => role !== 'OWNER' || callerRole === 'OWNER');
}
