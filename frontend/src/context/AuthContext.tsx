import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getCurrentUser, login as loginApi, logout as logoutApi, signup as signupApi, isAuthenticated } from "../services/authService";
import { User } from "../types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: { email: string; username: string; password: string; full_name?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    if (!isAuthenticated()) {
      setUser(null);
      return;
    }
    try {
      const me = await getCurrentUser();
      setUser(me);
    } catch (err) {
      // token invalid or request failed; clear user
      setUser(null);
    }
  };

  useEffect(() => {
    // On mount, fetch user if token exists
    refreshUser().finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    await loginApi(email, password);
    await refreshUser();
  };

  const signup = async (payload: { email: string; username: string; password: string; full_name?: string }) => {
    await signupApi(payload);
    // Optionally auto-login after signup; here we just fetch user if token set by backend (not typical)
    await refreshUser();
  };

  const logout = () => {
    logoutApi();
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    login,
    signup,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
