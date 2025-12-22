import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Chip,
  Divider,
  Grid
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  VerifiedUser as VerifiedIcon,
  Pending as PendingIcon,
  Description as DocumentIcon,
  OpenInNew as OpenInNewIcon,
  Cancel as RejectIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getErrorMessage } from '../../../utils/errorHandler';
import ManagementPageHeader from '../../../components/Management/PageHeader';
import ManagementSearchSection from '../../../components/Management/SearchSection';
import DataTable from '../../../components/Common/DataTable';
import ConfirmDialog from '../../../components/Common/ConfirmDialog';
import ContentLoading from '../../../components/Common/ContentLoading';
import useBaseCRUD from '../../../hooks/useBaseCRUD';
import { useApp } from '../../../contexts/AppContext';
import { useAuth } from '../../../contexts/AuthContext';
import studentService from '../../../services/student.service';
import schoolService from '../../../services/school.service';
import studentLevelService from '../../../services/studentLevel.service';
import userService from '../../../services/user.service';
import { createManagerStudentColumns } from '../../../definitions/manager/student/tableColumns';
import styles from './StudentManagement.module.css';

// Pure function - no memoization needed (doesn't depend on component state)
const mapOptions = (items = [], labelKey = 'name') =>
  items
    .filter((item) => item && item.id && item[labelKey])
    .map((item) => ({
      value: item.id,
      label: item[labelKey]
    }));

