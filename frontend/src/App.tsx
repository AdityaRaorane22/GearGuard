import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { EquipmentPage } from './pages/Equipment';
import { EquipmentDetail } from './pages/EquipmentDetail';
import { NewEquipment } from './pages/NewEquipment';
import { Teams } from './pages/Teams';
import { TeamForm } from './pages/TeamForm';
import { NewRequest } from './pages/NewRequest';
import { RequestDetail } from './pages/RequestDetail';

// Create a client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

const AppRoutes: React.FC = () => {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            {/* Public Routes */}
            <Route
                path="/login"
                element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
            />
            <Route
                path="/signup"
                element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />}
            />

            {/* Protected Routes */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute roles={['Manager', 'Admin']}>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/equipment"
                element={
                    <ProtectedRoute>
                        <EquipmentPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/equipment/new"
                element={
                    <ProtectedRoute>
                        <NewEquipment />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/equipment/:id"
                element={
                    <ProtectedRoute>
                        <EquipmentDetail />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/request/new"
                element={
                    <ProtectedRoute>
                        <NewRequest />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/request/:id"
                element={
                    <ProtectedRoute>
                        <RequestDetail />
                    </ProtectedRoute>
                }
            />

            {/* Placeholder routes for future features */}
            <Route
                path="/kanban"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />

            {/* Teams Routes */}
            <Route
                path="/teams"
                element={
                    <ProtectedRoute>
                        <Teams />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/teams/new"
                element={
                    <ProtectedRoute>
                        <TeamForm />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/teams/:id"
                element={
                    <ProtectedRoute>
                        <TeamForm />
                    </ProtectedRoute>
                }
            />

            {/* Default redirect */}
            <Route
                path="/"
                element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
            />

            {/* 404 */}
            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />
        </Routes>
    );
};

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <ToastProvider>
                        <AppRoutes />
                    </ToastProvider>
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
