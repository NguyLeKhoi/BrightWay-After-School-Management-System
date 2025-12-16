import React from 'react';
import { render, renderHook } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AppProvider } from '../contexts/AppContext';
import { AuthProvider } from '../contexts/AuthContext';

/**
 * Mock user data for different roles
 */
export const mockUsers = {
  admin: {
    id: 'admin-1',
    email: 'admin@test.com',
    role: 'Admin'
  },
  manager: {
    id: 'manager-1',
    email: 'manager@test.com',
    role: 'Manager'
  },
  staff: {
    id: 'staff-1',
    email: 'staff@test.com',
    role: 'Staff'
  },
  user: {
    id: 'user-1',
    email: 'parent@test.com',
    role: 'User'
  }
};

/**
 * Mock child data
 */
export const mockChildren = [
  {
    id: 'child-1',
    fullName: 'Nguyễn Văn A',
    dateOfBirth: '2015-01-01',
    grade: 'Lớp 1',
    school: 'Trường Tiểu học ABC'
  },
  {
    id: 'child-2',
    fullName: 'Nguyễn Văn B',
    dateOfBirth: '2014-05-15',
    grade: 'Lớp 2',
    school: 'Trường Tiểu học ABC'
  }
];

/**
 * Mock package data
 */
export const mockPackages = [
  {
    id: 'package-1',
    name: 'Gói học hè',
    price: 2000000,
    duration: 3,
    description: 'Gói học hè 3 tháng'
  },
  {
    id: 'package-2',
    name: 'Gói học ngày',
    price: 1500000,
    duration: 1,
    description: 'Gói học trong ngày'
  }
];

/**
 * Mock authentication response
 */
export const mockAuthResponse = {
  access_token: 'mock-jwt-token',
  refresh_token: 'mock-refresh-token',
  user: mockUsers.user
};

/**
 * Mock API response
 */
export const mockApiResponse = {
  data: mockChildren,
  totalCount: 2,
  pageIndex: 1,
  pageSize: 10
};

/**
 * Wrapper component for testing hooks/components that need AppContext
 */
export const TestWrapper = ({ children }) => {
  return <AppProvider>{children}</AppProvider>;
};

/**
 * Wrapper component with Router for navigation testing
 */
export const RouterWrapper = ({ children }) => {
  return (
    <BrowserRouter>
      <AppProvider>
        {children}
      </AppProvider>
    </BrowserRouter>
  );
};

/**
 * Wrapper component with Auth context for authentication testing
 */
export const AuthWrapper = ({ children, initialUser = null }) => {
  return (
    <BrowserRouter>
      <AuthProvider initialUser={initialUser}>
        <AppProvider>
          {children}
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

/**
 * Render hook with AppProvider wrapper
 */
export const renderWithAppProvider = (ui, options) => {
  return render(ui, {
    wrapper: TestWrapper,
    ...options
  });
};

/**
 * Render hook with Router wrapper
 */
export const renderWithRouter = (ui, options) => {
  return render(ui, {
    wrapper: RouterWrapper,
    ...options
  });
};

/**
 * Render hook with Auth wrapper
 */
export const renderWithAuth = (ui, options) => {
  return render(ui, {
    wrapper: AuthWrapper,
    ...options
  });
};

/**
 * Render hook with custom wrapper
 */
export const renderHookWithWrapper = (hook, wrapper = TestWrapper, options = {}) => {
  return renderHook(hook, {
    wrapper,
    ...options
  });
};

/**
 * Mock localStorage
 */
export const mockLocalStorage = () => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });

  return localStorageMock;
};

/**
 * Mock axios instance
 */
export const mockAxios = () => {
  const mockResponse = {
    data: {},
    status: 200,
    statusText: 'OK'
  };

  return {
    get: vi.fn().mockResolvedValue(mockResponse),
    post: vi.fn().mockResolvedValue(mockResponse),
    put: vi.fn().mockResolvedValue(mockResponse),
    delete: vi.fn().mockResolvedValue(mockResponse),
    patch: vi.fn().mockResolvedValue(mockResponse)
  };
};

/**
 * Setup authentication mocks
 */
export const setupAuthMocks = (user = mockUsers.user) => {
  const localStorageMock = mockLocalStorage();

  // Mock localStorage to return user data
  localStorageMock.getItem.mockImplementation((key) => {
    if (key === 'user') return JSON.stringify(user);
    if (key === 'accessToken') return 'mock-access-token';
    if (key === 'refreshToken') return 'mock-refresh-token';
    return null;
  });

  return { localStorageMock };
};

/**
 * Create mock router state
 */
export const createMockRouterState = (pathname = '/', search = '', state = null) => {
  return {
    pathname,
    search,
    state,
    hash: '',
    key: 'test-key'
  };
};

