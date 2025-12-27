import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Layout
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Pages - Auth
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Pages - Protected
import Dashboard from "./pages/Dashboard";
import Equipment from "./pages/Equipment";
import MaintenanceRequests from "./pages/MaintenanceRequests";
import Teams from "./pages/Teams";

// Components - Detail
import EquipmentDetail from "./components/equipment/EquipmentDetail";
import RequestDetail from "./components/maintenance/RequestDetail";

// Wrapper components for dynamic routes (to access URL params)
const EquipmentDetailWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return id ? <EquipmentDetail id={id} /> : <Navigate to="/equipment" replace />;
};

const RequestDetailWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return id ? <RequestDetail id={id} /> : <Navigate to="/requests" replace />;
};

// Root router component
const AppRoutes: React.FC = () => {
  const { isAuthenticated: authenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 grid place-items-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={authenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={authenticated ? <Navigate to="/dashboard" replace /> : <Signup />}
      />

      {/* Root - Redirect */}
      <Route
        path="/"
        element={
          authenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Protected Routes with Layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Equipment Routes */}
        <Route path="/equipment" element={<Equipment />} />
        <Route path="/equipment/:id" element={<EquipmentDetailWrapper />} />

        {/* Maintenance Request Routes */}
        <Route path="/requests" element={<MaintenanceRequests />} />
        <Route path="/requests/:id" element={<RequestDetailWrapper />} />

        {/* Teams Route (Admin/Manager only) */}
        <Route
          path="/teams"
          element={
            <ProtectedRoute roles={["admin", "manager"]}>
              <Teams />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App with Providers
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
