import React from 'react';
import { Dialog, DialogTitle, DialogContent, Button, Box } from '@mui/material';

const ManagementFormDialog = ({
  open,
  onClose,
  mode,
  title,
  rawTitle,
  icon: Icon,
  loading = false,
  children,
  maxWidth = 'sm'
}) => {
  const dialogTitle = rawTitle || (mode === 'create' ? `Thêm ${title} mới` : `Chỉnh sửa ${title}`);

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      maxWidth={maxWidth}
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-2xl)'
        }
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
          color: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          fontFamily: 'var(--font-family)',
          fontWeight: 'var(--font-weight-semibold)',
          fontSize: 'var(--font-size-xl)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {Icon && <Icon sx={{ fontSize: '24px' }} />}
          <span>{dialogTitle}</span>
        </Box>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            color: 'var(--bg-primary)',
            minWidth: 'auto',
            padding: '8px',
            borderRadius: 'var(--radius-md)',
            transition: 'var(--transition-all)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              transform: 'scale(1.1)'
            },
            '&:disabled': {
              opacity: 0.5
            }
          }}
        >
          ✕
        </Button>
      </DialogTitle>
      <DialogContent sx={{ 
        padding: '28px !important',
        backgroundColor: 'var(--bg-primary)',
        fontFamily: 'var(--font-family)'
      }}>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default ManagementFormDialog;

