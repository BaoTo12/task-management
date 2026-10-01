import { createEntityAdapter } from '@reduxjs/toolkit';
import type { EntityState } from '@reduxjs/toolkit';

import { apiSlice } from '@/shared/api/apiSlice';
import { isArrayOf, isLabel, isTask } from '@/shared/domain/guards';
import type { Label, Task } from '@/shared/domain/types';

export const labelsAdapter = createEntityAdapter<Label>({ sortComparer: (a, b) => a.name.localeCompare(b.name) });

export const labelsApi = apiSlice.enhanceEndpoints({ addTagTypes: ['Label'] }).injectEndpoints({
  endpoints: (build) => ({
    getLabels: build.query<EntityState<Label, number>, void>({
      query: () => ({ url: '/labels', validate: isArrayOf(isLabel) }),
      transformResponse: (labels: Label[]) => labelsAdapter.setAll(labelsAdapter.getInitialState(), labels),
      providesTags: ['Label'],
      keepUnusedDataFor: 600,
    }),
    createLabel: build.mutation<Label, { name: string; color: string }>({
      query: (body) => ({ url: '/labels', method: 'POST', data: body, validate: isLabel }),
      invalidatesTags: (_result, error) => (error ? [] : ['Label']),
    }),
    deleteLabel: build.mutation<void, number>({
      query: (id) => ({ url: `/labels/${id}`, method: 'DELETE' }),
      transformResponse: () => undefined,
      // The label disappears from every task too (ON DELETE CASCADE): task lists are stale.
      invalidatesTags: (_result, error) => (error ? [] : ['Label', { type: 'Task', id: 'LIST' }]),
    }),
    /**
     * OPTIMISTIC across EVERY cache entry that holds the task: each cached list (whatever its arguments) and the
     * task's own entry. selectCachedArgsForQuery lists the arguments of the cached getTasks entries.
     */
    setTaskLabels: build.mutation<Task, { taskId: number; labelIds: number[] }>({
      query: ({ taskId, labelIds }) => ({ url: `/tasks/${taskId}/labels`, method: 'PUT', data: { labelIds }, validate: isTask }),
      async onQueryStarted({ taskId, labelIds }, { dispatch, getState, queryFulfilled }) {
        const patches = [
          ...apiSlice.util.selectCachedArgsForQuery(getState(), 'getTasks').map((query) =>
            dispatch(apiSlice.util.updateQueryData('getTasks', query, (page) => {
              const task = page.items.find((item) => item.id === taskId);
              if (task) task.labelIds = labelIds;
            })),
          ),
          dispatch(apiSlice.util.updateQueryData('getTask', taskId, (task) => {
            task.labelIds = labelIds;
          })),
        ];
        try {
          await queryFulfilled;
        } catch {
          for (const patch of patches) patch.undo();
        }
      },
      invalidatesTags: (_result, error, { taskId }) => (error ? [] : [{ type: 'Task', id: taskId }]),
    }),
  }),
});

export const { useGetLabelsQuery, useCreateLabelMutation, useDeleteLabelMutation, useSetTaskLabelsMutation } = labelsApi;
