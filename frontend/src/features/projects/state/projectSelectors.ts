// Reading projects out of RTK Query's cache, and JOINING them with other data (members × people, tasks by project).

import { createSelector } from '@reduxjs/toolkit';
import { createStructuredSelector } from 'reselect';

import type { RootState } from '@/app/rootReducer';

import { selectPeopleEntities } from '@/features/people';

import { apiSlice } from '@/shared/api/apiSlice';
import type { TaskQuery } from '@/shared/api/tasks-api';
import type { Member, ProjectRole, Task, TaskStatus, UserSummary } from '@/shared/domain/types';

import { membersAdapter, projectsAdapter, projectsApi } from '../api/projectsApi';
import { canEditProject, canManageMembers } from '../model/permissions';

const EMPTY_PROJECTS = projectsAdapter.getInitialState();
const EMPTY_MEMBERS = membersAdapter.getInitialState();
const NO_TASKS: Task[] = [];

/** The project list's cache entry (getProjects takes no argument: select() with nothing). */
const selectProjectsData = createSelector(
  [projectsApi.endpoints.getProjects.select()],
  (result) => result.data ?? EMPTY_PROJECTS,
);

/** Adapter selectors over a CACHE ENTRY instead of a slice: getSelectors(input selector). */
export const {
  selectAll: selectAllProjects,
  selectById: selectProjectById,
} = projectsAdapter.getSelectors(selectProjectsData);

export const selectActiveProjects = createSelector([selectAllProjects], (projects) => projects.filter((p) => !p.archived));

/** The argument the project page uses for its task list: ONE place, so the page and the selector share a cache entry. */
export const projectTasksQuery = (projectId: number): TaskQuery => ({ projectId, size: 100 });

export interface MemberRow extends Member {
  /** Joined from the people table; undefined until the name arrives. */
  person: UserSummary | undefined;
}

export interface ProjectView {
  project: ReturnType<typeof selectProjectById>;
  members: MemberRow[];
  tasksByStatus: Record<TaskStatus, Task[]>;
  progress: { done: number; total: number };
  myRole: ProjectRole | null;
  canEdit: boolean;
  canManage: boolean;
}

/**
 * A SELECTOR FACTORY for the project page (one per mounted page: useMemo(makeSelectProjectView, [])).
 * createStructuredSelector (reselect) combines several input selectors into ONE selector returning an OBJECT,
 * and returns the SAME object as long as every input returns the same value: the page re-renders only when
 * something it shows changed. Every input takes (state, projectId).
 */
export function makeSelectProjectView() {
  const selectMembers = createSelector(
    [(state: RootState, projectId: number) => projectsApi.endpoints.getMembers.select(projectId)(state).data ?? EMPTY_MEMBERS,
      selectPeopleEntities],
    (members, people): MemberRow[] =>
      membersAdapter.getSelectors().selectAll(members).map((member) => ({ ...member, person: people[member.userId] })),
  );
  const selectTasks = createSelector(
    [(state: RootState, projectId: number) => apiSlice.endpoints.getTasks.select(projectTasksQuery(projectId))(state).data],
    (page) => page?.items ?? NO_TASKS,
  );
  const selectTasksByStatus = createSelector([selectTasks], (tasks) => ({
    TODO: tasks.filter((task) => task.status === 'TODO'),
    IN_PROGRESS: tasks.filter((task) => task.status === 'IN_PROGRESS'),
    DONE: tasks.filter((task) => task.status === 'DONE'),
  }));
  const selectProgress = createSelector([selectTasks], (tasks) => ({
    done: tasks.filter((task) => task.status === 'DONE').length,
    total: tasks.length,
  }));
  const selectProject = (state: RootState, projectId: number) =>
    selectProjectById(state, projectId) ?? projectsApi.endpoints.getProject.select(projectId)(state).data;
  const selectMyRole = (state: RootState, projectId: number): ProjectRole | null => selectProject(state, projectId)?.myRole ?? null;

  return createStructuredSelector(
    {
      project: selectProject,
      members: selectMembers,
      tasksByStatus: selectTasksByStatus,
      progress: selectProgress,
      myRole: selectMyRole,
      canEdit: (state: RootState, projectId: number) => canEditProject(selectMyRole(state, projectId)),
      canManage: (state: RootState, projectId: number) => canManageMembers(selectMyRole(state, projectId)),
    },
    createSelector,
  );
}
