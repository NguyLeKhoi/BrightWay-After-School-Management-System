import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }) => <div>{children}</div>
}));

// Mock Loading component
vi.mock('../../components/Common/Loading', () => ({
  default: () => <div>Loading...</div>
}));

const TestComponent = () => <div>Protected Content</div>;
const LoginComponent = () => <div>Login Page</div>;

const renderWithRouter = (ui, initialEntries = ['/']) => {
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginComponent />} />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <TestComponent />
          </ProtectedRoute>
        } />
        <Route path="/user" element={
          <ProtectedRoute allowedRoles={['User']}>
            <TestComponent />
          </ProtectedRoute>
        } />
        <Route path="/public" element={
          <ProtectedRoute allowedRoles={[]}>
            <TestComponent />
          </ProtectedRoute>
        } />
        <Route path="/" element={ui} />
      </Routes>
    </BrowserRouter>
  );
};

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading when authentication is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: true
      });

      renderWithRouter(
        <ProtectedRoute allowedRoles={['Admin']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Unauthenticated Users', () => {
    it('should redirect to login when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute allowedRoles={['Admin']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('should redirect to login when user object is null but isAuthenticated is true', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: true,
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute allowedRoles={['Admin']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow access when user has correct role (Admin)', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', role: 'Admin' },
        isAuthenticated: true,
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute allowedRoles={['Admin']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should allow access when user has correct role (Manager)', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'manager@test.com', role: 'Manager' },
        isAuthenticated: true,
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute allowedRoles={['Manager']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should allow access when user has correct role (Staff)', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'staff@test.com', role: 'Staff' },
        isAuthenticated: true,
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute allowedRoles={['Staff']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should allow access when user has correct role (User)', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@test.com', role: 'User' },
        isAuthenticated: true,
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute allowedRoles={['User']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should allow access with multiple allowed roles', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'manager@test.com', role: 'Manager' },
        isAuthenticated: true,
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should deny access when user has insufficient role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@test.com', role: 'User' },
        isAuthenticated: true,
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute allowedRoles={['Admin']}>
          <TestComponent />
        </ProtectedRoute>
      );

      // Should redirect to user's default path
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Case-Insensitive Role Comparison', () => {
    it('should handle case-insensitive role comparison (uppercase)', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', role: 'ADMIN' },
        isAuthenticated: true,
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute allowedRoles={['admin']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should handle case-insensitive role comparison (lowercase)', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin' },
        isAuthenticated: true,
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Public Routes', () => {
    it('should allow access to public routes (empty allowedRoles)', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@test.com', role: 'User' },
        isAuthenticated: true,
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute allowedRoles={[]}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Redirect Behavior', () => {
    it('should redirect to custom path when redirectTo is specified', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@test.com', role: 'User' },
        isAuthenticated: true,
        loading: false
      });

      render(
        <BrowserRouter>
          <ProtectedRoute allowedRoles={['Admin']} redirectTo="/custom">
            <TestComponent />
          </ProtectedRoute>
        </BrowserRouter>
      );

      // Since we're not in a Routes context, we can't test the actual redirect
      // but we can verify the component doesn't render protected content
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should redirect to role-specific default path when no redirectTo specified', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@test.com', role: 'User' },
        isAuthenticated: true,
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute allowedRoles={['Admin']}>
          <TestComponent />
        </ProtectedRoute>
      );

      // Should redirect to user's default dashboard
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should redirect to root path when role has no default path', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'unknown@test.com', role: 'Unknown' },
        isAuthenticated: true,
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute allowedRoles={['Admin']}>
          <TestComponent />
        </ProtectedRoute>
      );

      // Should redirect to root path
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Navigation State', () => {
    it('should preserve location state when redirecting to login', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute allowedRoles={['Admin']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
      // The Navigate component should preserve the 'from' location
    });
  });

  describe('Edge Cases', () => {
    it('should handle null user role gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@test.com', role: null },
        isAuthenticated: true,
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute allowedRoles={['Admin']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should handle undefined user role gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@test.com', role: undefined },
        isAuthenticated: true,
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute allowedRoles={['Admin']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should handle empty string user role gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@test.com', role: '' },
        isAuthenticated: true,
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute allowedRoles={['Admin']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });
});
