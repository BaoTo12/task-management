// S22: categories live in RTK Query's cache (the `getCategories` query), not in a slice.

import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@/app/rootReducer';

import { selectTasks } from '@/features/tasks';

import { apiSlice, categoriesAdapter, initialCategoriesState } from '@/shared/api/apiSlice';
import type { Category } from '@/shared/domain/types';

/** The cache entry of `getCategories()` (no argument: `select()` with none). */
export const selectCategoriesResult = apiSlice.endpoints.getCategories.select();

/**
 * The entity adapter's selectors (21.12), pointed at the cached EntityState. While nothing is cached they read
 * the adapter's (stable) initial state, so selectAll returns the same empty array every time.
 * selectAll is memoised: the same array until the categories change.
 */
const categorySelectors = categoriesAdapter.getSelectors(
  (state: RootState) => selectCategoriesResult(state).data ?? initialCategoriesState,
);

/** The categories in name order (the adapter's sortComparer). */
export const selectCategories = categorySelectors.selectAll;

/** O(1). A `null` categoryId (uncategorised) → undefined. */
export const selectCategoryById = (state: RootState, id: number | null): Category | undefined =>
  id === null ? undefined : categorySelectors.selectById(state, id);

export interface TaskCountsByCategory {
  byCategory: Record<number, number>;
  uncategorized: number;
}

/**
 * Task counts per category (19.11), MEMOIZED on the task list: the same object until the tasks change,
 * so the sidebar doesn't re-render for unrelated actions.
 */
export const selectTaskCountsByCategory = createSelector([selectTasks], (tasks): TaskCountsByCategory => {
  const byCategory: Record<number, number> = {};
  let uncategorized = 0;
  for (const task of tasks) {
    if (task.categoryId === null) uncategorized += 1;
    else byCategory[task.categoryId] = (byCategory[task.categoryId] ?? 0) + 1;
  }
  return { byCategory, uncategorized };
});