const StudentManagement = () => {
  const { showGlobalError } = useApp();
  const { user } = useAuth();
  const location = useLocation();
  const branchIdRef = useRef(user?.branchId || '');
  const isInitialMount = useRef(true);


  const [activeTab, setActiveTab] = useState(0); // 0 = Approved, 1 = Unverified, 2 = Approved with Unverified Documents
  const [parentOptions, setParentOptions] = useState([]);
  const [schoolOptions, setSchoolOptions] = useState([]);
  const [studentLevelOptions, setStudentLevelOptions] = useState([]);
  const [dependenciesLoading, setDependenciesLoading] = useState(true);
  const [dependenciesError, setDependenciesError] = useState(null);
  const [branchInfo, setBranchInfo] = useState({
    id: user?.branchId || '',
    name: user?.branchName || ''
  });
  
  // Unverified students state
  const [unverifiedStudents, setUnverifiedStudents] = useState([]);
  const [loadingUnverified, setLoadingUnverified] = useState(false);
  
  // Approved students with unverified documents state
  const [approvedWithUnverifiedDocs, setApprovedWithUnverifiedDocs] = useState([]);
  const [loadingApprovedWithDocs, setLoadingApprovedWithDocs] = useState(false);
  
  // Search and filter state for tab 1 (Unverified Students)
  const [unverifiedSearchKeyword, setUnverifiedSearchKeyword] = useState('');
  const [unverifiedFilters, setUnverifiedFilters] = useState({
    schoolId: '',
    studentLevelId: ''
  });
  
  // Search and filter state for tab 2 (Approved with Unverified Docs)
  const [approvedDocsSearchKeyword, setApprovedDocsSearchKeyword] = useState('');
  const [approvedDocsFilters, setApprovedDocsFilters] = useState({
    schoolId: '',
    studentLevelId: ''
  });
  const [approvingStudentId, setApprovingStudentId] = useState(null);
  const [approveConfirmDialog, setApproveConfirmDialog] = useState({
    open: false,
    student: null
  });
  
  // Document approval state
  const [approvingDocumentId, setApprovingDocumentId] = useState(null);
  const [rejectConfirmDialog, setRejectConfirmDialog] = useState({
    open: false,
    document: null,
    student: null
  });

  // Document image (signed URL) state
  const [documentImageUrls, setDocumentImageUrls] = useState({});
  const [loadingDocumentImageId, setLoadingDocumentImageId] = useState(null);
  const [documentImageLoadErrors, setDocumentImageLoadErrors] = useState({});
  
  // Delete student state
  const [deletingStudentId, setDeletingStudentId] = useState(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({
    open: false,
    student: null
  });
  
  // Detail dialog state
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    student: null,
    loading: false
  });

  const studentCrud = useBaseCRUD({
    loadFunction: async (params) => {
      // Đảm bảo branchId luôn được set từ manager
      // Ưu tiên: params.branchId (từ filters) > branchIdRef > user?.branchId > branchInfo.id
      let resolvedBranchId = params.branchId;
      
      // Nếu không có trong params hoặc là chuỗi rỗng, lấy từ các nguồn khác
      if (!resolvedBranchId || resolvedBranchId === '') {
        resolvedBranchId = branchIdRef.current || user?.branchId || branchInfo.id;
      }
      
      // Không load nếu không có branchId
      if (!resolvedBranchId) {
        throw new Error('Không thể xác định chi nhánh. Vui lòng đăng nhập lại.');
      }
      
      return await studentService.getStudentsPaged({
        pageIndex: params.pageIndex,
        pageSize: params.pageSize,
        name: (params.Keyword || params.searchTerm) || undefined,
        branchId: resolvedBranchId, // Luôn filter theo branchId của manager
        schoolId: params.schoolId || undefined,
        levelId: params.studentLevelId || params.levelId || undefined,
        userId: params.userId || undefined,
        status: true // Chỉ lấy học sinh đã duyệt
      });
    },
    defaultFilters: {
      branchId: '',
      schoolId: '',
      studentLevelId: '',
      userId: ''
    },
    loadOnMount: false // Don't auto-load, we'll load when tab is active
  });

  useEffect(() => {
    const ensureBranch = async () => {
      if (user?.branchId) {
        setBranchInfo((prev) => ({
          id: user.branchId,
          name: user.branchName || prev.name
        }));
        branchIdRef.current = user.branchId;
        studentCrud.setFilters((prev) => ({
          ...prev,
          branchId: user.branchId
        }));
        return;
      }

      if (branchInfo.id) {
        branchIdRef.current = branchInfo.id;
        studentCrud.setFilters((prev) => ({
          ...prev,
          branchId: branchInfo.id
        }));
        return;
      }

      try {
        const currentUser = await userService.getCurrentUser();
        const managerBranchId =
          currentUser?.managerProfile?.branchId ||
          currentUser?.branchId ||
          currentUser?.managerBranchId ||
          '';
        if (managerBranchId) {
          const managerBranchName =
            currentUser?.managerProfile?.branchName ||
            currentUser?.branchName ||
            currentUser?.managerBranchName ||
            branchInfo.name;
          setBranchInfo({
            id: managerBranchId,
            name: managerBranchName
          });
          branchIdRef.current = managerBranchId;
          studentCrud.setFilters((prev) => ({
            ...prev,
            branchId: managerBranchId
          }));
        } else {

          showGlobalError('Quản lý không có chi nhánh được gán. Vui lòng liên hệ quản trị viên.');
        }
      } catch (error) {
        showGlobalError('Không thể xác định chi nhánh. Vui lòng đăng nhập lại.');
      }
    };

    ensureBranch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.branchId, user?.branchName]);
  
  // Handle view detail - for DataTable onView prop
  const handleViewDetail = useCallback(async (student) => {
    setDetailDialog({
      open: true,
      student: null,
      loading: true
    });
    
    try {
      // Fetch full student details
      const fullStudent = await studentService.getStudentById(student.id);
      setDetailDialog({
        open: true,
        student: fullStudent,
        loading: false
      });
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Không thể tải thông tin chi tiết';
      toast.error(errorMessage);
      setDetailDialog({
        open: false,
        student: null,
        loading: false
      });
    }
  }, []);

  // Handle delete - for DataTable onDelete prop
  const handleDeleteClick = useCallback((student) => {
    setDeleteConfirmDialog({ open: true, student });
  }, []);
  
  // Columns for unverified students (no actions column - will use DataTable's built-in actions)
  const unverifiedColumns = useMemo(() => {
    return createManagerStudentColumns();
  }, []);
  
  // Columns for approved students (without unverified documents column)
  const approvedColumns = useMemo(() => {
    const baseColumns = createManagerStudentColumns();
    // Filter out unverifiedDocuments column for approved students tab
    return baseColumns.filter(col => col.key !== 'unverifiedDocuments');
  }, []);
  
  // Columns for approved students with unverified documents (keep unverified documents column)
  const approvedWithDocsColumns = useMemo(() => {
    return createManagerStudentColumns();
  }, []);

  const fetchDependencies = useCallback(async () => {
    setDependenciesLoading(true);
    setDependenciesError(null);
    try {
       const [parentsResponse, schoolsResponse, studentLevelsResponse] =
        await Promise.all([
          userService.getUsersPagedByRole({
            pageIndex: 1,
            pageSize: 200,
            Role: 'User'
          }),
          schoolService.getAllSchools(),
          studentLevelService.getAllStudentLevels()
        ]);

      const parentItems = parentsResponse?.items || parentsResponse || [];
      setParentOptions(
        parentItems.map((item) => ({
          value: item.id,
          label: item.name || item.fullName || item.email || 'Không rõ tên'
        }))
      );
      setSchoolOptions(mapOptions(schoolsResponse, 'name'));
      setStudentLevelOptions(mapOptions(studentLevelsResponse, 'name'));
    } catch (error) {
      const message =
        error?.response?.data?.message || error?.message || 'Không thể tải dữ liệu phụ trợ';
      setDependenciesError(message);
      showGlobalError(message);
    } finally {
      setDependenciesLoading(false);
    }
  }, [showGlobalError]);

  useEffect(() => {
    fetchDependencies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load data when tab changes hoặc khi branchId được set (chỉ load khi đã có branchId)
  useEffect(() => {
    // Chỉ load khi đã có branchId
    const currentBranchId = branchInfo.id || user?.branchId;
    if (!currentBranchId) {
      return;
    }
    
    if (activeTab === 0) {
      // Load approved students
      studentCrud.loadData();
    } else if (activeTab === 1) {
      // Load unverified students
      loadUnverifiedStudents();
    } else if (activeTab === 2) {
      // Load approved students with unverified documents
      loadApprovedWithUnverifiedDocs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, branchInfo.id, user?.branchId]);

  // Reload data when navigate back to this page (e.g., from create/update pages)
  useEffect(() => {
    // Chỉ load khi đã có branchId
    const currentBranchId = branchInfo.id || user?.branchId;
    if (!currentBranchId) {
      return;
    }
    
    // Check if navigating from create/update pages
    if (location.pathname === '/manager/students') {
      // Skip first mount to avoid double loading
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      
      // Đảm bảo branchId được set trong filters trước khi reload
      studentCrud.setFilters((prev) => ({
        ...prev,
        branchId: currentBranchId
      }));
      
      if (activeTab === 0) {
        studentCrud.loadData(false);
      } else if (activeTab === 1) {
        loadUnverifiedStudents();
      } else if (activeTab === 2) {
        loadApprovedWithUnverifiedDocs();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, activeTab, branchInfo.id, user?.branchId]);

  // Load unverified students (backend đã tự filter theo branch của manager)
  const loadUnverifiedStudents = useCallback(async () => {
    // Đảm bảo có branchId trước khi load
    if (!branchIdRef.current && !user?.branchId && !branchInfo.id) {
      setUnverifiedStudents([]);
      return;
    }
    
    setLoadingUnverified(true);
    try {
      // Backend tự động filter theo branch của manager qua ClaimsPrincipal
      const response = await studentService.getUnverifiedStudents();
      // Handle both array and object responses
      const students = Array.isArray(response) ? response : (response.items || []);
      
      // Filter thêm ở frontend để đảm bảo (nếu backend chưa filter đúng)
      const branchId = branchIdRef.current || user?.branchId || branchInfo.id;
      const filteredStudents = students.filter(student => {
        const studentBranchId = student.branchId || student.BranchId;
        return studentBranchId === branchId;
      });
      
      setUnverifiedStudents(filteredStudents);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Không thể tải danh sách trẻ em chưa duyệt';
      setDependenciesError(errorMessage);
      showGlobalError(errorMessage);
      setUnverifiedStudents([]);
    } finally {
      setLoadingUnverified(false);
    }
  }, [showGlobalError, user?.branchId, branchInfo.id]);

  // Load approved students with unverified documents
  const loadApprovedWithUnverifiedDocs = useCallback(async () => {
    // Đảm bảo có branchId trước khi load
    if (!branchIdRef.current && !user?.branchId && !branchInfo.id) {
      setApprovedWithUnverifiedDocs([]);
      return;
    }
    
    setLoadingApprovedWithDocs(true);
    try {
      const branchId = branchIdRef.current || user?.branchId || branchInfo.id;
      
      // Load tất cả approved students
      const response = await studentService.getStudentsPaged({
        pageIndex: 1,
        pageSize: 1000, // Load nhiều để filter
        branchId: branchId,
        status: true,
        document: false // Chỉ lấy học sinh đã duyệt nhưng tài liệu chưa duyệt
      });
      
      const students = response?.items || response || [];
      
      // Filter: chỉ lấy những học sinh đã duyệt (status === true) và có documents chưa duyệt
      const filteredStudents = students.filter(student => {
        // Kiểm tra status (phải là approved)
        const status = student.status !== undefined 
          ? student.status 
          : student.Status !== undefined 
            ? student.Status 
            : null;
        
        if (status !== true && status !== 'true') {
          return false; // Không phải approved
        }
        
        // Kiểm tra có documents chưa duyệt không
        const documents = student.documents || student.Documents || [];
        const hasUnverifiedDocs = documents.some(doc => {
          const verified = doc.verified ?? doc.Verified ?? false;
          return !verified;
        });
        
        return hasUnverifiedDocs;
      });
      
      setApprovedWithUnverifiedDocs(filteredStudents);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Không thể tải danh sách trẻ em đã duyệt có tài liệu chưa duyệt';
      setDependenciesError(errorMessage);
      showGlobalError(errorMessage);
      setApprovedWithUnverifiedDocs([]);
    } finally {
      setLoadingApprovedWithDocs(false);
    }
  }, [showGlobalError, user?.branchId, branchInfo.id]);

  // Handle approve confirm
  const handleApproveConfirm = useCallback(async () => {
    if (!approveConfirmDialog.student) return;
    
    const studentId = approveConfirmDialog.student.id;
    setApprovingStudentId(studentId);
    
    try {
      await studentService.approveStudent(studentId);
      toast.success(`Đã duyệt trẻ em "${approveConfirmDialog.student.name}" thành công!`);
      
      // Remove from unverified list
      setUnverifiedStudents(prev => prev.filter(s => s.id !== studentId));
      
      // Close detail dialog if open
      setDetailDialog({ open: false, student: null, loading: false });
      
      // Đảm bảo branchId vẫn được giữ trong filters trước khi reload
      const currentBranchId = branchIdRef.current || user?.branchId || branchInfo.id;
      if (currentBranchId) {
        studentCrud.setFilters((prev) => ({
          ...prev,
          branchId: currentBranchId
        }));
      }
      
      // Reload approved students
      if (activeTab === 0) {
        studentCrud.loadData(false);
      } else if (activeTab === 2) {
        loadApprovedWithUnverifiedDocs();
      }
      
      setApproveConfirmDialog({ open: false, student: null });
    } catch (error) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi duyệt trẻ em';
      toast.error(errorMessage);
      showGlobalError(errorMessage);
    } finally {
      setApprovingStudentId(null);
    }
  }, [approveConfirmDialog, activeTab, studentCrud, showGlobalError, user?.branchId, branchInfo.id, loadApprovedWithUnverifiedDocs]);
  
  // Handle approve from detail dialog
  const handleApproveFromDetail = useCallback(() => {
    if (detailDialog.student) {
      setApproveConfirmDialog({
        open: true,
        student: detailDialog.student
      });
    }
  }, [detailDialog.student]);
  
  // Handle document approve/reject
  const handleApproveDocument = useCallback(async (documentId, approve = true) => {
    if (!documentId) return;
    
    setApprovingDocumentId(documentId);
    
    try {
      await studentService.approveDocument(documentId, approve);
      toast.success(approve ? 'Đã phê duyệt tài liệu thành công!' : 'Đã từ chối tài liệu thành công!');
      
      // Reload student data to get updated documents
      if (detailDialog.student) {
        try {
          const updatedStudent = await studentService.getStudentById(detailDialog.student.id);
          setDetailDialog(prev => ({
            ...prev,
            student: updatedStudent
          }));
        } catch (error) {

        }
      }
      
      // Đảm bảo branchId vẫn được giữ trong filters trước khi reload
      const currentBranchId = branchIdRef.current || user?.branchId || branchInfo.id;
      if (currentBranchId) {
        studentCrud.setFilters((prev) => ({
          ...prev,
          branchId: currentBranchId
        }));
      }
      
      // Reload students list in table to update unverified documents count
      if (activeTab === 0) {
        studentCrud.loadData(false);
      } else if (activeTab === 2) {
        loadApprovedWithUnverifiedDocs();
      }
      
      // Close reject dialog if open
      if (!approve) {
        setRejectConfirmDialog({ open: false, document: null, student: null });
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || `Có lỗi xảy ra khi ${approve ? 'phê duyệt' : 'từ chối'} tài liệu`;
      toast.error(errorMessage);
      showGlobalError(errorMessage);
    } finally {
      setApprovingDocumentId(null);
    }
  }, [detailDialog.student, activeTab, studentCrud, showGlobalError, user?.branchId, branchInfo.id]);
  
  // Handle document reject click
  const handleRejectDocumentClick = useCallback((document, student) => {
    setRejectConfirmDialog({
      open: true,
      document,
      student
    });
  }, []);
  
  // Handle document reject confirm
  const handleRejectDocumentConfirm = useCallback(() => {
    if (rejectConfirmDialog.document) {
      handleApproveDocument(rejectConfirmDialog.document.id, false);
    }
  }, [rejectConfirmDialog.document, handleApproveDocument]);

  const handleViewDocumentImage = useCallback(async (documentId) => {
    if (!documentId) return;

    setLoadingDocumentImageId(documentId);
    try {
      const result = await studentService.getDocumentImageUrl(documentId);
      const imageUrl = result?.imageUrl;

      if (!imageUrl) {
        throw new Error(result?.message || 'Không thể lấy URL ảnh tài liệu');
      }

      setDocumentImageLoadErrors((prev) => ({
        ...prev,
        [documentId]: false
      }));

      setDocumentImageUrls((prev) => ({
        ...prev,
        [documentId]: imageUrl
      }));
    } catch (error) {
      const errorMessage = getErrorMessage(error) || 'Không thể lấy URL ảnh tài liệu';
      toast.error(errorMessage);
    } finally {
      setLoadingDocumentImageId(null);
    }
  }, []);
  
  // Handle delete student
  const handleDeleteStudent = useCallback(async () => {
    if (!deleteConfirmDialog.student) return;
    
    const studentId = deleteConfirmDialog.student.id;
    setDeletingStudentId(studentId);
    
    try {
      await studentService.deleteStudent(studentId);
      toast.success(`Đã xóa học sinh "${deleteConfirmDialog.student.name}" thành công!`);
      
      // Close detail dialog if open
      if (detailDialog.student?.id === studentId) {
        setDetailDialog({ open: false, student: null, loading: false });
      }
      
      // Đảm bảo branchId vẫn được giữ trong filters trước khi reload
      const currentBranchId = branchIdRef.current || user?.branchId || branchInfo.id;
      if (currentBranchId) {
        studentCrud.setFilters((prev) => ({
          ...prev,
          branchId: currentBranchId
        }));
      }
      
      // Reload approved students
      if (activeTab === 0) {
        studentCrud.loadData(false);
      }
      
      setDeleteConfirmDialog({ open: false, student: null });
    } catch (error) {
      const errorMessage = getErrorMessage(error) || 'Có lỗi xảy ra khi xóa học sinh';
      toast.error(errorMessage, {
        autoClose: 5000,
        style: { whiteSpace: 'pre-line' }
      });
      showGlobalError(errorMessage);
    } finally {
      setDeletingStudentId(null);
    }
  }, [deleteConfirmDialog, detailDialog.student, activeTab, studentCrud, showGlobalError, user?.branchId, branchInfo.id]);
  
  // Helper functions for detail dialog
  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  const getInitials = (name) => {
    if (!name) return 'H';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };
  
  // Document type mapping
  const getDocumentTypeLabel = (type) => {
    const typeMap = {
      'BirthCertificate': 'Giấy khai sinh',
      'HouseholdBook': 'Sổ hộ khẩu',
      'GuardianCertificate': 'Giấy chứng nhận người giám hộ',
      'AuthorizationLetter': 'Giấy ủy quyền',
      'AdoptionCertificate': 'Giấy chứng nhận nhận nuôi',
      'DivorceCustodyDecision': 'Quyết định quyền nuôi con sau ly hôn',
      'StudentCard': 'Thẻ học sinh',
      'SchoolEnrollmentConfirmation': 'Xác nhận nhập học',
      'AcademicRecordBook': 'Sổ học bạ',
      'VnEduScreenshot': 'Ảnh chụp màn hình VnEdu',
      'TuitionReceipt': 'Biên lai học phí',
      'CertificateOrLetter': 'Giấy chứng nhận/Thư xác nhận',
      'Other': 'Khác'
    };
    return typeMap[type] || type || 'Không xác định';
  };

  const renderDependencyState = () => {
    if (dependenciesLoading) {
      return null; // ContentLoading will handle this
    }

    if (dependenciesError) {
      return (
        <Typography variant="body2" color="error" className={styles.dependenciesHint}>
          {dependenciesError}
        </Typography>
      );
    }

    return null;
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <div className={styles.container}>
      {(dependenciesLoading || studentCrud.isPageLoading || loadingUnverified || loadingApprovedWithDocs) && (
        <ContentLoading 
          isLoading={dependenciesLoading || studentCrud.isPageLoading || loadingUnverified || loadingApprovedWithDocs} 
          text={dependenciesLoading ? 'Đang tải dữ liệu phụ trợ...' : studentCrud.loadingText || 'Đang tải dữ liệu...'} 
        />
      )}
      
      <ManagementPageHeader
        title="Quản lý trẻ em"
      />

      {(studentCrud.error || dependenciesError) && (
        <Alert
          severity="error"
          className={styles.errorAlert}
          onClose={() => {
            studentCrud.setError(null);
            setDependenciesError(null);
          }}
        >
          {studentCrud.error || dependenciesError}
        </Alert>
      )}

      {/* Tabs */}
      <Paper 
        sx={{ 
          mb: 3,
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}
      >
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '15px',
              fontWeight: 500,
              minHeight: 64,
              padding: '12px 24px',
              color: 'text.secondary',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
                color: 'primary.main'
              },
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 600
              }
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              backgroundColor: '#1976d2'
            }
          }}
        >
          <Tab label="Trẻ Em Đã Duyệt" />
          <Tab label="Trẻ Em Chưa Duyệt" />
          <Tab label="Tài Liệu Chưa Duyệt" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <>
      <ManagementSearchSection
        keyword={studentCrud.keyword}
        onKeywordChange={studentCrud.handleKeywordChange}
        onSearch={studentCrud.handleKeywordSearch}
        onClear={studentCrud.handleClearSearch}
        placeholder="Tìm kiếm theo tên trẻ em hoặc phụ huynh..."
      >
        <Box className={styles.filterRow}>
          <FormControl size="small" className={styles.filterControl}>
            <InputLabel id="school-filter-label" shrink>
              Trường học
            </InputLabel>
            <Select
              labelId="school-filter-label"
              value={studentCrud.filters.schoolId || ''}
              label="Trường học"
              notched
              displayEmpty
              renderValue={(selected) => {
                if (!selected) {
                  return <span className={styles.filterPlaceholder}>Tất cả trường học</span>;
                }
                const option = schoolOptions.find((opt) => opt.value === selected);
                return option?.label || 'Trường học không xác định';
              }}
              onChange={(event) => studentCrud.updateFilter('schoolId', event.target.value || '')}
            >
              <MenuItem value="">
                <em>Tất cả trường học</em>
              </MenuItem>
              {schoolOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" className={styles.filterControl}>
            <InputLabel id="student-level-filter-label" shrink>
              Cấp độ
            </InputLabel>
            <Select
              labelId="student-level-filter-label"
              value={studentCrud.filters.studentLevelId || ''}
              label="Cấp độ"
              notched
              displayEmpty
              renderValue={(selected) => {
                if (!selected) {
                  return <span className={styles.filterPlaceholder}>Tất cả cấp độ</span>;
                }
                const option = studentLevelOptions.find((opt) => opt.value === selected);
                return option?.label || 'Cấp độ không xác định';
              }}
              onChange={(event) =>
                studentCrud.updateFilter('studentLevelId', event.target.value || '')
              }
            >
              <MenuItem value="">
                <em>Tất cả cấp độ</em>
              </MenuItem>
              {studentLevelOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {renderDependencyState()}
      </ManagementSearchSection>

      <div className={styles.tableContainer}>
        <DataTable
          data={studentCrud.data.filter(student => {
            // Đảm bảo chỉ hiển thị học sinh đã được duyệt
            // Backend dùng field 'status' (true = approved/active, false = unapproved/inactive)
            // Kiểm tra cả status và Status (case-insensitive)
            const status = student.status !== undefined 
              ? student.status 
              : student.Status !== undefined 
                ? student.Status 
                : null;
            // Chỉ hiển thị học sinh có status === true (đã được duyệt và hoạt động)
            // Nếu không có field status, không hiển thị (để an toàn)
            return status === true || status === 'true';
          })}
              columns={approvedColumns}
          loading={studentCrud.isPageLoading}
          page={studentCrud.page}
          rowsPerPage={studentCrud.rowsPerPage}
          totalCount={studentCrud.data.filter(student => {
            const status = student.status !== undefined 
              ? student.status 
              : student.Status !== undefined 
                ? student.Status 
                : null;
            return status === true || status === 'true';
          }).length}
          onPageChange={studentCrud.handlePageChange}
          onRowsPerPageChange={studentCrud.handleRowsPerPageChange}
          onView={handleViewDetail}
          onDelete={handleDeleteClick}
              emptyMessage="Chưa có trẻ em nào đã được duyệt."
            />
          </div>
        </>
      )}

      {activeTab === 1 && (
        <>
          <ManagementSearchSection
            keyword={unverifiedSearchKeyword}
            onKeywordChange={(e) => setUnverifiedSearchKeyword(e.target.value)}
            onSearch={() => loadUnverifiedStudents()}
            onClear={() => {
              setUnverifiedSearchKeyword('');
              setUnverifiedFilters({ schoolId: '', studentLevelId: '' });
              loadUnverifiedStudents();
            }}
            placeholder="Tìm kiếm theo tên trẻ em hoặc phụ huynh..."
          >
            <Box className={styles.filterRow}>
              <FormControl size="small" className={styles.filterControl}>
                <InputLabel id="unverified-school-filter-label" shrink>
                  Trường học
                </InputLabel>
                <Select
                  labelId="unverified-school-filter-label"
                  value={unverifiedFilters.schoolId || ''}
                  label="Trường học"
                  notched
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <span className={styles.filterPlaceholder}>Tất cả trường học</span>;
                    }
                    const option = schoolOptions.find((opt) => opt.value === selected);
                    return option?.label || 'Trường học không xác định';
                  }}
                  onChange={(event) => {
                    setUnverifiedFilters(prev => ({ ...prev, schoolId: event.target.value || '' }));
                    loadUnverifiedStudents();
                  }}
                >
                  <MenuItem value="">
                    <em>Tất cả trường học</em>
                  </MenuItem>
                  {schoolOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" className={styles.filterControl}>
                <InputLabel id="unverified-level-filter-label" shrink>
                  Cấp độ
                </InputLabel>
                <Select
                  labelId="unverified-level-filter-label"
                  value={unverifiedFilters.studentLevelId || ''}
                  label="Cấp độ"
                  notched
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <span className={styles.filterPlaceholder}>Tất cả cấp độ</span>;
                    }
                    const option = studentLevelOptions.find((opt) => opt.value === selected);
                    return option?.label || 'Cấp độ không xác định';
                  }}
                  onChange={(event) => {
                    setUnverifiedFilters(prev => ({ ...prev, studentLevelId: event.target.value || '' }));
                    loadUnverifiedStudents();
                  }}
                >
                  <MenuItem value="">
                    <em>Tất cả cấp độ</em>
                  </MenuItem>
                  {studentLevelOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {renderDependencyState()}
          </ManagementSearchSection>

        <div className={styles.tableContainer}>
          <DataTable
              data={unverifiedStudents.filter(student => {
                // Filter by keyword
                if (unverifiedSearchKeyword.trim()) {
                  const keyword = unverifiedSearchKeyword.toLowerCase();
                  const nameMatch = (student.name || '').toLowerCase().includes(keyword);
                  const parentMatch = (student.userName || student.user?.name || '').toLowerCase().includes(keyword);
                  if (!nameMatch && !parentMatch) {
                    return false;
                  }
                }
                
                // Filter by school
                if (unverifiedFilters.schoolId) {
                  const studentSchoolId = student.schoolId || student.SchoolId;
                  if (studentSchoolId !== unverifiedFilters.schoolId) {
                    return false;
                  }
                }
                
                // Filter by level
                if (unverifiedFilters.studentLevelId) {
                  const studentLevelId = student.studentLevelId || student.StudentLevelId;
                  if (studentLevelId !== unverifiedFilters.studentLevelId) {
                    return false;
                  }
                }
                
                return true;
              })}
            columns={unverifiedColumns}
            loading={loadingUnverified}
            page={0}
            rowsPerPage={unverifiedStudents.length || 10}
              totalCount={unverifiedStudents.filter(student => {
                if (unverifiedSearchKeyword.trim()) {
                  const keyword = unverifiedSearchKeyword.toLowerCase();
                  const nameMatch = (student.name || '').toLowerCase().includes(keyword);
                  const parentMatch = (student.userName || student.user?.name || '').toLowerCase().includes(keyword);
                  if (!nameMatch && !parentMatch) return false;
                }
                if (unverifiedFilters.schoolId) {
                  const studentSchoolId = student.schoolId || student.SchoolId;
                  if (studentSchoolId !== unverifiedFilters.schoolId) return false;
                }
                if (unverifiedFilters.studentLevelId) {
                  const studentLevelId = student.studentLevelId || student.StudentLevelId;
                  if (studentLevelId !== unverifiedFilters.studentLevelId) return false;
                }
                return true;
              }).length}
            onPageChange={() => {}}
            onRowsPerPageChange={() => {}}
            onView={handleViewDetail}
              emptyMessage="Không có trẻ em nào chưa được duyệt."
        />
      </div>
        </>
      )}

      {activeTab === 2 && (
        <>
          <ManagementSearchSection
            keyword={approvedDocsSearchKeyword}
            onKeywordChange={(e) => setApprovedDocsSearchKeyword(e.target.value)}
            onSearch={() => loadApprovedWithUnverifiedDocs()}
            onClear={() => {
              setApprovedDocsSearchKeyword('');
              setApprovedDocsFilters({ schoolId: '', studentLevelId: '' });
              loadApprovedWithUnverifiedDocs();
            }}
            placeholder="Tìm kiếm theo tên trẻ em hoặc phụ huynh..."
          >
            <Box className={styles.filterRow}>
              <FormControl size="small" className={styles.filterControl}>
                <InputLabel id="approved-docs-school-filter-label" shrink>
                  Trường học
                </InputLabel>
                <Select
                  labelId="approved-docs-school-filter-label"
                  value={approvedDocsFilters.schoolId || ''}
                  label="Trường học"
                  notched
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <span className={styles.filterPlaceholder}>Tất cả trường học</span>;
                    }
                    const option = schoolOptions.find((opt) => opt.value === selected);
                    return option?.label || 'Trường học không xác định';
                  }}
                  onChange={(event) => {
                    setApprovedDocsFilters(prev => ({ ...prev, schoolId: event.target.value || '' }));
                  }}
                >
                  <MenuItem value="">
                    <em>Tất cả trường học</em>
                  </MenuItem>
                  {schoolOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" className={styles.filterControl}>
                <InputLabel id="approved-docs-level-filter-label" shrink>
                  Cấp độ
                </InputLabel>
                <Select
                  labelId="approved-docs-level-filter-label"
                  value={approvedDocsFilters.studentLevelId || ''}
                  label="Cấp độ"
                  notched
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <span className={styles.filterPlaceholder}>Tất cả cấp độ</span>;
                    }
                    const option = studentLevelOptions.find((opt) => opt.value === selected);
                    return option?.label || 'Cấp độ không xác định';
                  }}
                  onChange={(event) => {
                    setApprovedDocsFilters(prev => ({ ...prev, studentLevelId: event.target.value || '' }));
                  }}
                >
                  <MenuItem value="">
                    <em>Tất cả cấp độ</em>
                  </MenuItem>
                  {studentLevelOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {renderDependencyState()}
          </ManagementSearchSection>

          <div className={styles.tableContainer}>
            <DataTable
              data={approvedWithUnverifiedDocs.filter(student => {
                // Filter by keyword
                if (approvedDocsSearchKeyword.trim()) {
                  const keyword = approvedDocsSearchKeyword.toLowerCase();
                  const nameMatch = (student.name || '').toLowerCase().includes(keyword);
                  const parentMatch = (student.userName || student.user?.name || '').toLowerCase().includes(keyword);
                  if (!nameMatch && !parentMatch) {
                    return false;
                  }
                }
                
                // Filter by school
                if (approvedDocsFilters.schoolId) {
                  const studentSchoolId = student.schoolId || student.SchoolId;
                  if (studentSchoolId !== approvedDocsFilters.schoolId) {
                    return false;
                  }
                }
                
                // Filter by level
                if (approvedDocsFilters.studentLevelId) {
                  const studentLevelId = student.studentLevelId || student.StudentLevelId;
                  if (studentLevelId !== approvedDocsFilters.studentLevelId) {
                    return false;
                  }
                }
                
                return true;
              })}
              columns={approvedWithDocsColumns}
              loading={loadingApprovedWithDocs}
              page={0}
              rowsPerPage={approvedWithUnverifiedDocs.length || 10}
              totalCount={approvedWithUnverifiedDocs.filter(student => {
                if (approvedDocsSearchKeyword.trim()) {
                  const keyword = approvedDocsSearchKeyword.toLowerCase();
                  const nameMatch = (student.name || '').toLowerCase().includes(keyword);
                  const parentMatch = (student.userName || student.user?.name || '').toLowerCase().includes(keyword);
                  if (!nameMatch && !parentMatch) return false;
                }
                if (approvedDocsFilters.schoolId) {
                  const studentSchoolId = student.schoolId || student.SchoolId;
                  if (studentSchoolId !== approvedDocsFilters.schoolId) return false;
                }
                if (approvedDocsFilters.studentLevelId) {
                  const studentLevelId = student.studentLevelId || student.StudentLevelId;
                  if (studentLevelId !== approvedDocsFilters.studentLevelId) return false;
                }
                return true;
              }).length}
              onPageChange={() => {}}
              onRowsPerPageChange={() => {}}
              onView={handleViewDetail}
              emptyMessage="Không có trẻ em nào đã duyệt nhưng có tài liệu chưa duyệt."
          />
        </div>
        </>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={detailDialog.open}
        onClose={() => {
          setDetailDialog({ open: false, student: null, loading: false });
          setDocumentImageUrls({});
          setLoadingDocumentImageId(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" fontWeight="bold">
              Chi tiết trẻ em
            </Typography>
            <IconButton
              size="small"
              onClick={() => {
                setDetailDialog({ open: false, student: null, loading: false });
                setDocumentImageUrls({});
                setLoadingDocumentImageId(null);
              }}
            >
              ×
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailDialog.loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress size={40} />
            </Box>
          ) : detailDialog.student ? (
            <Box>
              {/* Header with Avatar and Name */}
              <Box display="flex" alignItems="center" gap={3} mb={3}>
                <Avatar
                  src={detailDialog.student.image && detailDialog.student.image !== 'string' ? detailDialog.student.image : undefined}
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'primary.main',
                    fontSize: '2rem',
                    fontWeight: 'bold'
                  }}
                >
                  {getInitials(detailDialog.student.name)}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {detailDialog.student.name || 'Chưa có tên'}
                  </Typography>
                  <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                    <Chip
                      icon={detailDialog.student.status ? <VerifiedIcon /> : <PendingIcon />}
                      label={detailDialog.student.status ? 'Đã duyệt' : 'Chờ duyệt'}
                      color={detailDialog.student.status ? 'success' : 'warning'}
                      size="small"
                    />
                    {detailDialog.student.studentLevelName && (
                      <Chip
                        label={detailDialog.student.studentLevelName}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Box>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Student Information */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      <CalendarIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      Ngày sinh
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(detailDialog.student.dateOfBirth)}
                      {detailDialog.student.dateOfBirth && (
                        <span style={{ color: '#666', marginLeft: '8px' }}>
                          ({calculateAge(detailDialog.student.dateOfBirth)} tuổi)
                        </span>
                      )}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      <PersonIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      Phụ huynh
                    </Typography>
                    <Typography variant="body1">
                      {detailDialog.student.userName || detailDialog.student.user?.name || 'Chưa có'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      <SchoolIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      Trường học
                    </Typography>
                    <Typography variant="body1">
                      {detailDialog.student.schoolName || detailDialog.student.school?.name || 'Chưa có'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      <BusinessIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      Chi nhánh
                    </Typography>
                    <Typography variant="body1">
                      {detailDialog.student.branchName || detailDialog.student.branch?.branchName || 'Chưa có'}
                    </Typography>
                  </Box>
                </Grid>
                
                {detailDialog.student.studentLevelName && (
                  <Grid item xs={12} sm={6}>
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                        Cấp độ trẻ em
                      </Typography>
                      <Typography variant="body1">
                        {detailDialog.student.studentLevelName}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      Ngày tạo
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(detailDialog.student.createdTime)}
                    </Typography>
                  </Box>
                </Grid>
                
                {detailDialog.student.note && detailDialog.student.note !== 'string' && (
                  <Grid item xs={12}>
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                        Ghi chú
                      </Typography>
                      <Typography variant="body1">
                        {detailDialog.student.note}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
              
              {/* Documents Section */}
              {detailDialog.student.documents && detailDialog.student.documents.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <DocumentIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                      <Typography variant="h6" fontWeight="bold">
                        Tài liệu xác minh ({detailDialog.student.documents.length})
                      </Typography>
                    </Box>
                    <Box display="flex" flexDirection="column" gap={2}>
                      {detailDialog.student.documents.map((doc, index) => (
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
                          <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
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
                            
                              <Box display="flex" gap={1} alignItems="center">
                                {!!doc.id && (
                                  <Tooltip title="Xem ảnh tài liệu">
                                    <span>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleViewDocumentImage(doc.id)}
                                        disabled={loadingDocumentImageId === doc.id}
                                        sx={{
                                          color: 'primary.main',
                                          '&:hover': {
                                            bgcolor: 'primary.50'
                                          }
                                        }}
                                      >
                                        {loadingDocumentImageId === doc.id ? (
                                          <CircularProgress size={18} />
                                        ) : (
                                          <ViewIcon fontSize="small" />
                                        )}
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                )}

                                {!!doc.id && !!documentImageUrls[doc.id] && (
                                  <Tooltip title="Mở ảnh trong tab mới">
                                    <IconButton
                                      size="small"
                                      onClick={() => window.open(documentImageUrls[doc.id], '_blank')}
                                      sx={{
                                        color: 'primary.main',
                                        '&:hover': {
                                          bgcolor: 'primary.50'
                                        }
                                      }}
                                    >
                                      <OpenInNewIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                
                                {/* Approve/Reject buttons */}
                                {!doc.verified && (
                                  <Box display="flex" gap={0.5}>
                                    <Tooltip title="Phê duyệt tài liệu">
                                      <IconButton
                                        size="small"
                                        color="success"
                                        onClick={() => handleApproveDocument(doc.id, true)}
                                        disabled={approvingDocumentId === doc.id}
                                        sx={{
                                          '&:hover': {
                                            bgcolor: 'success.50'
                                          }
                                        }}
                                      >
                                        <ApproveIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Từ chối tài liệu">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleRejectDocumentClick(doc, detailDialog.student)}
                                        disabled={approvingDocumentId === doc.id}
                                        sx={{
                                          '&:hover': {
                                            bgcolor: 'error.50'
                                          }
                                        }}
                                      >
                                        <RejectIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                            
                            {/* Display document image */}
                            {!!doc.id && !!documentImageUrls[doc.id] && (
                              <Box
                                sx={{
                                  mt: 2,
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                  bgcolor: 'grey.50',
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  minHeight: 200,
                                  maxHeight: 400,
                                  cursor: 'pointer',
                                  position: 'relative',
                                  '&:hover': {
                                    boxShadow: 2
                                  }
                                }}
                                onClick={() => window.open(documentImageUrls[doc.id], '_blank')}
                              >
                                <img
                                  src={documentImageUrls[doc.id]}
                                  alt={`${getDocumentTypeLabel(doc.type)} - ${doc.issuedBy || ''}`}
                                  style={{
                                    width: '100%',
                                    height: 'auto',
                                    maxHeight: 400,
                                    objectFit: 'contain',
                                    display: documentImageLoadErrors[doc.id] ? 'none' : 'block'
                                  }}
                                  onLoad={() => {
                                    setDocumentImageLoadErrors((prev) => ({
                                      ...prev,
                                      [doc.id]: false
                                    }));
                                  }}
                                  onError={() => {
                                    setDocumentImageLoadErrors((prev) => ({
                                      ...prev,
                                      [doc.id]: true
                                    }));
                                  }}
                                />

                                {documentImageLoadErrors[doc.id] && (
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      position: 'absolute',
                                      color: 'text.secondary',
                                      p: 2,
                                      textAlign: 'center'
                                    }}
                                  >
                                    Không thể tải ảnh tài liệu. Bấm nút xem để thử lại.
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDetailDialog({ open: false, student: null, loading: false });
              setDocumentImageUrls({});
              setDocumentImageLoadErrors({});
              setLoadingDocumentImageId(null);
            }}
          >
            Đóng
          </Button>
          {detailDialog.student && !detailDialog.student.status && (
            <Button
              variant="contained"
              color="success"
              startIcon={<ApproveIcon />}
              onClick={handleApproveFromDetail}
              disabled={approvingStudentId === detailDialog.student?.id}
            >
              Chấp nhận
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Approve Confirm Dialog */}
      <ConfirmDialog
        open={approveConfirmDialog.open}
        onClose={() => setApproveConfirmDialog({ open: false, student: null })}
        onConfirm={handleApproveConfirm}
        title="Xác nhận duyệt trẻ em"
        description={
          approveConfirmDialog.student
            ? `Bạn có chắc chắn muốn duyệt trẻ em "${approveConfirmDialog.student.name}"? Trẻ em này sẽ được chuyển sang danh sách đã duyệt.`
            : ''
        }
        confirmText="Duyệt"
        cancelText="Hủy"
        confirmColor="success"
      />
      
      {/* Reject Document Confirm Dialog */}
      <ConfirmDialog
        open={rejectConfirmDialog.open}
        onClose={() => setRejectConfirmDialog({ open: false, document: null, student: null })}
        onConfirm={handleRejectDocumentConfirm}
        title="Xác nhận từ chối tài liệu"
        description={
          rejectConfirmDialog.document
            ? `Bạn có chắc chắn muốn từ chối tài liệu "${getDocumentTypeLabel(rejectConfirmDialog.document.type)}"? Tài liệu này sẽ bị đánh dấu là không được phê duyệt.`
            : ''
        }
        confirmText="Từ chối"
        cancelText="Hủy"
        confirmColor="error"
      />
      
      {/* Delete Student Confirm Dialog */}
      <ConfirmDialog
        open={deleteConfirmDialog.open}
        onClose={() => setDeleteConfirmDialog({ open: false, student: null })}
        onConfirm={handleDeleteStudent}
        title="Xác nhận xóa học sinh"
        description={
          deleteConfirmDialog.student
            ? `Bạn có chắc chắn muốn xóa học sinh "${deleteConfirmDialog.student.name}"? Hành động này không thể hoàn tác.`
            : ''
        }
        confirmText="Xóa"
        cancelText="Hủy"
        confirmColor="error"
        loading={deletingStudentId !== null}
      />
    </div>
  );
};

export default StudentManagement;



