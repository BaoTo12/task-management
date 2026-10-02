import { createContext, useContext } from 'react';

import type { User } from '@/shared/domain/types';

export interface AuthContextValue {
  user: User | null;
  /** True until the first "who am I?" answer: don't redirect to /login before we know (24.12). */
  isChecking: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
