export enum UserRole {
    USER = 'User',
    TECHNICIAN = 'Technician',
    MANAGER = 'Manager',
    ADMIN = 'Admin'
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
}

export interface SignupRequest {
    name: string;
    email: string;
    password: string;
    confirm_password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    user: User;
}

// Checked types/auth.ts content if needed.
export interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (data: SignupRequest) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}
