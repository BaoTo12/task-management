import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@/app/rootReducer';

import type { Label, Task } from '@/shared/domain/types';

import { labelsAdapter, labelsApi } from '../api/labelsApi';

const EMPTY = labelsAdapter.getInitialState();

const selectLabelsData = createSelector([labelsApi.endpoints.getLabels.select()], (result) => result.data ?? EMPTY);

export const { selectAll: selectAllLabels, selectEntities: selectLabelEntities } = labelsAdapter.getSelectors(selectLabelsData);

/**
 * An INVERTED INDEX: tasks store labelIds; this answers the opposite question, "which tasks carry label X?", in O(1).
 * Built once per change of the task list (createSelector), not on every render or every lookup.
 * The tasks come as an INPUT (the caller passes its selector of tasks): labels doesn't depend on the tasks feature.
 */
export function makeSelectTaskIdsByLabel(selectTasks: (state: RootState) => readonly Task[]) {
  return createSelector([selectTasks], (tasks) => {
    const index: Record<number, number[]> = {};
    for (const task of tasks) {
      for (const labelId of task.labelIds) (index[labelId] ??= []).push(task.id);
    }
    return index;
  });
}

/** The Label objects of one task, in name order. Factory: one memoized instance per task card. */
export const makeSelectLabelsOf = () =>
  createSelector(
    [selectAllLabels, (_state: RootState, labelIds: readonly number[]) => labelIds],
    (labels, labelIds): Label[] => labels.filter((label) => labelIds.includes(label.id)),
  );
