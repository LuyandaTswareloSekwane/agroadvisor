import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { isFirebaseConfigured } from '../services/firebase';
import {
  loginFarmer,
  loginFarmerWithProvider,
  logoutFarmer,
  registerFarmer,
  subscribeToAuthChanges,
} from '../services/authService';
import type { AuthProviderName, AuthUser, LoginInput, RegisterInput } from '../types/auth';
import { AuthContext, type AuthContextValue } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(
    () =>
      subscribeToAuthChanges((nextUser) => {
        setUser(nextUser);
        setIsLoading(false);
      }),
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isConfigured: isFirebaseConfigured,
      login: async (input: LoginInput) => {
        setUser(await loginFarmer(input));
      },
      register: async (input: RegisterInput) => {
        // Set the user from the result so the display name saved after sign-up is included.
        setUser(await registerFarmer(input));
      },
      loginWithProvider: async (provider: AuthProviderName) => {
        setUser(await loginFarmerWithProvider(provider));
      },
      logout: logoutFarmer,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
