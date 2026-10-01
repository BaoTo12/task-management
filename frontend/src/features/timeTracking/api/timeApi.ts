import { apiSlice } from '@/shared/api/apiSlice';
import { isArrayOf, isTimeEntry } from '@/shared/domain/guards';
import type { IsoDateTime, TimeEntry } from '@/shared/domain/types';

/** Tag ids: the TASK id for a task's entries; 'RUNNING' for "my running timer". */
export const timeApi = apiSlice.enhanceEndpoints({ addTagTypes: ['TimeEntry'] }).injectEndpoints({
  endpoints: (build) => ({
    getTimeEntries: build.query<TimeEntry[], number>({
      query: (taskId) => ({ url: `/tasks/${taskId}/time-entries`, validate: isArrayOf(isTimeEntry) }),
      providesTags: (_result, _error, taskId) => [{ type: 'TimeEntry', id: taskId }],
    }),
    /** 200 with the entry, or 204 (no timer): Axios gives '' for an empty body, mapped to null. */
    getRunningTimer: build.query<TimeEntry | null, void>({
      query: () => ({ url: '/timer', validate: (data) => data === '' || isTimeEntry(data) }),
      transformResponse: (data: TimeEntry | '') => (data === '' ? null : data),
      providesTags: [{ type: 'TimeEntry', id: 'RUNNING' }],
    }),
    startTimer: build.mutation<TimeEntry, number>({
      query: (taskId) => ({ url: `/tasks/${taskId}/timer/start`, method: 'POST', validate: isTimeEntry }),
      // The previous timer (maybe on another task) was stopped by the server: its task's entries changed too.
      invalidatesTags: (result) => (result ? [{ type: 'TimeEntry', id: 'RUNNING' }, { type: 'TimeEntry', id: result.taskId }] : []),
    }),
    stopTimer: build.mutation<TimeEntry, void>({
      query: () => ({ url: '/timer/stop', method: 'POST', validate: isTimeEntry }),
      invalidatesTags: (result) => (result ? [{ type: 'TimeEntry', id: 'RUNNING' }, { type: 'TimeEntry', id: result.taskId }] : []),
    }),
    logTime: build.mutation<TimeEntry, { taskId: number; startedAt: IsoDateTime; endedAt: IsoDateTime; note: string }>({
      query: ({ taskId, ...body }) => ({ url: `/tasks/${taskId}/time-entries`, method: 'POST', data: body, validate: isTimeEntry }),
      invalidatesTags: (_result, error, { taskId }) => (error ? [] : [{ type: 'TimeEntry', id: taskId }]),
    }),
    deleteTimeEntry: build.mutation<void, { taskId: number; id: number }>({
      query: ({ id }) => ({ url: `/time-entries/${id}`, method: 'DELETE' }),
      transformResponse: () => undefined,
      invalidatesTags: (_result, error, { taskId }) => (error ? [] : [{ type: 'TimeEntry', id: taskId }]),
    }),
  }),
});

export const {
  useGetTimeEntriesQuery,
  useGetRunningTimerQuery,
  useStartTimerMutation,
  useStopTimerMutation,
  useLogTimeMutation,
  useDeleteTimeEntryMutation,
} = timeApi;
