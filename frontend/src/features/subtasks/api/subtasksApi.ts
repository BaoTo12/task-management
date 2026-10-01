import { apiSlice } from '@/shared/api/apiSlice';
import { isArrayOf, isSubtask } from '@/shared/domain/guards';
import type { Subtask } from '@/shared/domain/types';

/** The checklist of one task. Tags carry the TASK id: a change refetches only that task's checklist. */
export const subtasksApi = apiSlice.enhanceEndpoints({ addTagTypes: ['Subtask'] }).injectEndpoints({
  endpoints: (build) => ({
    getSubtasks: build.query<Subtask[], number>({
      query: (taskId) => ({ url: `/tasks/${taskId}/subtasks`, validate: isArrayOf(isSubtask) }),
      providesTags: (_result, _error, taskId) => [{ type: 'Subtask', id: taskId }],
    }),
    /** PESSIMISTIC + cache write: append the server's subtask (with its id) without a refetch. */
    addSubtask: build.mutation<Subtask, { taskId: number; title: string }>({
      query: ({ taskId, title }) => ({ url: `/tasks/${taskId}/subtasks`, method: 'POST', data: { title }, validate: isSubtask }),
      async onQueryStarted({ taskId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(subtasksApi.util.updateQueryData('getSubtasks', taskId, (draft) => void draft.push(data)));
        } catch {
          // the input keeps its text; the component shows the error
        }
      },
    }),
    /** OPTIMISTIC: ticking a box must feel instant. */
    updateSubtask: build.mutation<Subtask, { taskId: number; id: number; changes: { title?: string; done?: boolean } }>({
      query: ({ id, changes }) => ({ url: `/subtasks/${id}`, method: 'PATCH', data: changes, validate: isSubtask }),
      async onQueryStarted({ taskId, id, changes }, { dispatch, queryFulfilled }) {
        const patch = dispatch(subtasksApi.util.updateQueryData('getSubtasks', taskId, (draft) => {
          const item = draft.find((subtask) => subtask.id === id);
          if (item) Object.assign(item, changes);
        }));
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    deleteSubtask: build.mutation<void, { taskId: number; id: number }>({
      query: ({ id }) => ({ url: `/subtasks/${id}`, method: 'DELETE' }),
      transformResponse: () => undefined,
      async onQueryStarted({ taskId, id }, { dispatch, queryFulfilled }) {
        const patch = dispatch(subtasksApi.util.updateQueryData('getSubtasks', taskId, (draft) =>
          draft.filter((subtask) => subtask.id !== id),               // RETURN a new value instead of mutating: also fine
        ));
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    /** The server answers with the list in its new order: write it straight into the cache (no refetch). */
    reorderSubtasks: build.mutation<Subtask[], { taskId: number; ids: number[] }>({
      query: ({ taskId, ids }) => ({ url: `/tasks/${taskId}/subtasks/order`, method: 'PUT', data: { ids }, validate: isArrayOf(isSubtask) }),
      async onQueryStarted({ taskId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(subtasksApi.util.upsertQueryData('getSubtasks', taskId, data));
        } catch {
          // the draft stays open: the user can retry
        }
      },
    }),
  }),
});

export const {
  useGetSubtasksQuery,
  useAddSubtaskMutation,
  useUpdateSubtaskMutation,
  useDeleteSubtaskMutation,
  useReorderSubtasksMutation,
} = subtasksApi;
