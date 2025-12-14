import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Avatar,
  TextField,
  Alert
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import useContentLoading from '../../../hooks/useContentLoading';
import ContentLoading from '../../../components/Common/ContentLoading';
import PageWrapper from '../../../components/Common/PageWrapper';
import ManagementPageHeader from '../../../components/Management/PageHeader';
import ImageUpload from '../../../components/Common/ImageUpload';
import userService from '../../../services/user.service';

// Helper function to mask email for privacy
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  
  const [localPart, domain] = email.split('@');
  
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  
  const visiblePart = localPart.substring(0, 2);
  return `${visiblePart}***@${domain}`;
};

const withCacheBuster = (url) => {
  if (!url) return '';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}cb=${Date.now()}`;
};

const StaffProfile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { showGlobalError, addNotification } = useApp();
  const { isLoading, loadingText, showLoading, hideLoading } = useContentLoading();
  
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phoneNumber: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);


  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    showLoading();
    setError(null);
    
    try {
      const currentUser = await userService.getCurrentUser();
      
      const userInfo = {
        fullName: currentUser.fullName || currentUser.name || '',
        email: currentUser.email || '',
        phoneNumber: currentUser.phoneNumber || '',
        profilePictureUrl: withCacheBuster(currentUser.profilePictureUrl || ''),
        id: currentUser.id || ''
      };
      
      setUserData(userInfo);
      setEditForm({
        fullName: userInfo.fullName,
        phoneNumber: userInfo.phoneNumber || ''
      });
      setAvatarFile(null);
    } catch (err) {
      console.error('Error loading user data:', err);
      const errorMessage = err.message || 'Có lỗi xảy ra khi tải thông tin tài khoản';
      setError(errorMessage);
      showGlobalError(errorMessage);
    } finally {
      hideLoading();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      fullName: userData?.fullName || '',
      phoneNumber: userData?.phoneNumber || ''
    });
    setAvatarFile(null);
  };

  const handleSave = async () => {
    if (!userData || !user?.id) return;
    
    try {
      showLoading();
      
      const formData = new FormData();
      
      if (editForm.fullName) {
        formData.append('Name', editForm.fullName);
      }
      
      if (editForm.phoneNumber) {
        formData.append('PhoneNumber', editForm.phoneNumber);
      }
      
      if (avatarFile instanceof File) {
        formData.append('AvatarFile', avatarFile);
      }
      
      await userService.updateMyProfile(formData);
      
      const freshUserData = await userService.getCurrentUser();
      const updatedUserInfo = {
        fullName: freshUserData.fullName || freshUserData.name || editForm.fullName,
        email: freshUserData.email || userData.email,
        phoneNumber: freshUserData.phoneNumber || editForm.phoneNumber || '',
        profilePictureUrl: withCacheBuster(freshUserData.profilePictureUrl || ''),
        id: freshUserData.id || userData.id
      };
      
      setUserData(updatedUserInfo);
      setEditForm({
        fullName: updatedUserInfo.fullName,
        phoneNumber: updatedUserInfo.phoneNumber
      });
      setAvatarFile(null);
      
      updateUser({
        name: updatedUserInfo.fullName,
        fullName: updatedUserInfo.fullName,
        email: updatedUserInfo.email,
        phoneNumber: updatedUserInfo.phoneNumber,
        profilePictureUrl: updatedUserInfo.profilePictureUrl
      });
      
      setIsEditing(false);
      
      addNotification({
        message: 'Cập nhật thông tin thành công!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Update error:', err);
      const errorMessage = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi cập nhật thông tin';
      showGlobalError(errorMessage);
      addNotification({
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      hideLoading();
    }
  };

  const getInitials = (name) => {
    if (!name) return 'S';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  if (isLoading && !userData) {
    return <ContentLoading isLoading={isLoading} text={loadingText} />;
  }

  return (
    <PageWrapper>
      <Box
        sx={{
          padding: { xs: 2, sm: 3, md: 4 },
          maxWidth: '1200px',
          margin: '0 auto',
          minHeight: '100vh',
          background: 'var(--bg-secondary)'
        }}
      >
        {/* Header */}
        <ManagementPageHeader
          title="Thông tin tài khoản"
        >
          {!isEditing && (
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                sx={{
                  textTransform: 'none',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: 600,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2
                  }
                }}
              >
                Chỉnh sửa
              </Button>
            </Box>
          )}
        </ManagementPageHeader>

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 'var(--radius-lg)'
            }}
          >
            {error}
          </Alert>
        )}

        {/* Profile Card */}
        <Paper
          sx={{
            p: 4,
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-light)'
          }}
        >
          {/* Avatar Section */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 3,
              mb: 4,
              pb: 4,
              borderBottom: '1px solid var(--border-light)'
            }}
          >
            <Avatar
              src={userData?.profilePictureUrl}
              sx={{
                width: 120,
                height: 120,
                bgcolor: 'primary.main',
                fontSize: '3rem',
                fontWeight: 'bold',
                boxShadow: 'var(--shadow-md)',
                border: '4px solid white'
              }}
            >
              {!userData?.profilePictureUrl && getInitials(userData?.fullName)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  fontFamily: 'var(--font-family-heading)',
                  mb: 1
                }}
              >
                {userData?.fullName || 'Nhân viên'}
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{
                  fontFamily: 'var(--font-family-primary)',
                  mb: 2
                }}
              >
                Tài khoản Nhân viên
              </Typography>
            </Box>
          </Box>

          {/* Form Section */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  mb: 1,
                  fontWeight: 600,
                  fontFamily: 'var(--font-family-primary)'
                }}
              >
                Họ và tên
              </Typography>
              {isEditing ? (
                <TextField
                  fullWidth
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  placeholder="Nhập họ và tên"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 'var(--radius-lg)'
                    }
                  }}
                />
              ) : (
                <Typography 
                  variant="body1"
                  sx={{
                    fontFamily: 'var(--font-family-primary)',
                    p: 1.5,
                    backgroundColor: 'action.hover',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  {userData?.fullName || 'Chưa có thông tin'}
                </Typography>
              )}
            </Box>

            <Box>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  mb: 1,
                  fontWeight: 600,
                  fontFamily: 'var(--font-family-primary)'
                }}
              >
                Email
              </Typography>
              <Typography 
                variant="body1"
                sx={{
                  fontFamily: 'var(--font-family-primary)',
                  p: 1.5,
                  backgroundColor: 'action.hover',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                {userData?.email ? maskEmail(userData.email) : 'Chưa có email'}
              </Typography>
            </Box>

            <Box>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  mb: 1,
                  fontWeight: 600,
                  fontFamily: 'var(--font-family-primary)'
                }}
              >
                Số điện thoại
              </Typography>
              {isEditing ? (
                <TextField
                  fullWidth
                  type="tel"
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                  placeholder="Nhập số điện thoại"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 'var(--radius-lg)'
                    }
                  }}
                />
              ) : (
                <Typography 
                  variant="body1"
                  sx={{
                    fontFamily: 'var(--font-family-primary)',
                    p: 1.5,
                    backgroundColor: 'action.hover',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  {userData?.phoneNumber || 'Chưa có số điện thoại'}
                </Typography>
              )}
            </Box>

            {isEditing && (
              <Box>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    mb: 1,
                    fontWeight: 600,
                    fontFamily: 'var(--font-family-primary)'
                  }}
                >
                  Ảnh đại diện
                </Typography>
                <ImageUpload
                  value={avatarFile || (userData?.profilePictureUrl || null)}
                  onChange={(file) => setAvatarFile(file)}
                  label="Chọn ảnh đại diện mới (tùy chọn)"
                  helperText="Chọn file ảnh để tải lên (JPG, PNG, etc.) - Tối đa 10MB"
                  accept="image/*"
                  maxSize={10 * 1024 * 1024}
                  disabled={isLoading}
                />
              </Box>
            )}

            {isEditing && (
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={isLoading}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 'var(--radius-lg)',
                    fontWeight: 600,
                    minWidth: 120
                  }}
                >
                  Hủy
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={isLoading || !editForm.fullName}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 'var(--radius-lg)',
                    fontWeight: 600,
                    minWidth: 120,
                    background: 'var(--color-secondary)',
                    '&:hover': {
                      background: 'var(--color-secondary-dark)'
                    }
                  }}
                >
                  {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </PageWrapper>
  );
};

export default StaffProfile;

