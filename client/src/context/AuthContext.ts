import { createContext } from 'react';
import type { AuthProviderName, AuthUser, LoginInput, RegisterInput } from '../types/auth';

export interface AuthContextValue {
  user: AuthUser | null;
  /** True until Firebase reports the initial sign-in state. */
  isLoading: boolean;
  /** False when Firebase values are missing from client/.env. */
  isConfigured: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  loginWithProvider: (provider: AuthProviderName) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
