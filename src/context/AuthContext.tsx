import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/crypto';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithSSO: (provider: 'google' | 'apple', email?: string, name?: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await api.auth.getMe();
      setUser(res.user);
      localStorage.setItem('vaultstake_current_user', JSON.stringify(res.user));
    } catch (err) {
      console.error('Failed to load active user profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('vaultstake_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      } catch {
        // ignore
      }
    }
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(email, password);
      setUser(res.user);
      localStorage.setItem('vaultstake_current_user', JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.register(name, email, password);
      setUser(res.user);
      localStorage.setItem('vaultstake_current_user', JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithSSO = async (provider: 'google' | 'apple', email?: string, name?: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.sso(provider, email, name);
      setUser(res.user);
      localStorage.setItem('vaultstake_current_user', JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vaultstake_current_user');
  };

  const switchRole = async (targetRole: UserRole) => {
    setIsLoading(true);
    try {
      const res = await api.auth.switchRole(targetRole);
      setUser(res.user);
      localStorage.setItem('vaultstake_current_user', JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'user',
        isLoading,
        login,
        register,
        loginWithSSO,
        logout,
        switchRole,
        refreshUser
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
