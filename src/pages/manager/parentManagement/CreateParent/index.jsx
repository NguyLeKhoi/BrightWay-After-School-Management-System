import React, { useCallback, useMemo, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Divider,
  Grid,
  Paper
} from '@mui/material';
import { 
  FamilyRestroom as FamilyIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { getErrorMessage } from '../../../../utils/errorHandler';
import StepperForm from '../../../../components/Common/StepperForm';
import Step1OCR from './Step1OCR';
import Step1BasicInfo from './Step1BasicInfo';
import Step2CCCDInfo from './Step2CCCDInfo';
import userService from '../../../../services/user.service';
import imageService from '../../../../services/image.service';

const CreateParent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'manual'; // 'ocr' or 'manual'

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    avatarFile: null,
    identityCardNumber: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    issuedDate: '',
    issuedPlace: '',
    identityCardPublicId: ''
  });
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  const formDataRef = useRef(formData);


  React.useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const handleStep1Complete = useCallback(
    async (data) => {
      if (mode === 'ocr') {
        // For OCR mode, just need to have extracted data
        if (!data.identityCardPublicId && !data.name) {
          toast.error('Vui lòng trích xuất thông tin từ ảnh CCCD');
          return false;
        }
      } else {
        // For manual mode, need email and name only (password auto-generated)
        if (!data.email || !data.name) {
          toast.error('Vui lòng nhập đầy đủ thông tin cơ bản (Họ tên và Email)');
          return false;
        }
      }
      setFormData((prev) => ({ ...prev, ...data }));
      return true;
    },
    [mode]
  );

  const handleStep2Complete = useCallback(
    async (data) => {
      setFormData((prev) => ({ ...prev, ...data }));
      return true;
    },
    []
  );

  const handleComplete = useCallback(
    async (latestData) => {
      const finalData = latestData || formDataRef.current;


      // Validate required fields based on mode
      if (mode === 'ocr') {
        if (!finalData.name || !finalData.email) {
          toast.error('Vui lòng hoàn thành đầy đủ thông tin bắt buộc (Họ tên và Email)');
          return;
        }
      } else {
        // Manual mode only requires name and email (password auto-generated)

        if (!finalData.name || !finalData.email) {
          toast.error('Vui lòng hoàn thành đầy đủ thông tin bắt buộc (Họ tên và Email)');
          return;
        }
      }

      // Show confirm dialog
      setConfirmData(finalData);
      setShowConfirmDialog(true);
    },
    [mode]
  );

  const handleConfirm = useCallback(async () => {
    if (!confirmData) return;

    setShowConfirmDialog(false);
    setLoading(true);

    try {

      // Generate password for both OCR and manual modes
      let finalData = { ...confirmData };
      if (!finalData.password) {
        // Generate a random password
        finalData.password = Math.random().toString(36).slice(-12) + 'Aa1!';
      }
      // Helper function to convert dd/mm/yyyy or YYYY-MM-DD to ISO string for API
      const formatDateForAPI = (dateString) => {
        if (!dateString) return null;
        
        let date;
        // If in dd/mm/yyyy format
        if (typeof dateString === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
          const [day, month, year] = dateString.split('/');
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        // If in YYYY-MM-DD format
        else if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          date = new Date(dateString + 'T00:00:00');
        }
        // If already ISO string, return as is
        else if (typeof dateString === 'string' && dateString.includes('T')) {
          return dateString;
        }
        // Try to parse as Date
        else {
          try {
            date = new Date(dateString);
          } catch {
            return null;
          }
        }
        
        if (!date || isNaN(date.getTime())) return null;
        return date.toISOString();
      };

      // Handle avatar upload first if present
      let avatarUrl = null;
      if (finalData.avatarFile && finalData.avatarFile instanceof File) {
        try {
          avatarUrl = await imageService.uploadImage(finalData.avatarFile);
        } catch (uploadError) {
          // Continue without avatar, don't fail the whole process
          toast.warning('Không thể tải lên ảnh đại diện. Tiếp tục tạo tài khoản...', {
            autoClose: 3000
          });
        }
      }

      // Use CCCD endpoint for both OCR and manual mode if has CCCD data
      if (confirmData.identityCardNumber || confirmData.identityCardPublicId || mode === 'ocr') {

        // Create FormData for multipart/form-data
        const formData = new FormData();
        formData.append('Email', finalData.email);
        formData.append('Password', finalData.password);
        formData.append('Name', finalData.name);
        if (finalData.phoneNumber) {
          formData.append('PhoneNumber', finalData.phoneNumber);
        }

        // CCCD fields (optional but recommended)
        if (finalData.identityCardNumber) {
          formData.append('IdentityCardNumber', finalData.identityCardNumber);
        }
        if (finalData.dateOfBirth) {
          const dob = formatDateForAPI(finalData.dateOfBirth);
          if (dob) formData.append('DateOfBirth', dob);
        }
        if (finalData.gender) {
          formData.append('Gender', finalData.gender);
        }
        if (finalData.address) {
          formData.append('Address', finalData.address);
        }
        if (finalData.issuedDate) {
          const issued = formatDateForAPI(finalData.issuedDate);
          if (issued) formData.append('IssuedDate', issued);
        }
        if (finalData.issuedPlace) {
          formData.append('IssuedPlace', finalData.issuedPlace);
        }
        if (finalData.identityCardPublicId) {
          formData.append('IdentityCardPublicId', finalData.identityCardPublicId);
        }

        // Use uploaded avatar URL if available, otherwise don't send avatar
        if (avatarUrl) {
          // If we have URL, send it as AvatarUrl or ProfilePictureUrl
          formData.append('ProfilePictureUrl', avatarUrl);
        }
        // Don't send AvatarFile anymore since we uploaded separately

        try {
          await userService.createParentWithCCCD(formData);
        } catch (apiError) {
          // Handle authentication errors specifically for parent creation
          if (apiError.response?.status === 401) {
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại và thử tạo tài khoản.');
          }
          // Re-throw other errors
          throw apiError;
        }
      } else {
        // Otherwise use regular endpoint - create FormData for multipart/form-data
        const formData = new FormData();
        formData.append('Email', confirmData.email);
        formData.append('Password', confirmData.password);
        formData.append('Name', confirmData.name);
        if (confirmData.phoneNumber) {
          formData.append('PhoneNumber', confirmData.phoneNumber);
        }
        // BranchId will be set automatically by backend from manager's branch

        // Use uploaded avatar URL if available
        if (avatarUrl) {
          formData.append('ProfilePictureUrl', avatarUrl);
        }
        // Don't send AvatarFile anymore

        try {
          await userService.createParent(formData);
        } catch (apiError) {
          // Handle authentication errors specifically for parent creation
          if (apiError.response?.status === 401) {
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại và thử tạo tài khoản.');
          }
          // Re-throw other errors
          throw apiError;
        }
      }


      toast.success(`Tạo tài khoản Người dùng (Phụ huynh) "${confirmData.name}" thành công!`);

      // Force navigation để đảm bảo hoạt động
      setTimeout(() => {
        window.location.href = '/manager/parents';
      }, 1500); // Give time for toast to show
    } catch (err) {

      // Handle authentication errors specially
      if (err.message?.includes('Phiên đăng nhập đã hết hạn')) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại và thử tạo tài khoản.', {
          autoClose: 5000,
          style: { whiteSpace: 'pre-line' }
        });
        // Optionally redirect to login after a delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
        return;
      }

      const errorMessage = getErrorMessage(err) || 'Có lỗi xảy ra khi tạo tài khoản Người dùng (Phụ huynh)';
      toast.error(errorMessage, {
        autoClose: 5000,
        style: { whiteSpace: 'pre-line' }
      });
    } finally {
      setLoading(false);
    }
  }, [confirmData, navigate]);

  const handleCancel = useCallback(() => {
    window.location.href = '/manager/parents';
  }, []);

  const steps = useMemo(
    () => {
      if (mode === 'ocr') {
        return [
          {
            label: 'Chụp ảnh CCCD',
            component: Step1OCR,
            validation: handleStep1Complete
          },
          {
            label: 'Thông tin CCCD & Tài khoản',
            component: Step2CCCDInfo,
            validation: handleStep2Complete
          }
        ];
      } else {
        return [
          {
            label: 'Thông tin cơ bản',
            component: Step1BasicInfo,
            validation: handleStep1Complete
          },
          {
            label: 'Thông tin CCCD',
            component: Step2CCCDInfo,
            validation: handleStep2Complete
          }
        ];
      }
    },
    [mode, handleStep1Complete, handleStep2Complete]
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có';
    try {
      // If in dd/mm/yyyy format, return as is
      if (typeof dateString === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        return dateString;
      }
      // If in YYYY-MM-DD format, convert to dd/mm/yyyy
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      // Otherwise try to parse as Date
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  };

  const InfoItem = ({ icon, label, value }) => (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: 'primary.50',
            color: 'primary.main',
            flexShrink: 0
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block', mb: 0.5 }}>
            {label}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500 }}>
            {value || 'Chưa có'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}>
      <StepperForm
        steps={steps}
        onComplete={handleComplete}
        onCancel={handleCancel}
        title={mode === 'ocr' ? 'Tạo tài khoản Phụ huynh (OCR)' : 'Tạo tài khoản Phụ huynh'}
        icon={<FamilyIcon />}
        initialData={formData}
        stepProps={{
          mode
        }}
      />

      <Dialog
        open={showConfirmDialog}
        onClose={() => !loading && setShowConfirmDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-2xl)'
          }
        }}
      >
        <Box
          sx={{
            position: 'relative',
            backgroundColor: 'primary.50',
            padding: '24px 24px 20px 24px'
          }}
        >
          <IconButton
            onClick={() => !loading && setShowConfirmDialog(false)}
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
            disabled={loading}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%)',
                color: 'white',
                flexShrink: 0,
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                flex: 1
              }}
            >
              Xác nhận tạo tài khoản Phụ huynh
            </Typography>
          </Box>
        </Box>

        <DialogContent sx={{ padding: '24px', backgroundColor: 'var(--bg-primary)' }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              backgroundColor: 'grey.50',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.200'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
              Thông tin tài khoản
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <InfoItem
                  icon={<PersonIcon sx={{ fontSize: 20 }} />}
                  label="Họ và tên"
                  value={confirmData?.name}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoItem
                  icon={<EmailIcon sx={{ fontSize: 20 }} />}
                  label="Email"
                  value={confirmData?.email}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoItem
                  icon={<PhoneIcon sx={{ fontSize: 20 }} />}
                  label="Số điện thoại"
                  value={confirmData?.phoneNumber}
                />
              </Grid>
            </Grid>

            {(confirmData?.identityCardNumber || confirmData?.dateOfBirth || confirmData?.gender || 
              confirmData?.address || confirmData?.issuedDate || confirmData?.issuedPlace) && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                  Thông tin CCCD
                </Typography>
                
                <Grid container spacing={2}>
                  {confirmData?.identityCardNumber && (
                    <Grid item xs={12} md={6}>
                      <InfoItem
                        icon={<BadgeIcon sx={{ fontSize: 20 }} />}
                        label="Số CCCD"
                        value={confirmData.identityCardNumber}
                      />
                    </Grid>
                  )}
                  {confirmData?.dateOfBirth && (
                    <Grid item xs={12} md={6}>
                      <InfoItem
                        icon={<CalendarIcon sx={{ fontSize: 20 }} />}
                        label="Ngày sinh"
                        value={formatDate(confirmData.dateOfBirth)}
                      />
                    </Grid>
                  )}
                  {confirmData?.gender && (
                    <Grid item xs={12} md={6}>
                      <InfoItem
                        icon={<PersonIcon sx={{ fontSize: 20 }} />}
                        label="Giới tính"
                        value={confirmData.gender}
                      />
                    </Grid>
                  )}
                  {confirmData?.address && (
                    <Grid item xs={12} md={6}>
                      <InfoItem
                        icon={<LocationIcon sx={{ fontSize: 20 }} />}
                        label="Địa chỉ"
                        value={confirmData.address}
                      />
                    </Grid>
                  )}
                  {confirmData?.issuedDate && (
                    <Grid item xs={12} md={6}>
                      <InfoItem
                        icon={<CalendarIcon sx={{ fontSize: 20 }} />}
                        label="Ngày cấp"
                        value={formatDate(confirmData.issuedDate)}
                      />
                    </Grid>
                  )}
                  {confirmData?.issuedPlace && (
                    <Grid item xs={12} md={6}>
                      <InfoItem
                        icon={<LocationIcon sx={{ fontSize: 20 }} />}
                        label="Nơi cấp"
                        value={confirmData.issuedPlace}
                      />
                    </Grid>
                  )}
                </Grid>
              </>
            )}
          </Paper>
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
            onClick={() => setShowConfirmDialog(false)}
            variant="outlined"
            disabled={loading}
            sx={{
              minWidth: 100,
              textTransform: 'none',
              borderRadius: 'var(--radius-lg)',
              padding: '10px 24px',
              fontWeight: 600,
              borderColor: 'var(--border-medium)',
              color: 'var(--text-primary)',
              '&:hover': {
                borderColor: 'var(--color-primary)',
                backgroundColor: 'var(--bg-tertiary)'
              }
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            disabled={loading}
            autoFocus
            sx={{
              minWidth: 120,
              textTransform: 'none',
              borderRadius: 'var(--radius-lg)',
              padding: '10px 24px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
              color: 'white',
              boxShadow: 'var(--shadow-md), 0 2px 8px rgba(37, 99, 235, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
                transform: 'translateY(-2px)',
                boxShadow: 'var(--shadow-lg), 0 4px 12px rgba(37, 99, 235, 0.4)'
              },
              '&:disabled': {
                background: 'grey.300'
              }
            }}
          >
            {loading ? 'Đang tạo...' : 'Xác nhận tạo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreateParent;

