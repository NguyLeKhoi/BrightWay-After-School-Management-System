import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import authService from '../auth.service';
import axiosInstance from '../../config/axios.config';

// Mock dependencies
vi.mock('../../config/axios.config');
vi.mock('jwt-decode');

const { jwtDecode } = await import('jwt-decode');

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.location
delete window.location;
window.location = { href: '' };

describe('authService', () => {
  const mockCredentials = {
    email: 'test@example.com',
    password: 'password123'
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'User'
  };

  const mockTokens = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token'
  };

  const mockDecodedToken = {
    [import.meta.env.VITE_JWT_CLAIM_USER_ID]: 'user-1',
    [import.meta.env.VITE_JWT_CLAIM_EMAIL]: 'test@example.com',
    [import.meta.env.VITE_JWT_CLAIM_ROLE]: 'User'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage mocks
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('login', () => {
    it('should login successfully and store tokens and user info', async () => {
      const mockResponse = {
        data: mockTokens
      };

      axiosInstance.post.mockResolvedValue(mockResponse);
      jwtDecode.mockReturnValue(mockDecodedToken);

      const result = await authService.login(mockCredentials);

      expect(axiosInstance.post).toHaveBeenCalledWith('/Auth/login', mockCredentials);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', mockTokens.access_token);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', mockTokens.refresh_token);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
      expect(result).toEqual({
        accessToken: mockTokens.access_token,
        refreshToken: mockTokens.refresh_token,
        user: mockUser
      });
    });

    it('should handle login failure', async () => {
      const mockError = {
        response: {
          data: { message: 'Invalid credentials' }
        }
      };

      axiosInstance.post.mockRejectedValue(mockError);

      await expect(authService.login(mockCredentials)).rejects.toThrow('Invalid credentials');
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network Error');
      axiosInstance.post.mockRejectedValue(networkError);

      await expect(authService.login(mockCredentials)).rejects.toThrow('Network Error');
    });

    it('should handle missing tokens in response', async () => {
      const mockResponse = {
        data: {}
      };

      axiosInstance.post.mockResolvedValue(mockResponse);

      const result = await authService.login(mockCredentials);

      expect(result).toEqual({});
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should handle JWT decode error gracefully', async () => {
      const mockResponse = {
        data: mockTokens
      };

      axiosInstance.post.mockResolvedValue(mockResponse);
      jwtDecode.mockImplementation(() => {
        throw new Error('Invalid JWT');
      });

      await expect(authService.login(mockCredentials)).rejects.toThrow();
    });

    it('should use default role when role is not in JWT', async () => {
      const mockDecodedTokenWithoutRole = {
        [import.meta.env.VITE_JWT_CLAIM_USER_ID]: 'user-1',
        [import.meta.env.VITE_JWT_CLAIM_EMAIL]: 'test@example.com'
      };

      const mockResponse = {
        data: mockTokens
      };

      axiosInstance.post.mockResolvedValue(mockResponse);
      jwtDecode.mockReturnValue(mockDecodedTokenWithoutRole);

      const result = await authService.login(mockCredentials);

      expect(result.user.role).toBe('User');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'refreshToken') return 'old-refresh-token';
        return null;
      });

      const mockResponse = {
        data: newTokens
      };

      axiosInstance.post.mockResolvedValue(mockResponse);
      jwtDecode.mockReturnValue(mockDecodedToken);

      const result = await authService.refreshToken();

      expect(axiosInstance.post).toHaveBeenCalledWith('/Auth/refresh', {
        refreshToken: 'old-refresh-token'
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'new-access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'new-refresh-token');
      expect(result).toEqual(newTokens);
    });

    it('should handle camelCase and snake_case token responses', async () => {
      const camelCaseTokens = {
        accessToken: 'camel-access',
        refreshToken: 'camel-refresh'
      };

      const snakeCaseTokens = {
        access_token: 'snake-access',
        refresh_token: 'snake-refresh'
      };

      // Test camelCase
      localStorageMock.getItem.mockReturnValue('old-refresh-token');
      axiosInstance.post.mockResolvedValueOnce({ data: camelCaseTokens });

      let result = await authService.refreshToken();

      expect(result).toEqual({
        accessToken: 'camel-access',
        refreshToken: 'camel-refresh'
      });

      // Test snake_case
      axiosInstance.post.mockResolvedValueOnce({ data: snakeCaseTokens });

      result = await authService.refreshToken();

      expect(result).toEqual({
        accessToken: 'snake-access',
        refreshToken: 'snake-refresh'
      });
    });

    it('should throw error when no refresh token available', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      await expect(authService.refreshToken()).rejects.toThrow('No refresh token available');
    });

    it('should handle invalid refresh response', async () => {
      localStorageMock.getItem.mockReturnValue('old-refresh-token');

      const mockResponse = {
        data: {}
      };

      axiosInstance.post.mockResolvedValue(mockResponse);

      await expect(authService.refreshToken()).rejects.toThrow('Invalid refresh response');
    });

    it('should clear tokens on refresh failure', async () => {
      localStorageMock.getItem.mockReturnValue('old-refresh-token');

      const mockError = {
        response: {
          data: { message: 'Invalid refresh token' }
        }
      };

      axiosInstance.post.mockRejectedValue(mockError);

      await expect(authService.refreshToken()).rejects.toThrow();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('logout', () => {
    it('should logout successfully and clear all data', async () => {
      localStorageMock.getItem.mockReturnValue('refresh-token');

      axiosInstance.post.mockResolvedValue({ data: {} });

      await authService.logout();

      expect(axiosInstance.post).toHaveBeenCalledWith('/Auth/logout', {
        refreshToken: 'refresh-token'
      });
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
      expect(window.location.href).toBe('/login');
    });

    it('should handle logout API failure gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('refresh-token');

      const mockError = new Error('API Error');
      axiosInstance.post.mockRejectedValue(mockError);

      // Mock console.log to avoid console output in tests
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await authService.logout();

      expect(consoleSpy).toHaveBeenCalledWith('Logout API call completed (or failed):', mockError.message);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
      expect(window.location.href).toBe('/login');

      consoleSpy.mockRestore();
    });

    it('should handle logout when no refresh token', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      axiosInstance.post.mockResolvedValue({ data: {} });

      await authService.logout();

      expect(axiosInstance.post).toHaveBeenCalledWith('/Auth/logout', {
        refreshToken: null
      });
      expect(window.location.href).toBe('/login');
    });

    it('should force redirect even on error', async () => {
      axiosInstance.post.mockRejectedValue(new Error('Network error'));

      await authService.logout();

      expect(window.location.href).toBe('/login');
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user when available', () => {
      const userData = JSON.stringify(mockUser);
      localStorageMock.getItem.mockReturnValue(userData);

      const result = authService.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('user');
    });

    it('should return null when no user data', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = authService.getCurrentUser();

      expect(result).toBeNull();
    });

    it('should throw error when user data is invalid JSON', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      expect(() => {
        authService.getCurrentUser();
      }).toThrow(SyntaxError);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when both tokens exist', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'accessToken') return 'access-token';
        if (key === 'refreshToken') return 'refresh-token';
        return null;
      });

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when access token is missing', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'refreshToken') return 'refresh-token';
        return null;
      });

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false when refresh token is missing', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'accessToken') return 'access-token';
        return null;
      });

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false when both tokens are missing', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('sendResetCode', () => {
    it('should send reset code successfully', async () => {
      const data = { email: 'test@example.com' };
      const mockResponse = { data: { success: true } };

      axiosInstance.post.mockResolvedValue(mockResponse);

      const result = await authService.sendResetCode(data);

      expect(axiosInstance.post).toHaveBeenCalledWith('/Auth/send-reset-code', data);
      expect(result).toEqual({ success: true });
    });

    it('should handle send reset code failure', async () => {
      const data = { email: 'test@example.com' };
      const mockError = {
        response: {
          data: { message: 'Email not found' }
        }
      };

      axiosInstance.post.mockRejectedValue(mockError);

      await expect(authService.sendResetCode(data)).rejects.toThrow('Email not found');
    });
  });

  describe('validateResetCode', () => {
    it('should validate reset code successfully', async () => {
      const data = { email: 'test@example.com', code: '123456' };
      const mockResponse = { data: { valid: true } };

      axiosInstance.post.mockResolvedValue(mockResponse);

      const result = await authService.validateResetCode(data);

      expect(axiosInstance.post).toHaveBeenCalledWith('/Auth/validate-reset-code', data);
      expect(result).toEqual({ valid: true });
    });

    it('should handle validate reset code failure', async () => {
      const data = { email: 'test@example.com', code: '123456' };
      const mockError = {
        response: {
          data: { message: 'Invalid code' }
        }
      };

      axiosInstance.post.mockRejectedValue(mockError);

      await expect(authService.validateResetCode(data)).rejects.toThrow('Invalid code');
    });
  });

  describe('resetPasswordWithCode', () => {
    it('should reset password successfully', async () => {
      const data = {
        email: 'test@example.com',
        code: '123456',
        newPassword: 'newpassword123'
      };
      const mockResponse = { data: { success: true } };

      axiosInstance.post.mockResolvedValue(mockResponse);

      const result = await authService.resetPasswordWithCode(data);

      expect(axiosInstance.post).toHaveBeenCalledWith('/Auth/reset-password-with-code', data);
      expect(result).toEqual({ success: true });
    });

    it('should handle reset password failure', async () => {
      const data = {
        email: 'test@example.com',
        code: '123456',
        newPassword: 'newpassword123'
      };
      const mockError = {
        response: {
          data: { message: 'Invalid code or email' }
        }
      };

      axiosInstance.post.mockRejectedValue(mockError);

      await expect(authService.resetPasswordWithCode(data)).rejects.toThrow('Invalid code or email');
    });
  });

  describe('setPassword', () => {
    it('should set password successfully', async () => {
      const data = {
        userId: 'user-1',
        token: 'reset-token',
        password: 'newpassword123'
      };
      const mockResponse = { data: { success: true } };

      axiosInstance.post.mockResolvedValue(mockResponse);

      const result = await authService.setPassword(data);

      expect(axiosInstance.post).toHaveBeenCalledWith('/Auth/set-password', {
        userId: 'user-1',
        token: encodeURIComponent('reset-token'),
        newPassword: 'newpassword123'
      });
      expect(result).toEqual({ success: true });
    });

    it('should handle encodeURIComponent for token', async () => {
      const data = {
        userId: 'user-1',
        token: 'token+with+spaces',
        password: 'newpassword123'
      };
      const mockResponse = { data: { success: true } };

      axiosInstance.post.mockResolvedValue(mockResponse);

      await authService.setPassword(data);

      expect(axiosInstance.post).toHaveBeenCalledWith('/Auth/set-password', {
        userId: 'user-1',
        token: 'token%2Bwith%2Bspaces',
        newPassword: 'newpassword123'
      });
    });

    it('should handle set password failure', async () => {
      const data = {
        userId: 'user-1',
        token: 'reset-token',
        password: 'newpassword123'
      };
      const mockError = {
        response: {
          data: { message: 'Invalid token' }
        }
      };

      axiosInstance.post.mockRejectedValue(mockError);

      await expect(authService.setPassword(data)).rejects.toThrow('Invalid token');
    });

    it('should handle missing token', async () => {
      const data = {
        userId: 'user-1',
        password: 'newpassword123'
      };
      const mockResponse = { data: { success: true } };

      axiosInstance.post.mockResolvedValue(mockResponse);

      await authService.setPassword(data);

      expect(axiosInstance.post).toHaveBeenCalledWith('/Auth/set-password', {
        userId: 'user-1',
        token: '',
        newPassword: 'newpassword123'
      });
    });
  });

  describe('ping', () => {
    it('should return resolved promise', async () => {
      const result = await authService.ping();

      expect(result).toBeUndefined();
    });
  });
});
