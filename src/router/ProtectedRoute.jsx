import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Loading from '../components/Common/Loading';

const ROLE_DEFAULT_PATHS = {
  Admin: '/admin/dashboard',
  Manager: '/manager/dashboard',
  Staff: '/staff/dashboard',
  User: '/user/dashboard'
};

/**
 * ProtectedRoute component ensures that only authenticated users with the correct role
 * can access the wrapped component. If unauthenticated, redirects to login.
 * If authenticated but with insufficient role, redirects to a role-specific default page.
 */
const ProtectedRoute = ({ allowedRoles = [], redirectTo, children }) => {
  // Use context directly to avoid useAuth hook error during hot reload
  const authContext = useContext(AuthContext);

  // If context is not ready, allow children to mount so pages/layouts
  // can control content-level loading themselves. Do not render full-page Loading here.
  if (!authContext) {
    return children;
  }

  const { user, isAuthenticated, loading } = authContext;
  const location = useLocation();

  // While auth is initializing, allow child components to mount and
  // display content-level loading overlays from layouts/pages if needed.
  if (loading) {
    return children;
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (allowedRoles.length > 0) {
    const userRole = user.role;
    
    // Normalize role comparison (case-insensitive)
    const normalizedUserRole = userRole?.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(role => role?.toLowerCase());

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      const fallbackPath = redirectTo || ROLE_DEFAULT_PATHS[userRole] || '/';
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;



