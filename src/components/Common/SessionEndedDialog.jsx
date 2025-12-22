import React, { useContext } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { AppContext } from '../../contexts/AppContext';

const SessionEndedDialog = () => {
  // Use context directly to avoid useApp hook error during hot reload
  const appContext = useContext(AppContext);

  // If context is not ready, return null
  if (!appContext) {
    return null;
  }

  const { sessionEndedDialog, closeSessionEndedDialog } = appContext;

  return (
    <Dialog
      open={sessionEndedDialog.open}
      onClose={closeSessionEndedDialog}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Phiên đăng nhập kết thúc</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mt: 2 }}>
          {sessionEndedDialog.message || 'Phiên đăng nhập của bạn đã bị kết thúc. Vui lòng đăng nhập lại.'}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeSessionEndedDialog} variant="contained">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionEndedDialog;
