// Projects and members over RTK Query, injected into the ONE api slice.
// Server data is stored NORMALISED in the cache: transformResponse runs an entity adapter over each response, so
// lookups by id are O(1) and updates touch one entity (updateQueryData + adapter.updateOne / removeOne).

import { createEntityAdapter } from '@reduxjs/toolkit';
import type { EntityState } from '@reduxjs/toolkit';

import { apiSlice } from '@/shared/api/apiSlice';
import { isArrayOf, isMember, isProject } from '@/shared/domain/guards';
import type { Member, Project, ProjectRole } from '@/shared/domain/types';

export const projectsAdapter = createEntityAdapter<Project>({
  sortComparer: (a, b) => Number(a.archived) - Number(b.archived) || a.name.localeCompare(b.name), // archived last
});

/** One members cache entry per project, so the user id alone identifies a member inside it. */
export const membersAdapter = createEntityAdapter<Member, number>({
  selectId: (member) => member.userId,
  sortComparer: (a, b) => a.joinedAt.localeCompare(b.joinedAt),
});

export const PROJECT_LIST = { type: 'Project', id: 'LIST' } as const;

export interface ProjectChanges {
  name?: string;
  description?: string;
  color?: string;
  archived?: boolean;
}

export const projectsApi = apiSlice.enhanceEndpoints({ addTagTypes: ['Project', 'Member'] }).injectEndpoints({
  endpoints: (build) => ({
    getProjects: build.query<EntityState<Project, number>, void>({
      query: () => ({ url: '/projects', validate: isArrayOf(isProject) }),
      transformResponse: (projects: Project[]) => projectsAdapter.setAll(projectsAdapter.getInitialState(), projects),
      providesTags: (result) => [...(result?.ids.map((id) => ({ type: 'Project' as const, id })) ?? []), PROJECT_LIST],
    }),
    getProject: build.query<Project, number>({
      query: (id) => ({ url: `/projects/${id}`, validate: isProject }),
      providesTags: (_result, _error, id) => [{ type: 'Project', id }],
    }),
    createProject: build.mutation<Project, { name: string; description?: string; color?: string }>({
      query: (body) => ({ url: '/projects', method: 'POST', data: body, validate: isProject }),
      invalidatesTags: (_result, error) => (error ? [] : [PROJECT_LIST]),
    }),
    /** OPTIMISTIC: the list and the details show the change at once; undone if the server refuses. */
    updateProject: build.mutation<Project, { id: number; changes: ProjectChanges }>({
      query: ({ id, changes }) => ({ url: `/projects/${id}`, method: 'PATCH', data: changes, validate: isProject }),
      async onQueryStarted({ id, changes }, { dispatch, queryFulfilled }) {
        const patches = [
          dispatch(projectsApi.util.updateQueryData('getProjects', undefined, (draft) => {
            projectsAdapter.updateOne(draft, { id, changes });
          })),
          dispatch(projectsApi.util.updateQueryData('getProject', id, (draft) => void Object.assign(draft, changes))),
        ];
        try {
          await queryFulfilled;
        } catch {
          for (const patch of patches) patch.undo();
        }
      },
      invalidatesTags: (_result, error, { id }) => (error ? [] : [{ type: 'Project', id }]),
    }),
    deleteProject: build.mutation<void, number>({
      query: (id) => ({ url: `/projects/${id}`, method: 'DELETE' }),
      transformResponse: () => undefined,
      // The project's tasks lose their project (ON DELETE SET NULL): task lists are stale too.
      invalidatesTags: (_result, error, id) => (error ? [] : [{ type: 'Project', id }, PROJECT_LIST, { type: 'Task', id: 'LIST' }]),
    }),

    getMembers: build.query<EntityState<Member, number>, number>({
      query: (projectId) => ({ url: `/projects/${projectId}/members`, validate: isArrayOf(isMember) }),
      transformResponse: (members: Member[]) => membersAdapter.setAll(membersAdapter.getInitialState(), members),
      providesTags: (_result, _error, projectId) => [{ type: 'Member', id: projectId }],
    }),
    /** PESSIMISTIC: wait for the server (it may refuse: last owner, unknown user), then write ITS answer. */
    putMember: build.mutation<Member, { projectId: number; userId: number; role: ProjectRole }>({
      query: ({ projectId, userId, role }) => ({
        url: `/projects/${projectId}/members/${userId}`,
        method: 'PUT',
        data: { role },
        validate: isMember,
      }),
      async onQueryStarted({ projectId }, { dispatch, queryFulfilled }) {
        try {
          const { data: member } = await queryFulfilled;
          dispatch(projectsApi.util.updateQueryData('getMembers', projectId, (draft) => {
            membersAdapter.upsertOne(draft, member);
          }));
        } catch {
          // the form shows the error (unwrap)
        }
      },
      invalidatesTags: (_result, error, { projectId }) => (error ? [] : [{ type: 'Project', id: projectId }]), // memberCount
    }),
    /** OPTIMISTIC removal. */
    removeMember: build.mutation<void, { projectId: number; userId: number }>({
      query: ({ projectId, userId }) => ({ url: `/projects/${projectId}/members/${userId}`, method: 'DELETE' }),
      transformResponse: () => undefined,
      async onQueryStarted({ projectId, userId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(projectsApi.util.updateQueryData('getMembers', projectId, (draft) => {
          membersAdapter.removeOne(draft, userId);
        }));
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: (_result, error, { projectId }) =>
        error ? [] : [{ type: 'Project', id: projectId }, PROJECT_LIST, { type: 'Task', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetMembersQuery,
  usePutMemberMutation,
  useRemoveMemberMutation,
} = projectsApi;
