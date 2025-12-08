import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const ConfirmDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  confirmColor = 'error',
  showWarningIcon = true,
  highlightText = null,
  children = null,
  confirmDisabled = false
}) => {
  const isDeleteAction = confirmColor === 'error' || title?.toLowerCase().includes('xóa');
  const IconComponent = isDeleteAction ? DeleteIcon : CheckCircleIcon;

  // Function to highlight text in description
  const renderHighlightedDescription = () => {
    if (!highlightText || !description) {
      return description;
    }

    // Try to find text in quotes first (most common pattern)
    const quotedMatch = description.match(/"([^"]+)"/);
    if (quotedMatch && quotedMatch[1]) {
      const highlightedName = quotedMatch[1];
      const beforeQuote = description.substring(0, description.indexOf('"'));
      const afterQuote = description.substring(description.indexOf('"') + `"${highlightedName}"`.length);
      
      return (
        <>
          {beforeQuote}
          <Box
            component="span"
            sx={{
              fontWeight: 'var(--font-weight-bold)',
              fontFamily: 'var(--font-family)',
              color: isDeleteAction ? 'var(--color-error-dark)' : 'var(--color-primary-dark)',
              backgroundColor: isDeleteAction ? 'var(--color-error-50)' : 'var(--color-primary-50)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              display: 'inline-block',
              margin: '0 2px'
            }}
          >
            "{highlightedName}"
          </Box>
          {afterQuote}
        </>
      );
    }

    // If no quoted text found, try to highlight the highlightText directly
    if (description.includes(highlightText)) {
      const index = description.indexOf(highlightText);
      const before = description.substring(0, index);
      const after = description.substring(index + highlightText.length);
      
      return (
        <>
          {before}
          <Box
            component="span"
            sx={{
              fontWeight: 'var(--font-weight-bold)',
              fontFamily: 'var(--font-family)',
              color: isDeleteAction ? 'var(--color-error-dark)' : 'var(--color-primary-dark)',
              backgroundColor: isDeleteAction ? 'var(--color-error-50)' : 'var(--color-primary-50)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              display: 'inline-block',
              margin: '0 2px'
            }}
          >
            {highlightText}
          </Box>
          {after}
        </>
      );
    }

    return description;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-2xl)',
          fontFamily: 'var(--font-family)'
        }
      }}
    >
      <Box
        sx={{
          position: 'relative',
          backgroundColor: isDeleteAction ? 'var(--color-error-50)' : 'var(--color-primary-50)',
          padding: '24px 24px 16px 24px'
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 2
          }}
        >
          {showWarningIcon && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: isDeleteAction 
                  ? 'linear-gradient(135deg, var(--color-error-light) 0%, var(--color-error) 100%)'
                  : 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%)',
                color: 'var(--bg-primary)',
                flexShrink: 0,
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <IconComponent sx={{ fontSize: 32 }} />
            </Box>
          )}
          <Typography
            id="dialog-title"
            variant="h6"
            sx={{
              fontWeight: 'var(--font-weight-semibold)',
              fontFamily: 'var(--font-family)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-2xl)',
              flex: 1
            }}
          >
            {title}
          </Typography>
        </Box>
      </Box>

      <DialogContent sx={{ 
        padding: '24px', 
        paddingTop: '16px',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <Typography
          id="dialog-description"
          variant="body1"
          component="div"
          sx={{
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-family)',
            lineHeight: 'var(--line-height-relaxed)',
            fontSize: 'var(--font-size-base)'
          }}
        >
          {renderHighlightedDescription()}
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          padding: '16px 24px',
          gap: 2,
          backgroundColor: 'var(--bg-tertiary)',
          borderTop: '1px solid var(--border-light)'
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            minWidth: 100,
            textTransform: 'none',
            fontFamily: 'var(--font-family)',
            borderRadius: 'var(--radius-lg)',
            padding: '10px 24px',
            fontWeight: 'var(--font-weight-semibold)',
            borderColor: 'var(--border-medium)',
            color: 'var(--text-primary)',
            transition: 'var(--transition-all)',
            '&:hover': {
              borderColor: 'var(--color-primary)',
              backgroundColor: 'var(--bg-tertiary)',
              transform: 'translateY(-2px)',
              boxShadow: 'var(--shadow-sm)'
            }
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={confirmColor}
          autoFocus
          sx={{
            minWidth: 100,
            textTransform: 'none',
            fontFamily: 'var(--font-family)',
            borderRadius: 'var(--radius-lg)',
            padding: '10px 24px',
            fontWeight: 'var(--font-weight-semibold)',
            background: isDeleteAction
              ? 'linear-gradient(135deg, var(--color-error) 0%, var(--color-error-dark) 100%)'
              : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
            color: 'var(--bg-primary)',
            boxShadow: isDeleteAction 
              ? 'var(--shadow-md), 0 2px 8px rgba(239, 68, 68, 0.3)' 
              : 'var(--shadow-md), 0 2px 8px rgba(37, 99, 235, 0.3)',
            transition: 'var(--transition-all)',
            '&:hover': {
              background: isDeleteAction
                ? 'linear-gradient(135deg, var(--color-error-dark) 0%, var(--color-error) 100%)'
                : 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
              transform: 'translateY(-2px)',
              boxShadow: isDeleteAction 
                ? 'var(--shadow-lg), 0 4px 12px rgba(239, 68, 68, 0.4)' 
                : 'var(--shadow-lg), 0 4px 12px rgba(37, 99, 235, 0.4)'
            }
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;

