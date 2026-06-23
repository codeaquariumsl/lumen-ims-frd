'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api-client';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  branchId?: string | null;
  companyDetails?: any | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('optical_token');
      if (token) {
        try {
          const response = await apiClient.get('/auth/me');
          if (response.data?.success && response.data?.data?.user) {
            setUser(response.data.data.user);
          } else {
            localStorage.removeItem('optical_token');
            localStorage.removeItem('optical_user');
          }
        } catch (err) {
          localStorage.removeItem('optical_token');
          localStorage.removeItem('optical_user');
        }
      }
      setIsLoading(false);
    };

    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const response = await apiClient.post('/auth/login', { email, password });

      if (response.data?.success && response.data?.data) {
        const { user: userData, token } = response.data.data;
        setUser(userData);
        localStorage.setItem('optical_token', token);
        localStorage.setItem('optical_user', JSON.stringify(userData));
      } else {
        throw new Error(response.data?.message || 'Login failed');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore errors on logout request
    }
    setUser(null);
    localStorage.removeItem('optical_token');
    localStorage.removeItem('optical_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
