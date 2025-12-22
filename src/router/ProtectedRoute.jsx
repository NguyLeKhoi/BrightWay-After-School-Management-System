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

  // If context is not ready, return loading
  if (!authContext) {
    return <Loading />;
  }

  const { user, isAuthenticated, loading } = authContext;
  const location = useLocation();

  if (loading) {
    return <Loading />;
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



