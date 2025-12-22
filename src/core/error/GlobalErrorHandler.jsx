import React, { useContext } from 'react';
import { Alert, Snackbar, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { AppContext } from '../../contexts/AppContext';

const GlobalErrorHandler = () => {
  // Use context directly to avoid useApp hook error during hot reload
  const appContext = useContext(AppContext);

  // If context is not ready, return null
  if (!appContext) {
    return null;
  }

  const { globalError, hideGlobalError } = appContext;

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    hideGlobalError();
  };

  if (!globalError) return null;

  return (
    <Snackbar
      open={!!globalError}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={handleClose}
        severity="error"
        variant="filled"
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {typeof globalError === 'string' ? globalError : globalError.message || 'An error occurred'}
      </Alert>
    </Snackbar>
  );
};

export default GlobalErrorHandler;
