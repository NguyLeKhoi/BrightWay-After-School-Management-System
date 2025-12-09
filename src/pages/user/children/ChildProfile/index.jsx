import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Avatar, Chip, CircularProgress, Alert, Typography, Button, Paper, IconButton, Grid, Pagination } from '@mui/material';
import ContentLoading from '../../../../components/Common/ContentLoading';
import { motion } from 'framer-motion';
import AnimatedCard from '../../../../components/Common/AnimatedCard';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  LocalHospital as MedicalIcon,
  CheckCircle as VerifiedIcon,
  Pending as PendingIcon,
  Add as AddIcon,
  Description as DocumentIcon,
  OpenInNew as OpenInNewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as PackageIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import studentService from '../../../../services/student.service';
import packageService from '../../../../services/package.service';
import { useApp } from '../../../../contexts/AppContext';
import ManagementFormDialog from '../../../../components/Management/FormDialog';
import Form from '../../../../components/Common/Form';
import ImageUpload from '../../../../components/Common/ImageUpload';
import ConfirmDialog from '../../../../components/Common/ConfirmDialog';
import { addDocumentSchema } from '../../../../utils/validationSchemas/documentSchemas';
import * as yup from 'yup';
import styles from './ChildProfile.module.css';

const getInitials = (name = '') => {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatDate = (value) => {
  if (!value) return 'Chưa có';
  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch {
    return 'Chưa có';
  }
};

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  try {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
};

const ChildProfile = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isInitialMount = useRef(true);
  const { showGlobalError } = useApp();


  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
  const [packagePage, setPackagePage] = useState(1);
  const [openAddDocumentDialog, setOpenAddDocumentDialog] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const fetchChild = async () => {
      if (!childId) {
        navigate('/user/management/children');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Kiểm tra xem childId có thuộc về user hiện tại không
        const myChildren = await studentService.getMyChildren();
        const childIds = Array.isArray(myChildren) 
          ? myChildren.map(c => c.id) 
          : [];
        
        if (!childIds.includes(childId)) {
          // Nếu childId không thuộc về user, chuyển về trang danh sách
          toast.error('Bạn không có quyền xem thông tin trẻ em này', {
            position: 'top-right',
            autoClose: 3000
          });
          navigate('/user/management/children');
          return;
        }

        const data = await studentService.getMyChildById(childId);
        setChild(data);
        
        // Load subscriptions for this child
        loadSubscriptions(childId);
      } catch (err) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải thông tin trẻ em';
        setError(errorMessage);
        showGlobalError(errorMessage);
        
        // Nếu lỗi 403 hoặc 404, có thể là do không có quyền truy cập
        if (err?.response?.status === 403 || err?.response?.status === 404) {
          navigate('/user/management/children');
        }
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchChild();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  useEffect(() => {
    // Reset to page 1 when subscriptions change
    setPackagePage(1);
  }, [subscriptions.length]);

  const loadSubscriptions = async (studentId) => {
    if (!studentId) return;
    
    setIsLoadingSubscriptions(true);
    try {
      const response = await packageService.getSubscriptionsByStudent(studentId);
      const subscriptionsArray = Array.isArray(response) ? response : (Array.isArray(response?.items) ? response.items : []);
      
      // Check if we need to fetch package details
      const needsPackageDetails = subscriptionsArray.some(sub => {
        const needsTotalSlots = sub.totalslotsSnapshot === null || sub.totalslotsSnapshot === undefined;
        return needsTotalSlots && sub.packageId;
      });
      
      // Fetch suitable packages if needed
      let suitablePackages = null;
      if (needsPackageDetails) {
        try {
          suitablePackages = await packageService.getSuitablePackages(studentId);
        } catch {
          // Silent fail - will use 0 for totalSlots
        }
      }
      
      // Map subscriptions to include calculated fields
      const mappedSubscriptions = subscriptionsArray.map(sub => {
        // Find package details if needed
        let packageDetails = null;
        if (suitablePackages && sub.packageId) {
          if (Array.isArray(suitablePackages)) {
            packageDetails = suitablePackages.find(pkg => pkg.id === sub.packageId);
          } else if (suitablePackages.id === sub.packageId) {
            packageDetails = suitablePackages;
          }
        }
        
        // Get totalSlots - prioritize snapshot, then from package details
        const totalSlotsFromPackage = packageDetails?.totalslots 
          ?? packageDetails?.totalSlots 
          ?? packageDetails?.totalSlotsSnapshot
          ?? 0;
        
        const totalSlots = (sub.totalslotsSnapshot !== null && sub.totalslotsSnapshot !== undefined) 
          ? sub.totalslotsSnapshot 
          : totalSlotsFromPackage;
        
        const usedSlots = sub.usedSlot ?? sub.usedslot ?? 0;
        const remainingSlots = Math.max(0, totalSlots - usedSlots);
        
        return {
          ...sub,
          totalSlots,
          usedSlots,
          remainingSlots
        };
      });
      
      setSubscriptions(mappedSubscriptions);
    } catch (err) {
      // Silent fail - just don't show subscriptions
      setSubscriptions([]);
    } finally {
      setIsLoadingSubscriptions(false);
    }
  };

  // Reload data when navigate back to this page (e.g., from other pages)
  useEffect(() => {
    if (location.pathname === `/user/management/children/${childId}/profile`) {
      // Skip first mount to avoid double loading
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      fetchChild();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleBack = () => {
    navigate('/user/management/children');
  };

  const handleAddDocumentSuccess = () => {
    // Reload child data to get updated documents
    const fetchChild = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await studentService.getMyChildById(childId);
        setChild(data);
        
        // Load subscriptions for this child
        loadSubscriptions(childId);
      } catch (err) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải thông tin trẻ em';
        setError(errorMessage);
        showGlobalError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchChild();
  };

  const [actionLoading, setActionLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const updateFormRef = useRef(null);
  const [updateFormData, setUpdateFormData] = useState({
    name: '',
    dateOfBirth: '',
    note: '',
    imageFile: null
  });

  // Validation schema for parent update
  const parentUpdateSchema = yup.object({
    name: yup
      .string()
      .trim()
      .required('Tên là bắt buộc')
      .min(2, 'Tên phải có ít nhất 2 ký tự')
      .max(100, 'Tên không được vượt quá 100 ký tự'),
    dateOfBirth: yup
      .date()
      .typeError('Ngày sinh không hợp lệ')
      .max(new Date(), 'Ngày sinh không được trong tương lai')
      .required('Ngày sinh là bắt buộc'),
    note: yup
      .string()
      .trim()
      .max(500, 'Ghi chú không được vượt quá 500 ký tự')
      .nullable()
      .notRequired()
      .transform((value, originalValue) => (originalValue === '' ? null : value)),
    imageFile: yup
      .mixed()
      .nullable()
      .notRequired()
      .test('fileSize', 'Kích thước file không được vượt quá 5MB', (value) => {
        if (!value) return true;
        return value.size <= 5 * 1024 * 1024; // 5MB
      })
      .test('fileType', 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF)', (value) => {
        if (!value) return true;
        return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(value.type);
      })
  });

  // Form fields for update
  const updateFields = [
    {
      name: 'name',
      label: 'Tên trẻ em *',
      type: 'text',
      required: true,
      placeholder: 'Nhập tên trẻ em',
      gridSize: 12
    },
    {
      name: 'dateOfBirth',
      label: 'Ngày sinh *',
      type: 'date',
      required: true,
      gridSize: 12
    },
    {
      name: 'note',
      label: 'Ghi chú',
      type: 'textarea',
      placeholder: 'Nhập ghi chú (nếu có)',
      rows: 4,
      gridSize: 12
    }
  ];

  const DOCUMENT_TYPE_OPTIONS = [
    { value: 'BirthCertificate', label: 'Giấy khai sinh' },
    { value: 'HouseholdBook', label: 'Sổ hộ khẩu' },
    { value: 'GuardianCertificate', label: 'Giấy chứng nhận người giám hộ' },
    { value: 'AuthorizationLetter', label: 'Giấy ủy quyền' },
    { value: 'AdoptionCertificate', label: 'Giấy chứng nhận nhận nuôi' },
    { value: 'DivorceCustodyDecision', label: 'Quyết định quyền nuôi con sau ly hôn' },
    { value: 'StudentCard', label: 'Thẻ trẻ em' },
    { value: 'SchoolEnrollmentConfirmation', label: 'Xác nhận nhập học' },
    { value: 'AcademicRecordBook', label: 'Sổ học bạ' },
    { value: 'VnEduScreenshot', label: 'Ảnh chụp màn hình VnEdu' },
    { value: 'TuitionReceipt', label: 'Biên lai học phí' },
    { value: 'CertificateOrLetter', label: 'Giấy chứng nhận/Thư xác nhận' },
    { value: 'Other', label: 'Khác' }
  ];

  // Document type mapping
  const getDocumentTypeLabel = (type) => {
    const typeMap = {
      'BirthCertificate': 'Giấy khai sinh',
      'HouseholdBook': 'Sổ hộ khẩu',
      'GuardianCertificate': 'Giấy chứng nhận người giám hộ',
      'AuthorizationLetter': 'Giấy ủy quyền',
      'AdoptionCertificate': 'Giấy chứng nhận nhận nuôi',
      'DivorceCustodyDecision': 'Quyết định quyền nuôi con sau ly hôn',
      'StudentCard': 'Thẻ trẻ em',
      'SchoolEnrollmentConfirmation': 'Xác nhận nhập học',
      'AcademicRecordBook': 'Sổ học bạ',
      'VnEduScreenshot': 'Ảnh chụp màn hình VnEdu',
      'TuitionReceipt': 'Biên lai học phí',
      'CertificateOrLetter': 'Giấy chứng nhận/Thư xác nhận',
      'Other': 'Khác'
    };
    return typeMap[type] || type || 'Không xác định';
  };

  const documentFields = [
    {
      section: 'Thông tin tài liệu',
      sectionDescription: 'Điền thông tin và tải lên file tài liệu xác minh cho con bạn.',
      name: 'type',
      label: 'Loại tài liệu',
      type: 'select',
      required: true,
      options: DOCUMENT_TYPE_OPTIONS,
      placeholder: 'Chọn loại tài liệu',
      gridSize: 6
    },
    {
      name: 'issuedBy',
      label: 'Nơi cấp',
      type: 'text',
      placeholder: 'Ví dụ: UBND Quận 1, TP.HCM',
      gridSize: 6
    },
    {
      name: 'issuedDate',
      label: 'Ngày cấp',
      type: 'date',
      gridSize: 6
    },
    {
      name: 'expirationDate',
      label: 'Ngày hết hạn (nếu có)',
      type: 'date',
      gridSize: 6
    },
    {
      name: 'file',
      label: 'File tài liệu',
      type: 'file',
      accept: 'image/*,.pdf',
      required: true,
      gridSize: 12,
      helperText: 'Chấp nhận file ảnh (JPG, PNG) hoặc PDF'
    }
  ];

  const handleUpdateSubmit = async (formValues) => {
    if (!childId) {
      toast.error('Không tìm thấy thông tin trẻ em');
      return;
    }

    setUpdateLoading(true);
    try {
      // Format dateOfBirth to ISO string
      let dateOfBirthISO;
      if (formValues.dateOfBirth instanceof Date) {
        dateOfBirthISO = formValues.dateOfBirth.toISOString();
      } else if (typeof formValues.dateOfBirth === 'string') {
        // If it's already ISO string, use it
        if (formValues.dateOfBirth.includes('T')) {
          dateOfBirthISO = formValues.dateOfBirth;
        } else {
          // If it's YYYY-MM-DD format, convert to ISO
          dateOfBirthISO = new Date(formValues.dateOfBirth + 'T00:00:00').toISOString();
        }
      } else {
        dateOfBirthISO = new Date(formValues.dateOfBirth).toISOString();
      }

      const updateData = {
        name: formValues.name.trim(),
        dateOfBirth: dateOfBirthISO,
        note: formValues.note?.trim() || null,
        imageFile: updateFormData.imageFile || null
      };

      await studentService.parentUpdateStudent(childId, updateData);
      toast.success('Cập nhật thông tin thành công!', {
        position: 'top-right',
        autoClose: 3000
      });
      
      // Reload child data
      await fetchChild();
      setOpenUpdateDialog(false);
      // Reset update form data
      setUpdateFormData({
        name: '',
        dateOfBirth: '',
        note: '',
        imageFile: null
      });
    } catch (err) {
      const message = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Không thể cập nhật thông tin';
      toast.error(message, { position: 'top-right', autoClose: 4000 });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!childId) {
      toast.error('Không tìm thấy thông tin trẻ em');
      return;
    }

    setDeleteLoading(true);
    try {
      await studentService.deleteStudent(childId);
      toast.success('Xóa trẻ em thành công!', {
        position: 'top-right',
        autoClose: 3000
      });
      
      // Navigate back to children list
      navigate('/user/management/children');
    } catch (err) {
        const message = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Không thể xóa trẻ em';
      toast.error(message, { position: 'top-right', autoClose: 4000 });
      setDeleteLoading(false);
    }
  };

  const handleDocumentSubmit = async (formValues) => {
    if (!childId) {
      toast.error('Không tìm thấy thông tin trẻ em');
      return;
    }

    setActionLoading(true);
    try {
      // Helper function to format date to ISO string for backend
      const formatDateForAPI = (dateValue) => {
        if (!dateValue) return null;
        
        // If already ISO string, return as is
        if (typeof dateValue === 'string' && dateValue.includes('T')) {
          return dateValue;
        }
        
        // If in YYYY-MM-DD format (from date input), convert to ISO
        if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          return new Date(dateValue + 'T00:00:00').toISOString();
        }
        
        // If Date object, convert to ISO
        if (dateValue instanceof Date) {
          return dateValue.toISOString();
        }
        
        // Try to parse as Date
        try {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        } catch {
          return null;
        }
        
        return null;
      };

      // Create FormData for multipart/form-data
      const formData = new FormData();
      
      formData.append('Type', formValues.type);
      if (formValues.issuedBy) {
        formData.append('IssuedBy', formValues.issuedBy);
      }
      if (formValues.issuedDate) {
        const formattedDate = formatDateForAPI(formValues.issuedDate);
        if (formattedDate) {
          formData.append('IssuedDate', formattedDate);
        }
      }
      if (formValues.expirationDate) {
        const formattedDate = formatDateForAPI(formValues.expirationDate);
        if (formattedDate) {
          formData.append('ExpirationDate', formattedDate);
        }
      }
      if (formValues.file) {
        formData.append('File', formValues.file);
      }

      await studentService.addDocument(childId, formData);
      toast.success('Thêm tài liệu thành công!', {
        position: 'top-right',
        autoClose: 3000
      });
      
      handleAddDocumentSuccess();
      setOpenAddDocumentDialog(false);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Không thể thêm tài liệu';
      toast.error(message, { position: 'top-right', autoClose: 4000 });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.profilePage}>
          <ContentLoading isLoading={loading} text="Đang tải thông tin trẻ em..." />
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.container}>
          <div className={styles.header}>
            <button className={styles.backButton} onClick={handleBack}>
              ← Quay lại
            </button>
          </div>
          <Alert severity="error" sx={{ mt: 2 }}>
            {error || 'Không tìm thấy thông tin trẻ em'}
          </Alert>
        </div>
      </div>
    );
  }

  const age = calculateAge(child.dateOfBirth);
  const studentLevelName = child.studentLevelName || child.studentLevel?.name || 'Chưa xác định';
  const schoolName = child.schoolName || child.school?.name || 'Chưa có';
  const branchName = child.branchName || child.branch?.branchName || 'Chưa có';
  const userName = child.userName || child.user?.name || 'Chưa có';

  return (
    <motion.div 
      className={styles.profilePage}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.container}>
        {/* Header */}
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.button 
            className={styles.backButton} 
            onClick={handleBack}
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Quay lại
          </motion.button>
          <h1 className={styles.title}>Thông tin trẻ em</h1>
        </motion.div>

        {/* Profile Content */}
        <div className={styles.profileContent}>
          {/* Two Column Layout: Basic Information and Packages */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
              gap: 3,
              marginBottom: 3
            }}
          >
          {/* Basic Information Card */}
          <AnimatedCard delay={0.1} className={styles.profileCard}>
            <Box display="flex" justifyContent="flex-end" alignItems="center" mb={2}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => {
                    // Initialize updateFormData with current child data when opening dialog
                    setUpdateFormData({
                      name: child?.name || '',
                      dateOfBirth: child?.dateOfBirth || '',
                      note: child?.note && child.note !== 'string' ? child.note : '',
                      imageFile: null
                    });
                    setOpenUpdateDialog(true);
                  }}
                  sx={{ 
                    textTransform: 'none',
                    borderRadius: 2,
                    fontWeight: 600,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                    }
                  }}
                >
                  Chỉnh sửa
                </Button>
              </motion.div>
            </Box>
            <Box display="flex" alignItems="center" gap={3} mb={3}>
              <Avatar
                src={child.image && child.image !== 'string' ? child.image : undefined}
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: 'primary.main',
                  fontSize: '2.5rem',
                  fontWeight: 'bold'
                }}
              >
                {getInitials(child.name)}
              </Avatar>
              <Box flex={1}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {child.name || 'Chưa có tên'}
                </Typography>
                <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" mt={1}>
                  <Chip
                    icon={child.status ? <VerifiedIcon /> : <PendingIcon />}
                    label={child.status ? 'Đã duyệt' : 'Chờ duyệt'}
                    color={child.status ? 'success' : 'warning'}
                    size="small"
                  />
                  {studentLevelName && studentLevelName !== 'Chưa xác định' && (
                    <Chip
                      label={studentLevelName}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>
              </Box>
            </Box>

            <div className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <CalendarIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
                    Ngày sinh
                  </label>
                  <div className={styles.fieldValue}>
                    {child.dateOfBirth ? formatDate(child.dateOfBirth) : 'Chưa có'}
                    {age && <span style={{ color: '#666', marginLeft: '8px' }}>({age} tuổi)</span>}
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <PersonIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
                    Phụ huynh
                  </label>
                  <div className={styles.fieldValue}>
                    {userName}
                  </div>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <SchoolIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
                    Trường học
                  </label>
                  <div className={styles.fieldValue}>
                    {schoolName}
                    </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <BusinessIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
                    Chi nhánh
                  </label>
                  <div className={styles.fieldValue}>
                    {branchName}
                    </div>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <SchoolIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
                    Cấp độ trẻ em
                  </label>
                  <div className={styles.fieldValue}>
                    {studentLevelName}
                    </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <CalendarIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
                    Ngày tham gia
                  </label>
                  <div className={styles.fieldValue}>
                    {child.createdTime ? formatDate(child.createdTime) : 'Chưa có'}
                    </div>
                </div>
              </div>

              {child.note && child.note !== 'string' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Ghi chú</label>
                  <div className={styles.fieldValue} style={{ minHeight: '60px', whiteSpace: 'pre-wrap' }}>
                    {child.note}
                  </div>
                </div>
              )}
            </div>
          </AnimatedCard>

          {/* Documents Card */}
          <AnimatedCard delay={0.2} className={styles.profileCard}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Thông tin chi tiết
              </Typography>
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenAddDocumentDialog(true)}
                  sx={{ textTransform: 'none' }}
                >
                  Thêm tài liệu
                </Button>
              </Box>
            </Box>
            <div className={styles.form}>
              {child.documents && child.documents.length > 0 ? (
                <Box>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <DocumentIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Tài liệu xác minh ({child.documents.length})
                    </Typography>
                  </Box>
                  <Box display="flex" flexDirection="column" gap={2}>
                    {child.documents.map((doc, index) => (
                      <Paper
                        key={doc.id || index}
                        elevation={0}
                        sx={{
                          p: 2.5,
                          border: '1px solid',
                          borderColor: doc.verified ? 'success.light' : 'divider',
                          borderRadius: 2,
                          bgcolor: doc.verified ? 'success.50' : 'grey.50',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: 2,
                            borderColor: doc.verified ? 'success.main' : 'primary.light'
                          }
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Box flex={1}>
                            <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                              <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                                {getDocumentTypeLabel(doc.type)}
                              </Typography>
                              <Chip
                                icon={doc.verified ? <VerifiedIcon /> : <PendingIcon />}
                                label={doc.verified ? 'Đã xác minh' : 'Chờ xác minh'}
                                color={doc.verified ? 'success' : 'default'}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                            
                            <Box display="flex" flexDirection="column" gap={1}>
                              {doc.issuedBy && (
                                <Box display="flex" alignItems="flex-start" gap={1}>
                                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                                    <strong>Nơi cấp:</strong>
                                  </Typography>
                                  <Typography variant="body2" color="text.primary">
                                    {doc.issuedBy}
                                  </Typography>
                                </Box>
                              )}
                              
                              <Box display="flex" gap={3} flexWrap="wrap">
                                {doc.issuedDate && (
                                  <Box display="flex" alignItems="flex-start" gap={1}>
                                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                                      <strong>Ngày cấp:</strong>
                                    </Typography>
                                    <Typography variant="body2" color="text.primary">
                                      {formatDate(doc.issuedDate)}
                                    </Typography>
                                  </Box>
                                )}
                                {doc.expirationDate && (
                                  <Box display="flex" alignItems="flex-start" gap={1}>
                                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                                      <strong>Ngày hết hạn:</strong>
                                    </Typography>
                                    <Typography variant="body2" color="text.primary">
                                      {formatDate(doc.expirationDate)}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </Box>
                          
                          {doc.documentImageUrl && doc.documentImageUrl !== 'string' && (
                            <IconButton
                              size="small"
                              onClick={() => window.open(doc.documentImageUrl, '_blank')}
                              sx={{ 
                                ml: 1,
                                color: 'primary.main',
                                '&:hover': {
                                  bgcolor: 'primary.50'
                                }
                              }}
                              title="Xem tài liệu"
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              ) : (
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <MedicalIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
                    Tài liệu xác minh
                  </label>
                  <div className={styles.fieldValue} style={{ color: '#666' }}>
                    Chưa có tài liệu xác minh
                  </div>
                </div>
              )}
            </div>
          </AnimatedCard>
          </Box>

          {/* Add Document Dialog */}
          <ManagementFormDialog
            open={openAddDocumentDialog}
            onClose={() => !actionLoading && setOpenAddDocumentDialog(false)}
            mode="create"
            title="Tài Liệu Xác Minh"
            icon={AddIcon}
            loading={actionLoading}
            maxWidth="md"
          >
            <Form
              schema={addDocumentSchema}
              defaultValues={{
                type: '',
                issuedBy: '',
                issuedDate: '',
                expirationDate: '',
                file: null
              }}
              onSubmit={handleDocumentSubmit}
              submitText="Thêm Tài Liệu"
              loading={actionLoading}
              disabled={actionLoading}
              fields={documentFields}
            />
          </ManagementFormDialog>

          {/* Update Student Dialog */}
          <ManagementFormDialog
            open={openUpdateDialog}
            onClose={() => {
              if (!updateLoading) {
                setOpenUpdateDialog(false);
                // Reset update form data when closing
                setUpdateFormData({
                  name: '',
                  dateOfBirth: '',
                  note: '',
                  imageFile: null
                });
              }
            }}
            mode="update"
            title="Chỉnh sửa thông tin trẻ em"
            icon={EditIcon}
            loading={updateLoading}
            maxWidth="md"
          >
            <Form
              ref={updateFormRef}
              schema={parentUpdateSchema}
              defaultValues={{
                name: child?.name || '',
                dateOfBirth: child?.dateOfBirth 
                  ? new Date(child.dateOfBirth).toISOString().split('T')[0]
                  : '',
                note: child?.note && child.note !== 'string' ? child.note : ''
              }}
              onSubmit={handleUpdateSubmit}
              submitText="Cập nhật"
              loading={updateLoading}
              disabled={updateLoading}
              fields={updateFields}
              hideSubmitButton
            />
            
            {/* Image Upload Section */}
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <ImageUpload
                    value={updateFormData.imageFile || null}
                    onChange={(file) => {
                      // Get current form values to preserve them
                      let currentFormValues = {};
                      if (updateFormRef.current && typeof updateFormRef.current.getValues === 'function') {
                        try {
                          currentFormValues = updateFormRef.current.getValues();
                        } catch (err) {
                          currentFormValues = {};
                        }
                      }
                      // Update updateFormData with new imageFile
                      // Important: Destructure to remove imageFile field before spreading
                      const { imageFile: _, ...otherFormValues } = currentFormValues;
                      setUpdateFormData({ 
                        ...otherFormValues, // Use form values instead of old updateFormData
                        imageFile: file 
                      });
                      // Also update form value if formRef is available
                      if (updateFormRef.current && typeof updateFormRef.current.setValue === 'function') {
                        try {
                          updateFormRef.current.setValue('imageFile', file, { shouldValidate: false });
                        } catch (err) {
                          // If setValue fails, just continue without updating form
                        }
                      }
                    }}
                    label="Ảnh đại diện (tùy chọn)"
                    helperText="Chọn file ảnh để tải lên (JPG, PNG, etc.) - Tối đa 5MB"
                    accept="image/*"
                    maxSize={5 * 1024 * 1024}
                  />
                </Grid>
              </Grid>
            </Box>
            
            {/* Submit Button at the bottom */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                onClick={() => {
                  if (!updateLoading) {
                    setOpenUpdateDialog(false);
                    setUpdateFormData({
                      name: '',
                      dateOfBirth: '',
                      note: '',
                      imageFile: null
                    });
                  }
                }}
                disabled={updateLoading}
                variant="outlined"
                sx={{
                  minWidth: 120,
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
                onClick={async () => {
                  if (updateFormRef.current?.submit) {
                    await updateFormRef.current.submit();
                  }
                }}
                disabled={updateLoading}
                variant="contained"
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
                {updateLoading ? 'Đang cập nhật...' : 'Cập nhật'}
              </Button>
            </Box>
          </ManagementFormDialog>

          {/* Delete Confirmation Dialog */}
          <ConfirmDialog
            open={openDeleteDialog}
            onClose={() => !deleteLoading && setOpenDeleteDialog(false)}
            onConfirm={handleDeleteConfirm}
            title="Xác nhận xóa trẻ em"
            description={`Bạn có chắc chắn muốn xóa trẻ em "${child?.name || 'này'}" không? Hành động này không thể hoàn tác.`}
            confirmText="Xóa"
            cancelText="Hủy"
            confirmColor="error"
            highlightText={child?.name}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ChildProfile;
