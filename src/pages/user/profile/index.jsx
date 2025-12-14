import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Box, Button, Grid, IconButton, Typography, Avatar, Paper } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Phone as PhoneIcon, Person as PersonIcon } from '@mui/icons-material';
import { useApp } from '../../../contexts/AppContext';
import { useAuth } from '../../../contexts/AuthContext';
import useContentLoading from '../../../hooks/useContentLoading';
import ContentLoading from '../../../components/Common/ContentLoading';
import userService from '../../../services/user.service';
import familyProfileService from '../../../services/familyProfile.service';
import ManagementFormDialog from '../../../components/Management/FormDialog';
import ConfirmDialog from '../../../components/Common/ConfirmDialog';
import Form from '../../../components/Common/Form';
import ImageUpload from '../../../components/Common/ImageUpload';
import * as yup from 'yup';
import styles from './Profile.module.css';

// Helper function to mask email for privacy
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  
  const [localPart, domain] = email.split('@');
  
  // Show first 2 characters, mask the rest
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

const familyProfileSchema = yup.object().shape({
  Name: yup.string().required('Tên là bắt buộc'),
  Phone: yup.string().nullable(),
  StudentRela: yup.string().nullable()
});

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);

  // Family Profiles state
  const [profiles, setProfiles] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [deletingProfile, setDeletingProfile] = useState(null);
  const [familyAvatarFile, setFamilyAvatarFile] = useState(null);
  const [familyFormData, setFamilyFormData] = useState({
    Name: '',
    Phone: '',
    StudentRela: ''
  });
  const familyFormRef = React.useRef(null);

  const navigate = useNavigate();
  const { showGlobalError, addNotification } = useApp();
  const { isLoading, loadingText, showLoading, hideLoading } = useContentLoading();
  const { user, updateUser } = useAuth();


  useEffect(() => {
    loadUserData();
    loadProfiles();
  }, []);

  // Family Profiles functions
  const loadProfiles = useCallback(async () => {
    try {
      const data = await familyProfileService.getMyProfiles();
      setProfiles(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải danh sách thành viên';
      showGlobalError(errorMessage);
    }
  }, [showGlobalError]);

  const handleAddFamily = () => {
    setEditingProfile(null);
    setFamilyFormData({ Name: '', Phone: '', StudentRela: '' });
    setFamilyAvatarFile(null);
    setOpenDialog(true);
  };

  const handleEditFamily = (profile) => {
    setEditingProfile(profile);
    setFamilyFormData({
      Name: profile.name || '',
      Phone: profile.phone || '',
      StudentRela: profile.studentRela || ''
    });
    setFamilyAvatarFile(null);
    setOpenDialog(true);
  };

  const handleDeleteFamily = (profile) => {
    setDeletingProfile(profile);
    setOpenDeleteDialog(true);
  };

  const handleDeleteFamilyConfirm = async () => {
    if (!deletingProfile) return;

    try {
      showLoading();
      await familyProfileService.delete(deletingProfile.id);
      addNotification({
        message: 'Xóa thành viên thành công!',
        severity: 'success'
      });
      loadProfiles();
      setOpenDeleteDialog(false);
      setDeletingProfile(null);
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể xóa thành viên';
      showGlobalError(errorMessage);
      addNotification({
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      hideLoading();
    }
  };

  const handleFamilySubmit = async (data) => {
    try {
      showLoading();
      
      const formDataToSend = new FormData();
      
      if (editingProfile) {
        // For update: Id is required
        formDataToSend.append('Id', editingProfile.id);
      }
      
      // Name is required
      formDataToSend.append('Name', data.Name);
      
      // Phone is optional - append if provided (including empty string)
      if (data.Phone !== undefined && data.Phone !== null) {
        formDataToSend.append('Phone', data.Phone);
      }
      
      // StudentRela is optional - append if provided (including empty string)
      if (data.StudentRela !== undefined && data.StudentRela !== null) {
        formDataToSend.append('StudentRela', data.StudentRela);
      }
      
      // AvatarFile is optional - only append if provided as File
      if (familyAvatarFile instanceof File) {
        formDataToSend.append('AvatarFile', familyAvatarFile);
      }

      if (editingProfile) {
        await familyProfileService.update(editingProfile.id, formDataToSend);
        addNotification({
          message: 'Cập nhật thành viên thành công!',
          severity: 'success'
        });
      } else {
        await familyProfileService.create(formDataToSend);
        addNotification({
          message: 'Thêm thành viên thành công!',
          severity: 'success'
        });
      }

      loadProfiles();
      setOpenDialog(false);
      setEditingProfile(null);
      setFamilyFormData({ Name: '', Phone: '', StudentRela: '' });
      setFamilyAvatarFile(null);
    } catch (err) {
      const errorMessage = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Không thể lưu thành viên';
      showGlobalError(errorMessage);
      addNotification({
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      hideLoading();
    }
  };

  const getFamilyInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const familyFields = [
    {
      name: 'Name',
      label: 'Tên',
      type: 'text',
      required: true,
      placeholder: 'Nhập tên thành viên'
    },
    {
      name: 'Phone',
      label: 'Số điện thoại',
      type: 'tel',
      placeholder: 'Nhập số điện thoại'
    },
    {
      name: 'StudentRela',
      label: 'Mối quan hệ với trẻ em',
      type: 'text',
      placeholder: 'Ví dụ: Bố, Mẹ, Ông, Bà, ...'
    }
  ];

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
        email: userInfo.email,
        phoneNumber: userInfo.phoneNumber
      });
      setAvatarFile(null);
    } catch (err) {
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
      email: userData?.email || '',
      phoneNumber: userData?.phoneNumber || ''
    });
    setAvatarFile(null);
  };

  const handleSave = async () => {
    if (!userData || !user?.id) return;
    
    try {
      showLoading();
      
      // Create FormData for multipart/form-data
      const formData = new FormData();
      
      // Name is required
      if (editForm.fullName) {
        formData.append('Name', editForm.fullName);
      }
      
      // PhoneNumber is optional
      if (editForm.phoneNumber) {
        formData.append('PhoneNumber', editForm.phoneNumber);
      }
      
      // AvatarFile is optional - only append if user selected a new file
      if (avatarFile instanceof File) {
        formData.append('AvatarFile', avatarFile);
      }
      
      // Call API to update user profile using my-profile endpoint
      const updatedUser = await userService.updateMyProfile(formData);
      
      // Update local state with fresh data from API
      const freshUserData = await userService.getCurrentUser();
      const updatedUserInfo = {
        fullName: freshUserData.fullName || freshUserData.name || editForm.fullName,
        email: freshUserData.email || editForm.email,
        phoneNumber: freshUserData.phoneNumber || editForm.phoneNumber || '',
        profilePictureUrl: withCacheBuster(freshUserData.profilePictureUrl || ''),
        id: freshUserData.id || userData.id
      };
      
      setUserData(updatedUserInfo);
      setEditForm({
        fullName: updatedUserInfo.fullName,
        email: updatedUserInfo.email,
        phoneNumber: updatedUserInfo.phoneNumber
      });
      setAvatarFile(null);
      
      // Update AuthContext to sync with localStorage
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
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  if (isLoading && !userData) {
    return <ContentLoading isLoading={isLoading} text={loadingText} />;
  }

  if (error && !userData) {
    return (
      <motion.div 
        className={styles.profilePage}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.container}>
          <div className={styles.errorState}>
            <p className={styles.errorMessage}>{error}</p>
            <button className={styles.retryButton} onClick={loadUserData}>
              Thử lại
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={styles.profilePage}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Thông tin tài khoản</h1>
          <p className={styles.subtitle}>Quản lý thông tin cá nhân của bạn</p>
        </div>

        <div className={styles.cardsContainer}>
        <div className={styles.profileCard}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatar}>
              {userData?.profilePictureUrl ? (
                <img 
                  src={userData.profilePictureUrl} 
                  alt={userData?.fullName || 'Avatar'} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : (
                getInitials(userData?.fullName)
              )}
            </div>
            <div className={styles.userInfo}>
              <h2 className={styles.userName}>{userData?.fullName || 'Người dùng'}</h2>
              <p className={styles.userRole}>Tài khoản người dùng</p>
            </div>
            {!isEditing && (
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <button className={styles.editButton} onClick={handleEdit}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.3333 2.00001C11.5084 1.82491 11.7163 1.68698 11.9444 1.59431C12.1726 1.50165 12.4163 1.45605 12.6622 1.46024C12.9081 1.46444 13.1504 1.51835 13.3747 1.61874C13.599 1.71913 13.8006 1.86395 13.968 2.04468C14.1354 2.22541 14.2651 2.43835 14.3501 2.67091C14.4351 2.90347 14.4737 3.15094 14.4636 3.39868C14.4535 3.64642 14.3948 3.88945 14.2908 4.11379C14.1868 4.33813 14.0396 4.53927 13.8573 4.70601L13.3333 5.23001L10.8093 2.70601L11.3333 2.00001ZM9.80933 3.52401L2.66667 10.6667V13.3333H5.33333L12.476 6.19068L9.80933 3.52401Z" fill="currentColor"/>
                  </svg>
                  Chỉnh sửa
                </button>
              </Box>
            )}
          </div>

          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Họ và tên</label>
              {isEditing ? (
                <input
                  type="text"
                  className={styles.input}
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  placeholder="Nhập họ và tên"
                />
              ) : (
                <div className={styles.fieldValue}>{userData?.fullName || 'Chưa có thông tin'}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <div className={styles.fieldValue}>{userData?.email ? maskEmail(userData.email) : 'Chưa có email'}</div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Số điện thoại</label>
              {isEditing ? (
                <input
                  type="tel"
                  className={styles.input}
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                  placeholder="Nhập số điện thoại"
                />
              ) : (
                <div className={styles.fieldValue}>{userData?.phoneNumber || 'Chưa có số điện thoại'}</div>
              )}
            </div>

            {isEditing && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Ảnh đại diện</label>
                <ImageUpload
                  value={avatarFile || (userData?.profilePictureUrl || null)}
                  onChange={(file) => setAvatarFile(file)}
                  label="Chọn ảnh đại diện mới (tùy chọn)"
                  helperText="Chọn file ảnh để tải lên (JPG, PNG, etc.) - Tối đa 10MB"
                  accept="image/*"
                  maxSize={10 * 1024 * 1024}
                  disabled={isLoading}
                />
              </div>
            )}

            {isEditing && (
              <div className={styles.actionButtons}>
                <button className={styles.cancelButton} onClick={handleCancel}>
                  Hủy
                </button>
                <button className={styles.saveButton} onClick={handleSave}>
                  Lưu thay đổi
                </button>
              </div>
            )}
          </div>
        </div>

          {/* Family Profiles Section */}
          <div className={styles.familySection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Thành viên gia đình</h2>
              <p className={styles.sectionSubtitle}>Quản lý thông tin các thành viên liên quan đến trẻ em</p>
            </div>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddFamily}
              className={styles.addButton}
              sx={{
                background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-dark) 100%)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                px: 3,
                py: 1.5,
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, var(--color-secondary-dark) 0%, var(--color-secondary) 100%)',
                  color: 'var(--text-inverse)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(255, 107, 107, 0.4)'
                }
              }}
            >
              Thêm thành viên
            </Button>
          </div>

          {isLoading && profiles.length === 0 ? (
            <ContentLoading isLoading={isLoading} />
          ) : profiles.length === 0 ? (
            <div className={styles.emptyState}>
              <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}>
                Chưa có thành viên nào
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Nhấn "Thêm thành viên" để bắt đầu quản lý thông tin các thành viên trong gia đình
              </Typography>
            </div>
          ) : (
            <Grid container spacing={3}>
              {profiles.map((profile, index) => (
                <Grid item xs={12} sm={6} md={4} key={profile.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 0,
                        borderRadius: 'var(--radius-xl)',
                        minHeight: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        background: 'white',
                        position: 'relative',
                        overflow: 'visible',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          background: 'linear-gradient(90deg, var(--color-secondary) 0%, var(--color-primary) 100%)',
                          transform: 'scaleX(0)',
                          transformOrigin: 'left',
                          transition: 'transform 0.4s ease',
                          zIndex: 1
                        },
                        '&:hover': {
                          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                          transform: 'translateY(-8px)',
                          borderColor: 'rgba(0, 123, 255, 0.3)',
                          '&::before': {
                            transform: 'scaleX(1)'
                          }
                        }
                      }}
                    >
                      {/* Header with Avatar */}
                      <Box sx={{ 
                        p: 3, 
                        background: 'linear-gradient(135deg, rgba(0, 123, 255, 0.05) 0%, rgba(255, 107, 107, 0.05) 100%)',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
                          <Avatar
                            src={profile.avatar}
                            sx={{
                              width: 80,
                              height: 80,
                              bgcolor: 'var(--color-primary)',
                              fontSize: '2rem',
                              fontWeight: 'bold',
                              boxShadow: '0 6px 20px rgba(0, 123, 255, 0.3)',
                              border: '4px solid white',
                              transition: 'all 0.3s ease',
                              flexShrink: 0,
                              '&:hover': {
                                transform: 'scale(1.05)',
                                boxShadow: '0 8px 25px rgba(0, 123, 255, 0.4)'
                              }
                            }}
                          >
                            {!profile.avatar && getFamilyInitials(profile.name)}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontSize: '1.125rem', 
                                fontWeight: 700, 
                                mb: 1,
                                color: 'text.primary',
                                wordBreak: 'break-word',
                                lineHeight: 1.4
                              }}
                            >
                              {profile.name || 'Chưa có tên'}
                            </Typography>
                            {profile.studentRela && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                <PersonIcon sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: 'text.secondary',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    wordBreak: 'break-word',
                                    lineHeight: 1.4
                                  }}
                                >
                                  {profile.studentRela}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>

                      {/* Content */}
                      <Box sx={{ 
                        p: 3, 
                        pt: 2.5, 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column',
                        minHeight: 0
                      }}>
                        {profile.phone && (
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1.5,
                            mb: 2.5,
                            p: 1.5,
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(0, 0, 0, 0.02)',
                            transition: 'all 0.2s ease',
                            flexWrap: 'wrap',
                            '&:hover': {
                              background: 'rgba(0, 123, 255, 0.05)'
                            }
                          }}>
                            <PhoneIcon sx={{ fontSize: 18, color: 'var(--color-primary)', flexShrink: 0 }} />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'text.primary',
                                fontWeight: 500,
                                fontSize: '0.9375rem',
                                wordBreak: 'break-word'
                              }}
                            >
                              {profile.phone}
                            </Typography>
                          </Box>
                        )}

                        {profile.students && profile.students.length > 0 && (
                          <Box sx={{ 
                            mb: 2.5,
                            pt: 2,
                            borderTop: '1px solid rgba(0, 0, 0, 0.05)'
                          }}>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'text.secondary',
                                fontSize: '0.8125rem',
                                display: 'block',
                                mb: 0.75,
                                fontWeight: 600
                              }}
                            >
                              Liên quan đến:
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'text.primary',
                                fontSize: '0.875rem',
                                wordBreak: 'break-word',
                                lineHeight: 1.5
                              }}
                            >
                              {profile.students.map(s => s.name).join(', ')}
                            </Typography>
                          </Box>
                        )}

                        {/* Action Buttons */}
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 1, 
                          mt: 'auto',
                          pt: 2.5,
                          borderTop: '1px solid rgba(0, 0, 0, 0.05)'
                        }}>
                          <Button
                            variant="outlined"
                            size="medium"
                            startIcon={<EditIcon />}
                            onClick={() => handleEditFamily(profile)}
                            sx={{
                              flex: 1,
                              color: 'var(--color-primary)',
                              borderColor: 'rgba(0, 123, 255, 0.2)',
                              borderRadius: 'var(--radius-md)',
                              textTransform: 'none',
                              fontWeight: 600,
                              py: 1.25,
                              transition: 'all 0.2s ease',
                              '&:hover': { 
                                bgcolor: 'var(--color-primary)', 
                                color: 'white',
                                borderColor: 'var(--color-primary)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)'
                              }
                            }}
                          >
                            Sửa
                          </Button>
                          <Button
                            variant="outlined"
                            size="medium"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteFamily(profile)}
                            sx={{
                              flex: 1,
                              color: 'error.main',
                              borderColor: 'rgba(211, 47, 47, 0.2)',
                              borderRadius: 'var(--radius-md)',
                              textTransform: 'none',
                              fontWeight: 600,
                              py: 1.25,
                              transition: 'all 0.2s ease',
                              '&:hover': { 
                                bgcolor: 'error.main', 
                                color: 'white',
                                borderColor: 'error.main',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)'
                              }
                            }}
                          >
                            Xóa
                          </Button>
                        </Box>
                      </Box>
                    </Paper>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}
          </div>
        </div>

        {/* Add/Edit Family Profile Dialog */}
        <ManagementFormDialog
          open={openDialog}
          onClose={() => {
            setOpenDialog(false);
            setEditingProfile(null);
            setFamilyFormData({ Name: '', Phone: '', StudentRela: '' });
            setFamilyAvatarFile(null);
          }}
          mode={editingProfile ? 'update' : 'create'}
          title="Thành viên gia đình"
          icon={AddIcon}
          loading={isLoading}
          maxWidth="md"
        >
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 3,
              '& .MuiFormControl-root': {
                mb: 0
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 2.5,
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                padding: 3,
                borderRadius: 2,
                border: '1px solid rgba(0, 0, 0, 0.05)'
              }}>
                <Form
                  ref={familyFormRef}
                  schema={familyProfileSchema}
                  defaultValues={familyFormData}
                  onSubmit={handleFamilySubmit}
                  submitText={editingProfile ? 'Cập nhật' : 'Thêm mới'}
                  loading={isLoading}
                  disabled={isLoading}
                  fields={familyFields}
                  hideSubmitButton
                />
              </Box>
              
              <Box sx={{ 
                mt: 1,
                '& .MuiPaper-root': {
                  border: '2px dashed rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'var(--color-primary)',
                    backgroundColor: 'rgba(0, 123, 255, 0.02)'
                  }
                }
              }}>
                <ImageUpload
                  value={familyAvatarFile || (editingProfile?.avatar || null)}
                  onChange={(file) => setFamilyAvatarFile(file)}
                  label="Ảnh đại diện (tùy chọn)"
                  helperText="Chọn file ảnh để tải lên (JPG, PNG, etc.) - Tối đa 10MB"
                  accept="image/*"
                  maxSize={10 * 1024 * 1024}
                  disabled={isLoading}
                />
              </Box>

              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'flex-end',
                pt: 2,
                borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                mt: 2
              }}>
                <Button
                  onClick={() => {
                    setOpenDialog(false);
                    setEditingProfile(null);
                    setFamilyFormData({ Name: '', Phone: '', StudentRela: '' });
                    setFamilyAvatarFile(null);
                  }}
                  disabled={isLoading}
                  variant="outlined"
                  sx={{
                    minWidth: 120,
                    borderColor: 'rgba(0, 0, 0, 0.2)',
                    color: 'text.secondary',
                    '&:hover': {
                      borderColor: 'rgba(0, 0, 0, 0.3)',
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  Hủy
                </Button>
                <Button
                  onClick={() => {
                    if (familyFormRef.current?.submit) {
                      familyFormRef.current.submit();
                    }
                  }}
                  disabled={isLoading}
                  variant="contained"
                  sx={{
                    minWidth: 120,
                    background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-dark) 100%)',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-sm)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, var(--color-secondary-dark) 0%, var(--color-secondary) 100%)',
                      boxShadow: 'var(--shadow-md)',
                      transform: 'translateY(-2px)'
                    },
                    '&:disabled': {
                      opacity: 0.6
                    }
                  }}
                >
                  {isLoading ? 'Đang xử lý...' : (editingProfile ? 'Cập nhật' : 'Thêm mới')}
                </Button>
              </Box>
            </Box>
        </ManagementFormDialog>

        {/* Delete Family Profile Confirmation Dialog */}
        <ConfirmDialog
          open={openDeleteDialog}
          onClose={() => {
            setOpenDeleteDialog(false);
            setDeletingProfile(null);
          }}
          onConfirm={handleDeleteFamilyConfirm}
          title="Xóa thành viên"
          description={`Bạn có chắc chắn muốn xóa thành viên "${deletingProfile?.name}"?`}
          confirmText="Xóa"
          cancelText="Hủy"
          confirmColor="error"
          loading={isLoading}
        />

      </div>
    </motion.div>
  );
};

export default UserProfile;
