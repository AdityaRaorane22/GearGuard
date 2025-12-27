import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Role } from "../../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  roles?: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, roles }) => {
  const { user, isLoading } = useAuth();
  
  // Support both allowedRoles and roles props
  const requiredRoles = roles || allowedRoles;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="animate-spin h-10 w-10 rounded-full border-4 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
