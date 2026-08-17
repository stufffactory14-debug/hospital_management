import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(authService.getCurrentAuth);
  const [loading, setLoading] = useState(false);

  const clearAuth = () => {
    authService.logout();
    setAuth({ token: null, user: null });
  };

  useEffect(() => {
    const handleExpiredAuth = () => clearAuth();
    window.addEventListener('medicore:auth-expired', handleExpiredAuth);
    return () => window.removeEventListener('medicore:auth-expired', handleExpiredAuth);
  }, []);

  const runAuthAction = async (action) => {
    setLoading(true);

    try {
      const nextAuth = await action();
      setAuth(nextAuth);
      return nextAuth;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      ...auth,
      loading,
      isAuthenticated: Boolean(auth.token && auth.user),
      login: (credentials) => runAuthAction(() => authService.login(credentials)),
      register: (details) => runAuthAction(() => authService.register(details)),
      logout: clearAuth,
    }),
    [auth, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
