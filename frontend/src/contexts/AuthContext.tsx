import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AuthContextType, SignupRequest, UserRole } from '../types/auth';
import { authApi } from '../services/api';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Load user and token from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const getRedirectPath = (role: UserRole): string => {
        switch (role) {
            case UserRole.TECHNICIAN:
                return '/kanban';
            case UserRole.MANAGER:
            case UserRole.USER:
                return '/dashboard';
            case UserRole.ADMIN:
                return '/admin';
            default:
                return '/dashboard';
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await authApi.login({ email, password });

            // Store token and user
            localStorage.setItem('token', response.access_token);
            localStorage.setItem('user', JSON.stringify(response.user));

            setToken(response.access_token);
            setUser(response.user);

            // Navigate after successful login
            const redirectPath = getRedirectPath(response.user.role);
            navigate(redirectPath, { replace: true });
        } catch (error: any) {
            // Don't navigate on error - let the component handle the error display
            throw new Error(error.response?.data?.detail || 'Invalid email or password');
        }
    };

    const signup = async (data: SignupRequest) => {
        try {
            const newUser = await authApi.signup(data);
            // Don't auto-login, redirect to login page instead
            return newUser;
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Signup failed');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const value: AuthContextType = {
        user,
        token,
        login,
        signup,
        logout,
        isAuthenticated: !!token && !!user,
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
