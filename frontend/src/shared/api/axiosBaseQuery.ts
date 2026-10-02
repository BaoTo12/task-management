// S22 (22.03): RTK Query's "base query" = the ONE function every endpoint uses to talk to the server.
// Ours goes through the S13 Axios instance, so the interceptors (request id, timing, error normalisation)
// keep working, and failures reach RTK Query as the same serialisable ApiErrorPayload the thunks used.

import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosRequestConfig } from 'axios';
import { sessionExpired } from '@/shared/session/authActions';
import { ApiRequestError, toApiErrorPayload } from './api-error';
import type { ApiErrorPayload } from './api-error';
import { api } from './client';

export interface AxiosQueryArgs {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  params?: AxiosRequestConfig['params'];
  validate?: (data: unknown) => boolean;
}

const SESSION_ENDPOINTS = new Set(['getMe', 'login']);

export function axiosBaseQuery(): BaseQueryFn<AxiosQueryArgs, unknown, ApiErrorPayload> {
  return async ({ url, method = 'GET', data, params, validate }, { signal, dispatch, endpoint }) => {
    try {
      // `signal` is RTK Query's AbortSignal (22.06): `queryResult.abort()` really aborts the HTTP request.
      const response = await api.request({ url, method, data, params, signal });
      if (validate && !validate(response.data)) {
        const error = new ApiRequestError({ kind: 'unexpected', message: 'The server sent an unexpected response.' });
        return { error: toApiErrorPayload(error) };
      }
      return { data: response.data };
    } catch (error) {
      const payload = toApiErrorPayload(error);
      // 401 = "no session" (24.13). For getMe and login that's an ANSWER; anywhere else the session is gone.
      // An action, not a redirect: the base query knows nothing about routing; a listener decides.
      if (payload.status === 401 && !SESSION_ENDPOINTS.has(endpoint)) dispatch(sessionExpired());
      return { error: payload };
    }
  };
}
