import axios from 'axios';
import authService from '../services/auth.service';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

// Process failed requests after token refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor - Add token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally and refresh token
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle different error status codes
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Check if this is a session_ended or invalid_token error
          const errorData = error.response?.data;
          const errorCode = errorData?.code || errorData?.errorCode;
          
          // Handle session_ended (another device logged in) or invalid_token (token mismatch, possibly due to another user login in different tab)
          if (errorCode === 'session_ended' || errorCode === 'invalid_token') {
            // Determine appropriate message based on error code
            let errorMessage;
            if (errorCode === 'session_ended') {
              errorMessage = errorData?.message || 'Phiên đăng nhập của bạn đã bị kết thúc do tài khoản được đăng nhập trên thiết bị khác.';
            } else {
              // invalid_token - could be due to token mismatch from another user login in different tab
              errorMessage = errorData?.message || 'Token không hợp lệ. Có thể do bạn đã đăng nhập tài khoản khác trong tab khác. Vui lòng đăng nhập lại.';
            }
            
            // Clear tokens and user data
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            
            // Store message in sessionStorage to show dialog on login page
            sessionStorage.setItem('sessionEndedMessage', errorMessage);
            
            // Redirect to login immediately
            const currentPath = window.location.pathname;
            if (currentPath !== '/login' && !currentPath.includes('/login')) {
              window.location.href = '/login';
            } else {
              // Already on login page, show dialog immediately
              if (window.__showSessionEndedDialog) {
                window.__showSessionEndedDialog(errorMessage);
              }
            }
            
            return Promise.reject(error);
          }
          
          // Unauthorized - try to refresh token
          // Skip refresh for certain endpoints that might return 401 for other reasons
          // Also skip for public endpoints that don't require authentication
          // Also skip for parent creation endpoints to avoid auto-logout during creation
          const skipRefreshPaths = [
            '/Auth/login',
            '/Auth/refresh',
            '/ContactRequest/submit',
            '/User/create-parent',
            '/User/create-parent-with-cccd'
          ];
          if (skipRefreshPaths.some(path => originalRequest.url?.includes(path))) {
            return Promise.reject(error);
          }
          
          if (!originalRequest._retry) {
            originalRequest._retry = true;
            
            if (isRefreshing) {
              // If already refreshing, queue this request
              return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
              }).then(token => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return axiosInstance(originalRequest);
              }).catch(err => {
                return Promise.reject(err);
              });
            }
            
            isRefreshing = true;
            
            try {
              // Try to refresh token
              const response = await authService.refreshToken();
              const newToken = response.accessToken;
              
              // Update the original request with new token
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              
              // Process queued requests
              processQueue(null, newToken);
              
              // Retry the original request
              return axiosInstance(originalRequest);
            } catch (refreshError) {
              // Check if refresh error is session_ended or invalid_token
              const refreshErrorData = refreshError.response?.data;
              const refreshErrorCode = refreshErrorData?.code || refreshErrorData?.errorCode;
              
              if (refreshErrorCode === 'session_ended' || refreshErrorCode === 'invalid_token') {
                // Session ended or invalid token during refresh attempt
                let refreshErrorMessage;
                if (refreshErrorCode === 'session_ended') {
                  refreshErrorMessage = refreshErrorData?.message || 'Phiên đăng nhập của bạn đã bị kết thúc do tài khoản được đăng nhập trên thiết bị khác.';
                } else {
                  refreshErrorMessage = refreshErrorData?.message || 'Token không hợp lệ. Có thể do bạn đã đăng nhập tài khoản khác trong tab khác. Vui lòng đăng nhập lại.';
                }
                
                // Clear tokens and user data
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                
                // Process queued requests with error
                processQueue(refreshError, null);
                
                // Store message in sessionStorage to show dialog on login page
                sessionStorage.setItem('sessionEndedMessage', refreshErrorMessage);
                
                // Redirect to login immediately
                const currentPath = window.location.pathname;
                if (currentPath !== '/login' && !currentPath.includes('/login')) {
                  window.location.href = '/login';
                } else {
                  // Already on login page, show dialog immediately
                  if (window.__showSessionEndedDialog) {
                    window.__showSessionEndedDialog(refreshErrorMessage);
                  }
                }
                
                return Promise.reject(refreshError);
              }
              
              // Refresh failed for other reasons, clear tokens and redirect to login
              processQueue(refreshError, null);
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              
              // Only redirect if not already on login page
              // Use setTimeout to prevent redirect during successful operations
              // Check if we're in the middle of a successful operation
              const currentPath = window.location.pathname;
              if (currentPath !== '/login' && !currentPath.includes('/login')) {
                // Delay redirect to allow any success toasts/messages to show
                setTimeout(() => {
                  const stillNotOnLogin = window.location.pathname !== '/login' && !window.location.pathname.includes('/login');
                  if (stillNotOnLogin) {
                    window.location.href = '/login';
                  }
                }, 500);
              }
              return Promise.reject(refreshError);
            } finally {
              isRefreshing = false;
            }
          } else {
            // Already retried, redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            
            // Only redirect if not already on login page
            // Use setTimeout to prevent redirect during successful operations
            const currentPath = window.location.pathname;
            if (currentPath !== '/login' && !currentPath.includes('/login')) {
              setTimeout(() => {
                const stillNotOnLogin = window.location.pathname !== '/login' && !window.location.pathname.includes('/login');
                if (stillNotOnLogin) {
                  window.location.href = '/login';
                }
              }, 500);
            }
          }
          break;
        
        case 403:
          // Forbidden
          break;
        
        case 404:
          // Not found
          break;
        
        case 500:
          // Server error
          break;
        
        default:
          break;
      }
    } else if (error.request) {
      // Request was made but no response received
    } else {
      // Something else happened
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

