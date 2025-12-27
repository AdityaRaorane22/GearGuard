import api from "./api";
import { User } from "../types";

const TOKEN_KEY = "access_token";

type LoginResponse = {
  access_token: string;
  token_type: string;
};

type SignupPayload = {
  email: string;
  username: string;
  password: string;
  full_name?: string;
};

export async function login(email: string, password: string): Promise<void> {
  const { data } = await api.post<LoginResponse>("/auth/login", { email, password });
  if (data?.access_token) {
    localStorage.setItem(TOKEN_KEY, data.access_token);
  }
}

export async function signup(userData: SignupPayload): Promise<User> {
  const { data } = await api.post<User>("/auth/signup", userData);
  return data;
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}
