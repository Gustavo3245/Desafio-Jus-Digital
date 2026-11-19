import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createAuthenticationApi } from './auth-api.js';
import {
  AuthenticationHttpError,
  toSafeAuthenticationError,
  translateCallbackError,
} from './auth-errors.js';
import type { AuthenticationState } from './auth.types.js';

interface AuthenticationContextValue extends AuthenticationState {
  isSigningOut: boolean;
  refresh(): Promise<void>;
  logout(): Promise<void>;
}

const initialState: AuthenticationState = {
  status: 'checking',
  user: null,
  errorMessage: null,
};

const AuthenticationContext = createContext<AuthenticationContextValue | null>(
  null,
);

const api = createAuthenticationApi(import.meta.env.VITE_API_BASE_URL);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthenticationState>(initialState);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const refresh = useCallback(async () => {
    const callbackError = translateCallbackError(
      new URLSearchParams(window.location.search).get('error'),
    );

    if (callbackError) {
      window.history.replaceState(null, '', '/');
      setState({
        status: 'error',
        user: null,
        errorMessage: callbackError,
      });
      return;
    }

    setState((current) => ({
      ...current,
      status: 'checking',
      errorMessage: null,
    }));

    try {
      const user = await api.getCurrentUser();
      setState({ status: 'authenticated', user, errorMessage: null });

      if (window.location.pathname === '/auth/callback') {
        window.history.replaceState(null, '', '/settings');
      }
    } catch (error) {
      if (error instanceof AuthenticationHttpError && error.status === 401) {
        if (window.location.pathname === '/auth/callback') {
          window.history.replaceState(null, '', '/');
        }

        setState({
          status: 'unauthenticated',
          user: null,
          errorMessage: null,
        });
        return;
      }

      setState({
        status: 'error',
        user: null,
        errorMessage: toSafeAuthenticationError(error),
      });
    }
  }, []);

  const logout = useCallback(async () => {
    setIsSigningOut(true);

    try {
      await api.logout();
      window.history.replaceState(null, '', '/');
      setState({
        status: 'unauthenticated',
        user: null,
        errorMessage: null,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        errorMessage: toSafeAuthenticationError(error),
      }));
    } finally {
      setIsSigningOut(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<AuthenticationContextValue>(
    () => ({ ...state, isSigningOut, refresh, logout }),
    [isSigningOut, logout, refresh, state],
  );

  return (
    <AuthenticationContext.Provider value={value}>
      {children}
    </AuthenticationContext.Provider>
  );
}

export function useAuthentication(): AuthenticationContextValue {
  const context = useContext(AuthenticationContext);

  if (!context) {
    throw new Error('useAuthentication must be used inside AuthProvider');
  }

  return context;
}
