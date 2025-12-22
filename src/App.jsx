import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { routes } from './router/Router.jsx';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import ErrorBoundary from './core/error/ErrorBoundary';
import GlobalErrorHandler from './core/error/GlobalErrorHandler';
import SessionEndedDialog from './components/Common/SessionEndedDialog';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Separate component that uses AppContext - must be inside AppProvider
const AppContent = () => {
  return (
    <>
      <RouterProvider router={routes} />
      <GlobalErrorHandler />
      <SessionEndedDialog />
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
