import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { useGetMeQuery, useLoginMutation, useLogoutMutation } from '../api/authApi';
import { AuthContext } from './auth-context';
import type { AuthContextValue } from './auth-context';


export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useGetMeQuery();
  const [login] = useLoginMutation();
  const [logout] = useLogoutMutation();

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isChecking: isLoading,
      login: (username, password) => login({ username, password }).unwrap(),
      // logout's onQueryStarted clears slices, cache and user cookies, even if the request fails (24.12).
      logout: () => logout().unwrap().catch(() => undefined),
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
