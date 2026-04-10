import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { getAuthSession } from '../lib/authApi';
import type { AuthSession } from '../lib/authApi';

interface AuthContextValue {
  authSession: AuthSession;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshAuthState: () => Promise<AuthSession>;
}

const anonymousSession: AuthSession = {
  isAuthenticated: false,
  userName: null,
  email: null,
  roles: [],
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authSession, setAuthSession] = useState<AuthSession>(anonymousSession);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuthState = useCallback(async () => {
    try {
      const session = await getAuthSession();
      setAuthSession(session);
      return session;
    } catch {
      setAuthSession(anonymousSession);
      return anonymousSession;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAuthState();
  }, [refreshAuthState]);

  // After any login (password, MFA, Google OAuth), claim an in-progress donation
  // that was stored in localStorage before the user signed in.
  useEffect(() => {
    if (!authSession.isAuthenticated) return;
    const intentId = localStorage.getItem('pendingDonationIntent');
    if (!intentId) return;

    const api = import.meta.env.VITE_API_BASE_URL as string;
    fetch(`${api}/api/payments/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ paymentIntentId: intentId }),
    }).finally(() => localStorage.removeItem('pendingDonationIntent'));
  }, [authSession.isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        authSession,
        isAuthenticated: authSession.isAuthenticated,
        isLoading,
        refreshAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider.');
  return context;
}
