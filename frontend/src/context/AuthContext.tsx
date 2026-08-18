import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { authApi, userApi, setAuthTokens, clearAuthTokens } from '../api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  quickLogin: (role: UserRole) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Preset demo accounts configured in seed_demo.py
export const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string; title: string; name: string }> = {
  HR_ADMIN: {
    email: 'hradmin@leaveos.demo',
    pass: 'password123',
    title: 'HR Admin',
    name: 'Ada Okonkwo',
  },
  MANAGER: {
    email: 'mgr_engineering@leaveos.demo',
    pass: 'password123',
    title: 'Engineering Manager',
    name: 'Alex Rivera',
  },
  EMPLOYEE: {
    email: 'emp_demo@leaveos.demo',
    pass: 'password123',
    title: 'Software Engineer',
    name: 'Chidi Nwachukwu',
  },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const profile = await userApi.getMe();
      setUser(profile);
    } catch {
      setUser(null);
      clearAuthTokens();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Listen for auth expiration events from axios interceptor
    const handleAuthExpired = () => {
      setUser(null);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    setIsLoading(false);

    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const { access_token, refresh_token } = await authApi.login(email, password);
      setAuthTokens(access_token, refresh_token);
      const profile = await userApi.getMe();
      setUser(profile);
      return profile;
    } catch (err: any) {
      clearAuthTokens();
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (role: UserRole): Promise<User> => {
    const cred = DEMO_CREDENTIALS[role];
    return login(cred.email, cred.pass);
  };

  const logout = () => {
    clearAuthTokens();
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        quickLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
