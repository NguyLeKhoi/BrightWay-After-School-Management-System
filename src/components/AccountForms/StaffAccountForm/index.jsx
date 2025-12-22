import React, { useState } from 'react';
import {
  Box,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Paper,
  Alert,
  Chip,
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  AssignmentInd as RoleIcon
} from '@mui/icons-material';
import Form from '../../Common/Form';
import { createStaffSchema } from '../../../utils/validationSchemas/userSchemas';

const StaffAccountForm = ({ 
  isSubmitting, 
  onStaffSubmit,
  setIsSubmitting,
  onSuccess
}) => {
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    userData: null
  });

  const handleFormSubmit = (data) => {
    setConfirmDialog({
      open: true,
      userData: data
    });
  };

  const handleConfirmCreate = async () => {
    setConfirmDialog(prev => ({ ...prev, open: false }));
    if (setIsSubmitting) {
      setIsSubmitting(true);
    }
    try {
      await onStaffSubmit(confirmDialog.userData);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      // Error handling is done in parent component

    } finally {
      if (setIsSubmitting) {
        setIsSubmitting(false);
      }
    }
  };

  const handleCancelCreate = () => {
    setConfirmDialog({
      open: false,
      userData: null
    });
  };

  return (
    <Box>
      <Form
        schema={createStaffSchema}
        onSubmit={handleFormSubmit}
        submitText="Tạo Nhân viên"
        loading={isSubmitting}
        defaultValues={{}}
        fields={[
          { 
            section: 'Thông tin cá nhân',
            sectionDescription: 'Thông tin hiển thị của nhân viên.',
            name: 'name', 
            label: 'Họ và Tên', 
            type: 'text', 
            required: true, 
            placeholder: 'Ví dụ: Nguyễn Văn A',
            disabled: isSubmitting,
            gridSize: 6
          },
          { 
            name: 'phoneNumber', 
            label: 'Số Điện Thoại', 
            type: 'text', 
            required: false, 
            placeholder: 'Ví dụ: 0123456789',
            disabled: isSubmitting,
            gridSize: 6
          },
          { 
            name: 'gender', 
            label: 'Giới Tính', 
            type: 'select', 
            required: false,
            options: [
              { value: 'Male', label: 'Nam' },
              { value: 'Female', label: 'Nữ' },
              { value: 'Other', label: 'Khác' }
            ],
            disabled: isSubmitting,
            gridSize: 12
          },
          { 
            section: 'Thông tin đăng nhập',
            sectionDescription: 'Email sẽ được dùng để đăng nhập. Mật khẩu sẽ được gửi qua email xác nhận.',
            name: 'email', 
            label: 'Email', 
            type: 'email', 
            required: true, 
            placeholder: 'Ví dụ: email@example.com',
            disabled: isSubmitting,
            gridSize: 12
          }
        ]}
      />

      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmDialog.open} 
        onClose={handleCancelCreate} 
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: '8px',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            padding: '16px 24px'
          }}
        >
          <PersonIcon sx={{ color: 'white' }} />
          <Typography variant="h6" component="span" sx={{ color: 'white' }}>
            Xác nhận Tạo Tài Khoản Nhân viên
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Vui lòng kiểm tra lại thông tin trước khi tạo tài khoản:</strong>
            </Typography>
          </Alert>
          
          {confirmDialog.userData && (
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Thông tin tài khoản Nhân viên
              </Typography>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Họ và Tên:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {confirmDialog.userData.name || confirmDialog.userData.fullName}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {confirmDialog.userData.email}
                  </Typography>
                </Box>
                
                {confirmDialog.userData.phoneNumber && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Số Điện Thoại:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {confirmDialog.userData.phoneNumber}
                    </Typography>
                  </Box>
                )}
                
                {confirmDialog.userData.gender && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Giới Tính:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {confirmDialog.userData.gender === 'Male' ? 'Nam' : confirmDialog.userData.gender === 'Female' ? 'Nữ' : 'Khác'}
                    </Typography>
                  </Box>
                )}
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Vai Trò:
                  </Typography>
                  <Chip 
                    label="Nhân viên"
                    color="info" 
                    size="small"
                    variant="outlined"
                    icon={<RoleIcon fontSize="small" />}
                  />
                </Box>
              </div>
            </Paper>
          )}
          
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCancelCreate}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleConfirmCreate}
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            startIcon={isSubmitting ? null : <PersonIcon />}
          >
            {isSubmitting ? 'Đang tạo...' : 'Xác nhận tạo tài khoản'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffAccountForm;

