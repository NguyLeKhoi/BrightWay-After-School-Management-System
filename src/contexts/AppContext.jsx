import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../config/axios.config';

export const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined || context === null) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // Global loading state
  const [globalLoading, setGlobalLoading] = useState(false);
  
  // Global error state
  const [globalError, setGlobalError] = useState(null);
  
  // Global notification state (deprecated - using react-toastify now)
  const [notifications, setNotifications] = useState([]);
  
  // Theme state
  const [theme, setTheme] = useState('light');
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Session ended dialog state
  const [sessionEndedDialog, setSessionEndedDialog] = useState({
    open: false,
    message: null
  });

  // Show global loading
  const showGlobalLoading = () => setGlobalLoading(true);
  const hideGlobalLoading = () => setGlobalLoading(false);

  // Show global error
  const showGlobalError = (error) => {
    setGlobalError(error);
    // Auto hide after 5 seconds
    setTimeout(() => setGlobalError(null), 5000);
  };
  const hideGlobalError = () => setGlobalError(null);

  // Notification management using react-toastify
  const addNotification = (notification) => {
    const { message, severity = 'info', duration = 4000 } = notification;
    
    switch (severity) {
      case 'success':
        toast.success(message, { autoClose: duration });
        break;
      case 'error':
        toast.error(message, { autoClose: duration });
        break;
      case 'warning':
        toast.warning(message, { autoClose: duration });
        break;
      case 'info':
      default:
        toast.info(message, { autoClose: duration });
        break;
    }
    
    return Date.now(); // Return a fake ID for compatibility
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Theme management
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Sidebar management
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };
  
  // Session ended dialog management
  const showSessionEndedDialog = useCallback((message) => {
    setSessionEndedDialog({
      open: true,
      message: message || 'Phiên đăng nhập của bạn đã bị kết thúc do tài khoản được đăng nhập trên thiết bị khác.'
    });
  }, []);
  
  const closeSessionEndedDialog = useCallback(() => {
    setSessionEndedDialog({
      open: false,
      message: null
    });
  }, []);
  
  // Expose function globally for axios interceptor
  useEffect(() => {
    // Expose on window for easier access from interceptor
    window.__showSessionEndedDialog = showSessionEndedDialog;
    
    return () => {
      delete window.__showSessionEndedDialog;
    };
  }, [showSessionEndedDialog]);

  // Listen for storage changes from other tabs (e.g., when another user logs in)
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Only handle changes to accessToken or refreshToken
      if (e.key === 'accessToken' || e.key === 'refreshToken' || e.key === 'user') {
        // Check if the change was made by another tab (not this one)
        if (e.newValue !== e.oldValue) {
          // If tokens were changed by another tab, it means another user logged in
          // Get current user from localStorage before clearing
          const currentUserStr = localStorage.getItem('user');
          const newUserStr = e.newValue && e.key === 'user' ? e.newValue : localStorage.getItem('user');
          
          // If user changed, it means another user logged in
          if (currentUserStr && newUserStr && currentUserStr !== newUserStr) {
            // Another user logged in - store message and redirect to login
            const message = 'Tài khoản khác đã được đăng nhập trong tab khác. Vui lòng đăng nhập lại.';
            sessionStorage.setItem('sessionEndedMessage', message);
            
            // Clear tokens for this tab
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            
            // Redirect to login
            const currentPath = window.location.pathname;
            if (currentPath !== '/login' && !currentPath.includes('/login')) {
              window.location.href = '/login';
            } else {
              // Already on login page, show dialog
              if (window.__showSessionEndedDialog) {
                window.__showSessionEndedDialog(message);
              }
            }
          } else if (e.key === 'accessToken' || e.key === 'refreshToken') {
            // Tokens were changed - could be refresh or another user login
            // Check if we still have valid user data
            const currentUser = localStorage.getItem('user');
            if (!currentUser) {
              // User data was cleared - likely another user logged in
              const message = 'Tài khoản khác đã được đăng nhập trong tab khác. Vui lòng đăng nhập lại.';
              sessionStorage.setItem('sessionEndedMessage', message);
              
              // Redirect to login
              const currentPath = window.location.pathname;
              if (currentPath !== '/login' && !currentPath.includes('/login')) {
                window.location.href = '/login';
              } else {
                // Already on login page, show dialog
                if (window.__showSessionEndedDialog) {
                  window.__showSessionEndedDialog(message);
                }
              }
            }
          }
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [showSessionEndedDialog]);

  // Warm-up backend removed - OPTIONS method not supported by backend
  // This was causing 405 (Method Not Allowed) errors in console
  // If warm-up is needed in the future, use a different endpoint that supports OPTIONS

  const value = {
    // Loading
    globalLoading,
    showGlobalLoading,
    hideGlobalLoading,
    
    // Error
    globalError,
    showGlobalError,
    hideGlobalError,
    
    // Notifications
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    
    // Theme
    theme,
    toggleTheme,
    
    // Sidebar
    sidebarOpen,
    toggleSidebar,
    
    // Session ended dialog
    sessionEndedDialog,
    showSessionEndedDialog,
    closeSessionEndedDialog
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
