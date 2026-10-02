import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type * as taskflowApi from '@/shared/api/endpoints';

import type { RootState } from './rootReducer';

export interface ThunkExtra {
  api: typeof taskflowApi;
}

export type AppThunk<R = void> = ThunkAction<R, RootState, ThunkExtra, UnknownAction>;
