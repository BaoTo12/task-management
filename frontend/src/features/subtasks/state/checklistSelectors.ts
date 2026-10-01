import type { RootState } from '@/app/rootReducer';

import { canRedo, canUndo } from '@/shared/state/undoable';

/** state.checklistDraft is { past, present, future }: the enhancer's shape. Components read `present`. */
export const selectChecklistDraft = (state: RootState) => state.checklistDraft.present;
export const selectCanUndoDraft = (state: RootState) => canUndo(state.checklistDraft);
export const selectCanRedoDraft = (state: RootState) => canRedo(state.checklistDraft);
export const selectIsEditingChecklist = (state: RootState, taskId: number) => state.checklistDraft.present.taskId === taskId;
