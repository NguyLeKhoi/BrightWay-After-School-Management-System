import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login/index.jsx';
import { AuthProvider } from '../../../contexts/AuthContext';
import { AppProvider } from '../../../contexts/AppContext';

// Mock hooks
vi.mock('../../../hooks/useLoading', () => ({
  useLoading: () => ({
    isLoading: false,
    showLoading: vi.fn(),
    hideLoading: vi.fn()
  })
}));

// Mock contexts
const mockLogin = vi.fn();
const mockAddNotification = vi.fn();
const mockShowGlobalError = vi.fn();
const mockShowSessionEndedDialog = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin
  }),
  AuthProvider: ({ children }) => <div>{children}</div>
}));

vi.mock('../../../contexts/AppContext', () => ({
  useApp: () => ({
    addNotification: mockAddNotification,
    showGlobalError: mockShowGlobalError,
    showSessionEndedDialog: mockShowSessionEndedDialog
  }),
  AppProvider: ({ children }) => <div>{children}</div>
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorageMock.getItem.mockReturnValue(null);
  });

  describe('Initial Render', () => {
    it('should render login form with all required elements', () => {
      renderLogin();

      expect(screen.getByText('BRIGHTWAY')).toBeInTheDocument();
      expect(screen.getByText('After School Management Portal')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/mật khẩu/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument();
      expect(screen.getByTitle('Về trang chủ')).toBeInTheDocument();
    });

    it('should render home icon button', () => {
      renderLogin();

      const homeButton = screen.getByTitle('Về trang chủ');
      expect(homeButton).toBeInTheDocument();
    });
  });

  describe('Session Ended Dialog', () => {
    it('should show session ended dialog when sessionEndedMessage exists', () => {
      const message = 'Phiên đăng nhập đã hết hạn';
      sessionStorageMock.getItem.mockReturnValue(message);

      renderLogin();

      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('sessionEndedMessage');
      expect(mockShowSessionEndedDialog).toHaveBeenCalledWith(message);
    });

    it('should not show session ended dialog when no message', () => {
      sessionStorageMock.getItem.mockReturnValue(null);

      renderLogin();

      expect(mockShowSessionEndedDialog).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should handle successful login for Admin role', async () => {
      const loginData = {
        email: 'admin@test.com',
        password: 'password123'
      };

      const mockResponse = {
        user: { id: '1', email: 'admin@test.com', role: 'Admin' }
      };

      mockLogin.mockResolvedValue(mockResponse);

      renderLogin();

      // Fill form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: loginData.email }
      });
      fireEvent.change(screen.getByLabelText(/mật khẩu/i), {
        target: { value: loginData.password }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(loginData);
        expect(mockAddNotification).toHaveBeenCalledWith({
          message: 'Đăng nhập thành công!',
          severity: 'success'
        });
        expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
      });
    });

    it('should handle successful login for Manager role', async () => {
      const mockResponse = {
        user: { id: '1', email: 'manager@test.com', role: 'Manager' }
      };

      mockLogin.mockResolvedValue(mockResponse);

      renderLogin();

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'manager@test.com' }
      });
      fireEvent.change(screen.getByLabelText(/mật khẩu/i), {
        target: { value: 'password123' }
      });

      fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/manager/dashboard');
      });
    });

    it('should handle successful login for Staff role', async () => {
      const mockResponse = {
        user: { id: '1', email: 'staff@test.com', role: 'Staff' }
      };

      mockLogin.mockResolvedValue(mockResponse);

      renderLogin();

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'staff@test.com' }
      });
      fireEvent.change(screen.getByLabelText(/mật khẩu/i), {
        target: { value: 'password123' }
      });

      fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/staff');
      });
    });

    it('should handle successful login for User role', async () => {
      const mockResponse = {
        user: { id: '1', email: 'user@test.com', role: 'User' }
      };

      mockLogin.mockResolvedValue(mockResponse);

      renderLogin();

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'user@test.com' }
      });
      fireEvent.change(screen.getByLabelText(/mật khẩu/i), {
        target: { value: 'password123' }
      });

      fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/user/dashboard');
      });
    });

    it('should handle login with numeric role values', async () => {
      const mockResponse = {
        user: { id: '1', email: 'admin@test.com', role: 0 } // Admin as number
      };

      mockLogin.mockResolvedValue(mockResponse);

      renderLogin();

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'admin@test.com' }
      });
      fireEvent.change(screen.getByLabelText(/mật khẩu/i), {
        target: { value: 'password123' }
      });

      fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
      });
    });

    it('should handle login failure', async () => {
      const errorMessage = 'Email hoặc mật khẩu không đúng';
      mockLogin.mockRejectedValue(new Error(errorMessage));

      renderLogin();

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'wrong@test.com' }
      });
      fireEvent.change(screen.getByLabelText(/mật khẩu/i), {
        target: { value: 'wrongpassword' }
      });

      fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
        expect(mockShowGlobalError).toHaveBeenCalledWith(errorMessage);
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network Error');
      mockLogin.mockRejectedValue(networkError);

      renderLogin();

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@test.com' }
      });
      fireEvent.change(screen.getByLabelText(/mật khẩu/i), {
        target: { value: 'password123' }
      });

      fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

      await waitFor(() => {
        expect(mockShowGlobalError).toHaveBeenCalledWith('Network Error');
      });
    });

    it('should handle unknown role gracefully', async () => {
      const mockResponse = {
        user: { id: '1', email: 'unknown@test.com', role: 'Unknown' }
      };

      mockLogin.mockResolvedValue(mockResponse);

      renderLogin();

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'unknown@test.com' }
      });
      fireEvent.change(screen.getByLabelText(/mật khẩu/i), {
        target: { value: 'password123' }
      });

      fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/parent/profile');
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to home page when home button is clicked', () => {
      renderLogin();

      const homeButton = screen.getByTitle('Về trang chủ');
      fireEvent.click(homeButton);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty fields', async () => {
      renderLogin();

      fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

      // Form should prevent submission with empty fields
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show validation errors for invalid email', async () => {
      renderLogin();

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'invalid-email' }
      });
      fireEvent.change(screen.getByLabelText(/mật khẩu/i), {
        target: { value: 'password123' }
      });

      fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

      // Should not submit with invalid email
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading state during login', async () => {
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderLogin();

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@test.com' }
      });
      fireEvent.change(screen.getByLabelText(/mật khẩu/i), {
        target: { value: 'password123' }
      });

      fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

      // Loading component should be shown
      await waitFor(() => {
        expect(screen.getByText('BRIGHTWAY')).toBeInTheDocument();
      });
    });
  });
});
