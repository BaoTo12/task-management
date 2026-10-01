import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@/app/rootReducer';

import type { UserSummary } from '@/shared/domain/types';

import { peopleAdapter } from './peopleSlice';

/**
 * The adapter's ready-made selectors, bound to state.people: selectAll (sorted by sortComparer), selectById,
 * selectEntities, selectIds, selectTotal. All memoized where it matters (selectAll keeps its array reference).
 */
export const {
  selectAll: selectAllPeople,
  selectById: selectPersonById,
  selectEntities: selectPeopleEntities,
} = peopleAdapter.getSelectors<RootState>((state) => state.people);

/** "Alice Nguyen", or a placeholder while the name is still on its way. */
export const selectDisplayName = (state: RootState, id: number | null | undefined): string | null =>
  id == null ? null : (selectPersonById(state, id)?.displayName ?? null);

/**
 * A SELECTOR FACTORY: each component instance calls it once (useMemo) and gets its OWN memoized selector, because the
 * argument (a list of ids) differs per instance. A single shared createSelector would recompute on every call
 * with a different argument (its cache size is 1 per input combination: weakMapMemoize keeps more, but a new
 * array each render still misses).
 */
export const makeSelectPeople = () =>
  createSelector(
    [selectPeopleEntities, (_state: RootState, ids: readonly number[]) => ids],
    (entities, ids): UserSummary[] => ids.map((id) => entities[id]).filter((user) => user !== undefined),
  );
