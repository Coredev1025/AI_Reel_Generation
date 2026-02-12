import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiService, AuthUser } from '../services/apiService';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (data: { email: string; password: string; name?: string }) => Promise<{ message?: string; token?: string }>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = apiService.getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const { user: me } = await apiService.getMe();
      setUser({ ...me, role: me.role || 'user' });
    } catch {
      apiService.clearAuthToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedInUser } = await apiService.signin(email, password);
    setUser({ ...loggedInUser, role: loggedInUser.role || 'user' });
  }, []);

  const logout = useCallback(() => {
    apiService.logout();
    setUser(null);
  }, []);

  const signup = useCallback(async (data: { email: string; password: string; name?: string }) => {
    const result = await apiService.signup(data);
    if (result.token && result.user) {
      setUser({ ...result.user, role: result.user.role || 'user' });
    }
    return result;
  }, []);

  const updateProfile = useCallback(async (data: { name?: string; email?: string }) => {
    const result = await apiService.updateProfile(data);
    if (result.user) {
      setUser({ ...result.user, role: result.user.role || 'user' });
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await apiService.changePassword({ currentPassword, newPassword });
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    signup,
    checkAuth,
    updateProfile,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
