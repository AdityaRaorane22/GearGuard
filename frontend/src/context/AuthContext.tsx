import { createContext, useContext, useState, ReactNode } from "react";
import { login as loginApi, logout as logoutApi, signup as signupApi } from "../services/authService";
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
  // TEMPORARY: Dummy user to bypass login
  const [user, setUser] = useState<User | null>({
    id: "dummy-user-id",
    email: "dev@example.com",
    username: "devuser",
    fullName: "Developer",
    role: "admin",
    isActive: true,
  });
  const [isLoading] = useState<boolean>(false);

  const refreshUser = async () => {
    // Disabled for UI development
  };

  const login = async (email: string, password: string) => {
    await loginApi(email, password);
    await refreshUser();
  };

  const signup = async (payload: { email: string; username: string; password: string; full_name?: string }) => {
    await signupApi(payload);
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

export const useAuth = (): AuthContextValue & { isAuthenticated: boolean } => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return {
    ...ctx,
    isAuthenticated: !!ctx.user,
  };
};
