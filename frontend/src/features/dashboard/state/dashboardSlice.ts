// A LAZY slice (combineSlices, RTK 2): its code arrives with the dashboard chunk (12.09) and injects itself into
// the root reducer at that moment. Users who never open the dashboard never download or run it.
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction, WithSlice } from '@reduxjs/toolkit';

import { rootReducer } from '@/app/rootReducer';

import { loggedOut } from '@/shared/session/authActions';

export const WIDGET_IDS = ['completion', 'status', 'priority', 'overdue'] as const;
export type WidgetId = (typeof WIDGET_IDS)[number];

export interface DashboardState {
  hiddenWidgets: WidgetId[];
}

const initialState: DashboardState = { hiddenWidgets: [] };

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    widgetToggled(state, action: PayloadAction<WidgetId>) {
      const index = state.hiddenWidgets.indexOf(action.payload);
      if (index === -1) state.hiddenWidgets.push(action.payload);
      else state.hiddenWidgets.splice(index, 1); // Immer: "mutate" the draft (20.05)
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loggedOut, () => initialState); // user-specific layout: forgotten on logout (20.11)
  },
  // RTK 2 slice `selectors`: they receive THIS slice's state, not the root state (20.A).
  selectors: {
    selectHiddenWidgets: (state) => state.hiddenWidgets,
    selectIsWidgetVisible: (state, id: WidgetId) => !state.hiddenWidgets.includes(id),
  },
});

/**
 * Declaration merging (06.10): adds `dashboard` to the root state's LazyLoadedSlices interface, so RootState
 * has `dashboard?: DashboardState` without app/ importing this feature.
 */
declare module '@/app/rootReducer' {
  export interface LazyLoadedSlices extends WithSlice<typeof dashboardSlice> {}
}

/**
 * The injection happens when THIS MODULE is evaluated, i.e. when the dashboard chunk loads.
 * `injectInto` returns the slice again, with selectors that find its state inside the ROOT state and fall back
 * to `initialState` if it's somehow not injected yet: no `state.dashboard?.` checks in components.
 */
const injectedDashboardSlice = dashboardSlice.injectInto(rootReducer);

export const { widgetToggled } = dashboardSlice.actions;
export const { selectHiddenWidgets, selectIsWidgetVisible } = injectedDashboardSlice.selectors;
