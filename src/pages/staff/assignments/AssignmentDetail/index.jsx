import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Alert,
  Typography,
  Button,
  Divider,
  Paper,
  Chip,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Checkbox,
  FormControlLabel,
  Collapse,
  InputAdornment,
} from '@mui/material';
import { 
  ArrowBack,
  CalendarToday,
  AccessTime,
  MeetingRoom,
  Business,
  Person,
  CheckCircle,
  PhotoLibrary,
  Visibility as VisibilityIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Event as EventIcon,
  Phone as PhoneIcon,
  AccountCircle as AccountCircleIcon,
  School as SchoolIcon,
  LocalOffer as ServiceIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import ContentLoading from '../../../../components/Common/ContentLoading';
import ConfirmDialog from '../../../../components/Common/ConfirmDialog';
import ImageUpload from '../../../../components/Common/ImageUpload';
import DataTable from '../../../../components/Common/DataTable';
import studentSlotService from '../../../../services/studentSlot.service';
import activityService from '../../../../services/activity.service';
import activityTypeService from '../../../../services/activityType.service';
import imageService from '../../../../services/image.service';
import userService from '../../../../services/user.service';
import studentService from '../../../../services/student.service';
import familyProfileService from '../../../../services/familyProfile.service';
import serviceService from '../../../../services/service.service';
import { useApp } from '../../../../contexts/AppContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { formatDateOnlyUTC7, formatDateTimeUTC7 } from '../../../../utils/dateHelper';
import styles from './AssignmentDetail.module.css';

const AssignmentDetail = () => {
  const { slotId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showGlobalError } = useApp();
  const { user } = useAuth();
  
  const [slot, setSlot] = useState(null);
  const [studentsList, setStudentsList] = useState([]);
  const [filteredStudentsList, setFilteredStudentsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Activities state - theo từng học sinh
  const [activitiesByStudent, setActivitiesByStudent] = useState({});
  const [loadingActivities, setLoadingActivities] = useState({});
  
  // Check-in state
  const [checkedStudents, setCheckedStudents] = useState(new Set());
  const [checkingIn, setCheckingIn] = useState(new Set());
  const [checkinDeleteDialogOpen, setCheckinDeleteDialogOpen] = useState(false);
  const [checkinToDelete, setCheckinToDelete] = useState(null);
  const [deletingCheckin, setDeletingCheckin] = useState(false);
  
  // Activity types
  const [activityTypes, setActivityTypes] = useState([]);
  const [loadingActivityTypes, setLoadingActivityTypes] = useState(false);
  
  // Activity management dialogs
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [activityDetailDialogOpen, setActivityDetailDialogOpen] = useState(false);
  const [activityEditDialogOpen, setActivityEditDialogOpen] = useState(false);
  const [activityDeleteDialogOpen, setActivityDeleteDialogOpen] = useState(false);
  const [selectedStudentSlot, setSelectedStudentSlot] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  
  // Activity form
  const [activityForm, setActivityForm] = useState({
    activityTypeId: '',
    note: '',
    imageFile: null
  });
  
  // Loading states
  const [submittingActivity, setSubmittingActivity] = useState(false);
  const [deletingActivity, setDeletingActivity] = useState(false);

  // Student detail and guardian dialog state
  const [studentDetailDialogOpen, setStudentDetailDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingStudentDetail, setLoadingStudentDetail] = useState(false);
  const [studentDetail, setStudentDetail] = useState(null);
  const [guardians, setGuardians] = useState([]);
  const [loadingGuardians, setLoadingGuardians] = useState(false);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);


  useEffect(() => {
    const loadData = async () => {
      if (!slotId) {
        setError('Thiếu thông tin cần thiết');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load activity types
        await fetchActivityTypes();

        // Lấy thông tin branchSlot (API trả về BranchSlot với studentSlots array)
        // Load tất cả các trang để đảm bảo tìm được slot
        const branchSlots = await studentSlotService.getAllStaffSlots({
          upcomingOnly: false,
          pageSize: 100
        });
        
        const foundBranchSlot = branchSlots.find(bs => bs.id === slotId);

        if (!foundBranchSlot) {
          setError('Không tìm thấy ca giữ trẻ này');
          navigate('/staff/assignments');
          return;
        }

        setSlot(foundBranchSlot);
        
        // Load danh sách học sinh từ studentSlots của branchSlot
        await loadStudents(foundBranchSlot);
      } catch (err) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải thông tin';
        setError(errorMessage);
        showGlobalError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slotId, navigate, showGlobalError]);

  const fetchActivityTypes = async () => {
    try {
      setLoadingActivityTypes(true);
      const data = await activityTypeService.getAllActivityTypes();
      setActivityTypes(Array.isArray(data) ? data : []);
    } catch (err) {

    } finally {
      setLoadingActivityTypes(false);
    }
  };

  const loadStudents = async (branchSlotData) => {
    if (!branchSlotData) return;

    setLoadingStudents(true);
    try {
      // Lấy studentSlots từ branchSlot (đã có sẵn trong response)
      const studentSlots = branchSlotData.studentSlots || [];
      
      // Transform studentSlots thành format phù hợp với columns
      const transformedSlots = studentSlots.map(studentSlot => {
        return {
          id: studentSlot.studentSlotId, // studentSlotId
          studentId: studentSlot.student?.id,
          studentName: studentSlot.student?.name || 'Chưa có tên',
          studentImage: studentSlot.student?.image,
          parentName: studentSlot.parent?.name || 'Chưa có thông tin',
          parentImage: studentSlot.parent?.image,
          parentNote: studentSlot.parentNote || '',
          status: studentSlot.status || 'Booked',
          date: studentSlot.date, // Ngày cụ thể của booking
          // Giữ lại toàn bộ data để dùng sau
          ...studentSlot
        };
      });

      // Lọc chỉ lấy Booked và Completed (có thể thêm Completed nếu cần)
      const activeSlots = transformedSlots.filter(s => 
        s.status === 'Booked' || s.status === 'Completed' || s.status === 'booked' || s.status === 'completed'
      );

      setStudentsList(activeSlots);
      setFilteredStudentsList(activeSlots);
      
      // Load activities for all students
      activeSlots.forEach(studentSlot => {
        if (studentSlot.id) {
          loadActivitiesForStudent(studentSlot.id);
        }
      });
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải danh sách học sinh';
      showGlobalError(errorMessage);

    } finally {
      setLoadingStudents(false);
    }
  };

  // Filter students by search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredStudentsList(studentsList);
    } else {
      const filtered = studentsList.filter(slot => {
        const studentName = (slot.studentName || '').toLowerCase();
        const parentName = (slot.parentName || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return studentName.includes(search) || parentName.includes(search);
      });
      setFilteredStudentsList(filtered);
    }
    // Reset to first page when search changes
    setPage(0);
  }, [searchTerm, studentsList]);

  // Pagination handlers
  const handlePageChange = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // Paginated data
  const paginatedStudents = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredStudentsList.slice(startIndex, endIndex);
  }, [filteredStudentsList, page, rowsPerPage]);

  // Load activities for a student
  const loadActivitiesForStudent = useCallback(async (studentSlotId) => {
    if (loadingActivities[studentSlotId]) {
      return;
    }
    
    setLoadingActivities(prev => ({ ...prev, [studentSlotId]: true }));
    try {
      // Load all pages to ensure we get all activities
      const activities = await activityService.getAllActivitiesForStudentSlot({
        StudentSlotId: studentSlotId,
        pageSize: 100
      });
      
      setActivitiesByStudent(prev => ({
        ...prev,
        [studentSlotId]: activities
      }));

      // Update checked students based on check-in activities
      const hasCheckin = activities.some(activity => 
        activity.activityType?.name === 'Điểm danh vào' && 
        !activity.isDeleted
      );
      
      if (hasCheckin) {
        // Find the student slot to get studentId
        const slot = studentsList.find(s => s.id === studentSlotId);
        if (slot?.studentId) {
          setCheckedStudents(prev => new Set(prev).add(slot.studentId));
        }
      }
    } catch (err) {

      setActivitiesByStudent(prev => ({
        ...prev,
        [studentSlotId]: []
      }));
    } finally {
      setLoadingActivities(prev => ({ ...prev, [studentSlotId]: false }));
    }
  }, [loadingActivities, studentsList]);

  // Find check-in activity for a student slot
  const findCheckinActivity = useCallback((studentSlotId) => {
    const activities = activitiesByStudent[studentSlotId] || [];
    return activities.find(activity => 
      activity.activityType?.name === 'Điểm danh vào' && 
      !activity.isDeleted
    );
  }, [activitiesByStudent]);

  // Activity handlers - must be defined before columns
  const handleCreateActivity = useCallback((slot) => {
    setSelectedStudentSlot(slot);
    setActivityForm({
      activityTypeId: '',
      note: '',
      imageFile: null
    });
    setActivityDialogOpen(true);
  }, []);

  // Handle view student detail
  const handleViewStudentDetail = useCallback(async (slot) => {
    if (!slot.studentId) {
      toast.error('Không tìm thấy ID học sinh', {
        position: 'top-right',
        autoClose: 4000
      });
      return;
    }

    setSelectedStudent(slot);
    setStudentDetailDialogOpen(true);
    setLoadingStudentDetail(false); // Không cần loading vì dùng data từ slot
    setLoadingGuardians(true);
    setLoadingServices(false); // Services chỉ lấy từ slot, không fetch API
    
    // Sử dụng thông tin từ slot thay vì fetch từ API (nhân viên không có quyền)
    setStudentDetail({
      name: slot.studentName,
      dateOfBirth: null, // Không có trong slot
      schoolName: null, // Không có trong slot
      note: slot.parentNote || null
    });
    setGuardians([]);
    
    // Services chỉ lấy từ slot data (API có thể yêu cầu quyền mà nhân viên không có)
    const servicesFromSlot = slot.services || slot.Services || slot.student?.services || slot.student?.Services || [];
    setServices(Array.isArray(servicesFromSlot) ? servicesFromSlot : []);

    try {
      // Chỉ fetch guardians (API này đã biết thành công)
      const guardiansData = await familyProfileService.getByStudentId(slot.studentId);
      setGuardians(Array.isArray(guardiansData) ? guardiansData : []);
    } catch (err) {
      // Xử lý lỗi một cách an toàn, không trigger redirect
      // Chỉ log warning, không throw error để tránh axios interceptor redirect
      const errorStatus = err?.response?.status;
      if (errorStatus === 401 || errorStatus === 403) {
        // Nếu là lỗi quyền, chỉ set empty array, không throw

        setGuardians([]);
      } else {
        // Các lỗi khác cũng chỉ set empty array

        setGuardians([]);
      }
    } finally {
      setLoadingGuardians(false);
    }
  }, []);

  // Handle close student detail dialog
  const handleCloseStudentDetailDialog = useCallback(() => {
    setStudentDetailDialogOpen(false);
    setSelectedStudent(null);
    setStudentDetail(null);
    setGuardians([]);
    setServices([]);
  }, []);

  // Check-in handler
  const handleCheckinToggle = useCallback(async (slot, checked) => {
    if (!slot.studentId) {
      toast.error('Không tìm thấy ID học sinh', {
        position: 'top-right',
        autoClose: 4000
      });
      return;
    }

    if (checked) {
      setCheckingIn(prev => new Set(prev).add(slot.studentId));
      try {
        await activityService.checkinStaff(slot.studentId);
        setCheckedStudents(prev => new Set(prev).add(slot.studentId));
        
        // Reload activities to show new check-in
        if (slot.id) {
          setActivitiesByStudent(prev => {
            const newState = { ...prev };
            delete newState[slot.id];
            return newState;
          });
          await loadActivitiesForStudent(slot.id);
        }
        
        toast.success(`Đã điểm danh cho ${slot.studentName || 'học sinh'}`, {
          position: 'top-right',
          autoClose: 3000
        });
      } catch (err) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Không thể điểm danh';
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 4000
        });
      } finally {
        setCheckingIn(prev => {
          const newSet = new Set(prev);
          newSet.delete(slot.studentId);
          return newSet;
        });
      }
    } else {
      // Uncheck: Find and delete check-in activity if exists
      const checkinActivity = findCheckinActivity(slot.id);
      
      if (checkinActivity) {
        // Check if current user created this activity (can only delete own activities)
        if (checkinActivity.createdById === user?.id) {
          // Open confirmation dialog
          setCheckinToDelete({ activity: checkinActivity, slot });
          setCheckinDeleteDialogOpen(true);
        } else {
          toast.error('Bạn chỉ có thể xóa điểm danh do chính mình tạo', {
            position: 'top-right',
            autoClose: 4000
          });
          // Re-check the checkbox
          setCheckedStudents(prev => new Set(prev).add(slot.studentId));
        }
      } else {
        // No check-in activity, just uncheck
        setCheckedStudents(prev => {
          const newSet = new Set(prev);
          newSet.delete(slot.studentId);
          return newSet;
        });
      }
    }
  }, [findCheckinActivity, loadActivitiesForStudent, user?.id]);

  // Columns definition
  const columns = useMemo(() => [
    {
      key: 'checkin',
      header: 'Điểm danh',
      align: 'left',
      render: (_, slot) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Checkbox
            checked={checkedStudents.has(slot.studentId)}
            onChange={(e) => handleCheckinToggle(slot, e.target.checked)}
            disabled={checkingIn.has(slot.studentId)}
            color="primary"
            size="small"
          />
          {checkingIn.has(slot.studentId) && (
            <CircularProgress size={16} />
          )}
        </Box>
      )
    },
    {
      key: 'studentName',
      header: 'Tên học sinh',
      render: (_, slot) => (
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          {slot.studentName || 'Chưa có tên'}
        </Typography>
      )
    },
    {
      key: 'parentName',
      header: 'Phụ huynh',
      render: (_, slot) => (
        <Typography variant="body2" color="text.secondary">
          {slot.parentName || 'Chưa có thông tin'}
        </Typography>
      )
    },
    {
      key: 'parentNote',
      header: 'Ghi chú',
      render: (_, slot) => (
        slot.parentNote ? (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ fontStyle: 'italic', maxWidth: 300 }}
            noWrap
          >
            {slot.parentNote}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.disabled">
            -
          </Typography>
        )
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      align: 'left',
      render: (_, slot) => (
        <Chip
          label={slot.status === 'Booked' || slot.status === 'booked' ? 'Đã đăng ký' : slot.status}
          color={slot.status === 'Booked' || slot.status === 'booked' ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'center',
      render: (_, slot) => {
        const studentSlotId = slot.id;
        const activities = activitiesByStudent[studentSlotId] || [];
        const isLoadingActivities = loadingActivities[studentSlotId];
        
        return (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            <Tooltip title="Xem chi tiết học sinh">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewStudentDetail(slot);
                }}
                color="info"
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Tạo hoạt động">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateActivity(slot);
                }}
                color="primary"
              >
                <AddPhotoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {activities.length > 0 && (
              <Chip
                label={activities.length}
                size="small"
                color="primary"
                sx={{
                  minWidth: 28,
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 600
                }}
              />
            )}
          </Box>
        );
      }
    }
  ], [checkedStudents, checkingIn, activitiesByStudent, loadingActivities, handleCheckinToggle, handleCreateActivity, handleViewStudentDetail]);

  // Confirm delete check-in
  const handleConfirmDeleteCheckin = async () => {
    if (!checkinToDelete?.activity) return;

    setDeletingCheckin(true);
    try {
      await activityService.deleteActivity(checkinToDelete.activity.id);
      
      toast.success('Đã xóa điểm danh', {
        position: 'top-right',
        autoClose: 3000
      });
      
      // Update checked students
      if (checkinToDelete.slot?.studentId) {
        setCheckedStudents(prev => {
          const newSet = new Set(prev);
          newSet.delete(checkinToDelete.slot.studentId);
          return newSet;
        });
      }
      
      // Reload activities
      if (checkinToDelete.slot?.id) {
        setActivitiesByStudent(prev => {
          const newState = { ...prev };
          delete newState[checkinToDelete.slot.id];
          return newState;
        });
        await loadActivitiesForStudent(checkinToDelete.slot.id);
      }
      
      setCheckinDeleteDialogOpen(false);
      setCheckinToDelete(null);
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể xóa điểm danh';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 4000
      });
    } finally {
      setDeletingCheckin(false);
    }
  };

  const handleCloseCheckinDeleteDialog = () => {
    if (!deletingCheckin) {
      const slotToRevert = checkinToDelete?.slot;
      setCheckinDeleteDialogOpen(false);
      setCheckinToDelete(null);
      
      // Re-check the checkbox if canceled
      if (slotToRevert?.studentId) {
        setCheckedStudents(prev => new Set(prev).add(slotToRevert.studentId));
      }
    }
  };

  // Activity handlers
  const handleViewActivity = async (activity) => {
    try {
      const fullActivity = await activityService.getActivityById(activity.id);
      setSelectedActivity(fullActivity);
      setActivityDetailDialogOpen(true);
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải chi tiết hoạt động';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 4000
      });
    }
  };

  const handleEditActivity = (activity) => {
    setSelectedActivity(activity);
    setActivityForm({
      activityTypeId: activity.activityTypeId || '',
      note: activity.note || '',
      imageFile: null
    });
    setActivityEditDialogOpen(true);
  };

  const handleDeleteActivity = (activity) => {
    setSelectedActivity(activity);
    setActivityDeleteDialogOpen(true);
  };

  const handleCloseActivityDialog = () => {
    setActivityDialogOpen(false);
    setSelectedStudentSlot(null);
    setActivityForm({
      activityTypeId: '',
      note: '',
      imageFile: null
    });
  };

  const handleCloseActivityDetailDialog = () => {
    setActivityDetailDialogOpen(false);
    setSelectedActivity(null);
  };

  const handleCloseActivityEditDialog = () => {
    setActivityEditDialogOpen(false);
    setSelectedActivity(null);
    setActivityForm({
      activityTypeId: '',
      note: '',
      imageFile: null
    });
  };

  const handleCloseActivityDeleteDialog = () => {
    setActivityDeleteDialogOpen(false);
    setSelectedActivity(null);
  };

  const handleSubmitActivity = async () => {
    if (!selectedStudentSlot) {
      toast.error('Vui lòng chọn học sinh', {
        position: 'top-right',
        autoClose: 4000
      });
      return;
    }

    if (!activityForm.activityTypeId) {
      toast.error('Vui lòng chọn loại hoạt động', {
        position: 'top-right',
        autoClose: 4000
      });
      return;
    }

    if (!user?.id) {
      toast.error('Không thể xác định người dùng', {
        position: 'top-right',
        autoClose: 4000
      });
      return;
    }

    setSubmittingActivity(true);
    try {
      let imageUrl = '';

      if (activityForm.imageFile) {
        try {
          imageUrl = await imageService.uploadImage(activityForm.imageFile);
          if (!imageUrl) {
            throw new Error('Không nhận được URL ảnh từ server');
          }
        } catch (uploadError) {
          const errorMessage = uploadError?.response?.data?.message || uploadError?.message || 'Không thể upload ảnh';
          toast.error(errorMessage, {
            position: 'top-right',
            autoClose: 4000
          });
          throw uploadError;
        }
      }

      await activityService.createActivity({
        activityTypeId: activityForm.activityTypeId,
        studentSlotId: selectedStudentSlot.id,
        note: activityForm.note || '',
        imageUrl: imageUrl,
        createdById: user.id
      });

      toast.success('Tạo hoạt động thành công!', {
        position: 'top-right',
        autoClose: 3000
      });

      handleCloseActivityDialog();
      
      // Reload activities for this student
      if (selectedStudentSlot.id) {
        setActivitiesByStudent(prev => {
          const newState = { ...prev };
          delete newState[selectedStudentSlot.id];
          return newState;
        });
        await loadActivitiesForStudent(selectedStudentSlot.id);
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tạo hoạt động';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 4000
      });

    } finally {
      setSubmittingActivity(false);
    }
  };

  const handleSubmitEditActivity = async () => {
    if (!selectedActivity) return;

    if (!activityForm.activityTypeId) {
      toast.error('Vui lòng chọn loại hoạt động', {
        position: 'top-right',
        autoClose: 4000
      });
      return;
    }

    setSubmittingActivity(true);
    try {
      let imageUrl = selectedActivity.imageUrl || '';

      if (activityForm.imageFile) {
        try {
          imageUrl = await imageService.uploadImage(activityForm.imageFile);
          if (!imageUrl) {
            throw new Error('Không nhận được URL ảnh từ server');
          }
        } catch (uploadError) {
          const errorMessage = uploadError?.response?.data?.message || uploadError?.message || 'Không thể upload ảnh';
          toast.error(errorMessage, {
            position: 'top-right',
            autoClose: 4000
          });
          throw uploadError;
        }
      }

      await activityService.updateActivity(selectedActivity.id, {
        activityTypeId: activityForm.activityTypeId,
        note: activityForm.note || '',
        imageUrl: imageUrl
      });

      toast.success('Cập nhật hoạt động thành công!', {
        position: 'top-right',
        autoClose: 3000
      });

      handleCloseActivityEditDialog();
      
      // Reload activities
      if (selectedActivity.studentSlotId) {
        setActivitiesByStudent(prev => {
          const newState = { ...prev };
          delete newState[selectedActivity.studentSlotId];
          return newState;
        });
        await loadActivitiesForStudent(selectedActivity.studentSlotId);
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể cập nhật hoạt động';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 4000
      });

    } finally {
      setSubmittingActivity(false);
    }
  };

  const handleConfirmDeleteActivity = async () => {
    if (!selectedActivity) return;

    const wasCheckinActivity = selectedActivity.activityType?.name === 'Điểm danh vào';
    const studentSlotIdToReload = selectedActivity.studentSlotId;

    setDeletingActivity(true);
    try {
      await activityService.deleteActivity(selectedActivity.id);
      toast.success('Xóa hoạt động thành công!', {
        position: 'top-right',
        autoClose: 3000
      });
      handleCloseActivityDeleteDialog();
      
      // Reload activities
      if (studentSlotIdToReload) {
        setActivitiesByStudent(prev => {
          const newState = { ...prev };
          delete newState[studentSlotIdToReload];
          return newState;
        });
        await loadActivitiesForStudent(studentSlotIdToReload);
        
        // If deleted activity was a check-in, update checked students
        if (wasCheckinActivity) {
          // Find the slot to get studentId
          const slot = studentsList.find(s => s.id === studentSlotIdToReload);
          if (slot?.studentId) {
            setCheckedStudents(prev => {
              const newSet = new Set(prev);
              newSet.delete(slot.studentId);
              return newSet;
            });
          }
        }
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể xóa hoạt động';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 4000
      });

    } finally {
      setDeletingActivity(false);
    }
  };

  const handleBack = () => {
    // Check where we came from
    if (location.state?.from === 'assignments-list') {
      navigate('/staff/assignments');
    } else if (location.state?.from === 'staff-dashboard') {
      navigate('/staff/dashboard');
    } else {
      // Default: go back to assignments list
      navigate('/staff/assignments');
    }
  };

  // ExpandedActivitiesContent component - renders activities when row is expanded
  const ExpandedActivitiesContent = React.memo(({ row }) => {
    const studentSlotId = row.id;
    const activities = activitiesByStudent[studentSlotId] || [];
    const isLoadingActivities = loadingActivities[studentSlotId];

    // Load activities when component mounts (row is expanded)
    useEffect(() => {
      if (studentSlotId && !activitiesByStudent[studentSlotId] && !loadingActivities[studentSlotId]) {
        loadActivitiesForStudent(studentSlotId);
      }
    }, [studentSlotId, activitiesByStudent, loadingActivities]);

    if (isLoadingActivities) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      );
    }

    if (activities.length === 0) {
      return (
        <Alert severity="info" sx={{ m: 2 }}>
          Chưa có hoạt động nào cho học sinh này.
        </Alert>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, m: 2 }}>
        {activities.map((activity) => (
          <Card 
            key={activity.id} 
            sx={{ 
              borderRadius: 'var(--radius-lg)', 
              border: '1px solid var(--border-light)', 
              backgroundColor: 'var(--bg-secondary)' 
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Chip 
                  label={activity.activityType?.name || 'Chưa xác định'} 
                  color="primary" 
                  size="small" 
                  sx={{ fontWeight: 600 }} 
                />
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Xem chi tiết">
                    <IconButton 
                      size="small" 
                      onClick={() => handleViewActivity(activity)} 
                      sx={{ color: 'primary.main' }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sửa">
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditActivity(activity)} 
                      sx={{ color: 'warning.main' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xóa">
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteActivity(activity)} 
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              {activity.imageUrl && (
                <Box 
                  sx={{ 
                    width: '100%', 
                    height: 100, 
                    borderRadius: 1, 
                    overflow: 'hidden', 
                    mb: 1, 
                    backgroundColor: 'grey.100' 
                  }}
                >
                  <img 
                    src={activity.imageUrl} 
                    alt={activity.activityType?.name || 'Hoạt động'} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </Box>
              )}
              {activity.note && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {activity.note}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                {formatDateTimeUTC7(activity.createdTime || activity.createdDate)}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  });

  // Expandable config for DataTable
  const expandableConfig = useMemo(() => ({
    renderExpandedContent: (row) => <ExpandedActivitiesContent row={row} />
  }), [activitiesByStudent, loadingActivities, loadActivitiesForStudent, handleViewActivity, handleEditActivity, handleDeleteActivity]);

  const formatTimeDisplay = (time) => {
    if (!time) return '00:00';
    return time.substring(0, 5);
  };

  if (loading) {
    return (
      <div className={styles.detailPage}>
        <div className={styles.container}>
          <ContentLoading isLoading={true} text="Đang tải thông tin..." />
        </div>
      </div>
    );
  }

  if (error || !slot) {
    return (
      <div className={styles.detailPage}>
        <div className={styles.container}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBack}
            sx={{ mb: 2 }}
          >
            Quay lại
          </Button>
          <Alert severity="error">
            {error || 'Không tìm thấy thông tin'}
          </Alert>
        </div>
      </div>
    );
  }

  // Parse branchSlot data
  const dateValue = slot.date || slot.branchSlot?.date;
  const timeframe = slot.timeframe || slot.timeFrame;
  const roomName = slot.roomName || slot.room?.roomName || slot.branchSlot?.roomName || 'Chưa xác định';
  const branchName = slot.branch?.branchName || slot.branchName || slot.branchSlot?.branchName || 'Chưa xác định';
  const status = slot.status || 'Available';
  const timeframeName = timeframe?.name || 'Chưa xác định';
  const startTimeOnly = timeframe?.startTime || '';
  const endTimeOnly = timeframe?.endTime || '';
  const slotTypeName = slot.slotType?.name || 'Chưa xác định';

  const statusLabels = {
    'Booked': 'Đã đăng ký',
    'Confirmed': 'Đã xác nhận',
    'Cancelled': 'Đã hủy',
    'Completed': 'Đã hoàn thành',
    'Pending': 'Chờ xử lý'
  };

  return (
    <div className={styles.detailPage}>
      <div className={styles.container}>
        {/* Header */}
        <Paper 
          elevation={0}
          sx={{
            padding: 3,
            marginBottom: 3,
            backgroundColor: 'transparent',
            boxShadow: 'none'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={handleBack}
              variant="contained"
              sx={{
                borderRadius: 'var(--radius-lg)',
                textTransform: 'none',
                fontFamily: 'var(--font-family)',
                background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-dark) 100%)',
                boxShadow: 'var(--shadow-sm)',
                '&:hover': {
                  background: 'linear-gradient(135deg, var(--color-secondary-dark) 0%, var(--color-secondary) 100%)',
                  boxShadow: 'var(--shadow-md)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Quay lại
            </Button>
            <Typography 
              variant="h4" 
              component="h1"
              sx={{
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)'
              }}
            >
              Chi tiết ca giữ trẻ
            </Typography>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Slot Information */}
          <Grid item xs={12}>
            <Paper 
              elevation={0}
              sx={{
                padding: 3,
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-primary)',
                maxWidth: 800,
                margin: '0 auto'
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3,
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <CheckCircle sx={{ color: 'var(--color-primary)' }} />
                Thông tin ca giữ trẻ
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CalendarToday sx={{ color: 'var(--text-secondary)', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      Ngày
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {dateValue ? formatDateOnlyUTC7(dateValue) : 'Chưa xác định'}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                {startTimeOnly && endTimeOnly && (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <AccessTime sx={{ color: 'var(--text-secondary)', fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                          Giờ
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formatTimeDisplay(startTimeOnly)} - {formatTimeDisplay(endTimeOnly)}
                        </Typography>
                      </Box>
                    </Box>
                    <Divider />
                  </>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <MeetingRoom sx={{ color: 'var(--text-secondary)', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      Phòng
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {roomName}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Business sx={{ color: 'var(--text-secondary)', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      Chi nhánh
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {branchName}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EventIcon sx={{ color: 'var(--text-secondary)', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      Loại ca giữ trẻ
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {slotTypeName}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'var(--text-secondary)', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      Trạng thái đăng ký
                    </Typography>
                    <Chip
                      label={statusLabels[status] || status}
                      size="small"
                      sx={{
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Students List with Activities */}
          <Grid item xs={12}>
            <Paper 
              elevation={0}
              sx={{
                padding: 3,
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-primary)'
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3,
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Person sx={{ color: 'var(--color-primary)' }} />
                Quản lý học sinh và hoạt động ({studentsList.length})
              </Typography>

              {loadingStudents ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Đang tải danh sách học sinh...
                  </Typography>
                </Box>
              ) : studentsList.length === 0 ? (
                <Alert severity="info">
                  Không có học sinh nào đã đăng ký cho ca này.
                </Alert>
              ) : (
                <>
                  {/* Search Bar */}
                  <TextField
                    fullWidth
                    placeholder="Tìm kiếm học sinh hoặc phụ huynh..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />

                  {filteredStudentsList.length === 0 ? (
                    <Alert severity="info">
                      Không tìm thấy học sinh nào phù hợp với từ khóa "{searchTerm}".
                    </Alert>
                  ) : (
                    <DataTable
                      data={paginatedStudents}
                      columns={columns}
                      loading={loadingStudents}
                      page={page}
                      rowsPerPage={rowsPerPage}
                      totalCount={filteredStudentsList.length}
                      onPageChange={handlePageChange}
                      onRowsPerPageChange={handleRowsPerPageChange}
                      expandableConfig={expandableConfig}
                      showActions={false}
                      emptyMessage="Không có học sinh nào phù hợp với từ khóa tìm kiếm."
                    />
                  )}
                </>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Dialog tạo hoạt động */}
        <Dialog 
          open={activityDialogOpen} 
          onClose={handleCloseActivityDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 'var(--radius-xl)'
            }
          }}
        >
          <DialogTitle>
            <Typography variant="h6" component="div" sx={{ fontFamily: 'var(--font-family-heading)', fontWeight: 600 }}>
              Tạo hoạt động cho học sinh
            </Typography>
            {selectedStudentSlot && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {selectedStudentSlot.studentName || 'Chưa có tên'}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Loại hoạt động</InputLabel>
                <Select
                  value={activityForm.activityTypeId}
                  onChange={(e) => setActivityForm({ ...activityForm, activityTypeId: e.target.value })}
                  label="Loại hoạt động"
                  disabled={loadingActivityTypes || submittingActivity}
                >
                  {loadingActivityTypes ? (
                    <MenuItem disabled>Đang tải...</MenuItem>
                  ) : activityTypes.length === 0 ? (
                    <MenuItem disabled>Không có loại hoạt động</MenuItem>
                  ) : (
                    activityTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name || 'Chưa có tên'}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              <TextField
                label="Ghi chú"
                placeholder="Ví dụ: Nay cháu ăn uống tốt"
                multiline
                rows={4}
                value={activityForm.note}
                onChange={(e) => setActivityForm({ ...activityForm, note: e.target.value })}
                disabled={submittingActivity}
                fullWidth
              />

              <ImageUpload
                label="Ảnh hoạt động"
                helperText="Chọn ảnh để tải lên cho phụ huynh xem"
                value={activityForm.imageFile}
                onChange={(file) => setActivityForm({ ...activityForm, imageFile: file })}
                disabled={submittingActivity}
                required={false}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleCloseActivityDialog} 
              disabled={submittingActivity}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleSubmitActivity} 
              variant="contained"
              disabled={submittingActivity || !activityForm.activityTypeId}
            >
              {submittingActivity ? 'Đang tạo...' : 'Tạo hoạt động'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog xem chi tiết hoạt động */}
        <Dialog 
          open={activityDetailDialogOpen} 
          onClose={handleCloseActivityDetailDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 'var(--radius-xl)'
            }
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" component="div" sx={{ fontFamily: 'var(--font-family-heading)', fontWeight: 600 }}>
                Chi tiết Hoạt Động
              </Typography>
              <IconButton onClick={handleCloseActivityDetailDialog} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedActivity && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                {selectedActivity.imageUrl && (
                  <Box
                    sx={{
                      width: '100%',
                      maxHeight: 400,
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <img
                      src={selectedActivity.imageUrl}
                      alt={selectedActivity.activityType?.name || 'Hoạt động'}
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        maxHeight: 400,
                        objectFit: 'contain'
                      }}
                    />
                  </Box>
                )}

                <Divider />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Loại hoạt động
                  </Typography>
                  <Chip
                    label={selectedActivity.activityType?.name || 'Chưa xác định'}
                    color="primary"
                    sx={{ fontWeight: 600 }}
                  />
                  {selectedActivity.activityType?.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                      {selectedActivity.activityType.description}
                    </Typography>
                  )}
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Ghi chú
                  </Typography>
                  <Typography variant="body1">
                    {selectedActivity.note || 'Không có ghi chú'}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Thời gian tạo
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTimeUTC7(selectedActivity.createdTime || selectedActivity.createdDate)}
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseActivityDetailDialog} variant="contained">
              Đóng
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog sửa hoạt động */}
        <Dialog 
          open={activityEditDialogOpen} 
          onClose={handleCloseActivityEditDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 'var(--radius-xl)'
            }
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" component="div" sx={{ fontFamily: 'var(--font-family-heading)', fontWeight: 600 }}>
                Sửa hoạt động
              </Typography>
              <IconButton onClick={handleCloseActivityEditDialog} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Loại hoạt động</InputLabel>
                <Select
                  value={activityForm.activityTypeId}
                  onChange={(e) => setActivityForm({ ...activityForm, activityTypeId: e.target.value })}
                  label="Loại hoạt động"
                  disabled={loadingActivityTypes || submittingActivity}
                >
                  {loadingActivityTypes ? (
                    <MenuItem disabled>Đang tải...</MenuItem>
                  ) : activityTypes.length === 0 ? (
                    <MenuItem disabled>Không có loại hoạt động</MenuItem>
                  ) : (
                    activityTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name || 'Chưa có tên'}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              <TextField
                label="Ghi chú"
                placeholder="Ví dụ: Nay cháu ăn uống tốt"
                multiline
                rows={4}
                value={activityForm.note}
                onChange={(e) => setActivityForm({ ...activityForm, note: e.target.value })}
                disabled={submittingActivity}
                fullWidth
              />

              <ImageUpload
                label="Ảnh hoạt động"
                helperText="Chọn ảnh mới để thay thế (để trống nếu giữ nguyên ảnh cũ)"
                value={activityForm.imageFile}
                onChange={(file) => setActivityForm({ ...activityForm, imageFile: file })}
                disabled={submittingActivity}
                required={false}
              />

              {selectedActivity?.imageUrl && !activityForm.imageFile && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Ảnh hiện tại:
                  </Typography>
                  <Box
                    sx={{
                      width: '100%',
                      maxHeight: 200,
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <img
                      src={selectedActivity.imageUrl}
                      alt="Current"
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        maxHeight: 200,
                        objectFit: 'contain'
                      }}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleCloseActivityEditDialog} 
              disabled={submittingActivity}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleSubmitEditActivity} 
              variant="contained"
              disabled={submittingActivity || !activityForm.activityTypeId}
            >
              {submittingActivity ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog xác nhận xóa hoạt động */}
        <ConfirmDialog
          open={activityDeleteDialogOpen}
          onClose={handleCloseActivityDeleteDialog}
          onConfirm={handleConfirmDeleteActivity}
          title="Xác nhận xóa hoạt động"
          description="Bạn có chắc chắn muốn xóa hoạt động này? Hành động này không thể hoàn tác."
          confirmText={deletingActivity ? 'Đang xóa...' : 'Xóa'}
          cancelText="Hủy"
          confirmColor="error"
          highlightText={selectedActivity?.activityType?.name}
        />

        {/* Dialog xác nhận xóa điểm danh */}
        <ConfirmDialog
          open={checkinDeleteDialogOpen}
          onClose={handleCloseCheckinDeleteDialog}
          onConfirm={handleConfirmDeleteCheckin}
          title="Xác nhận xóa điểm danh"
          description={`Bạn có chắc chắn muốn xóa điểm danh của ${checkinToDelete?.slot?.studentName || 'học sinh'}? Sau khi xóa, bạn có thể điểm danh lại.`}
          confirmText={deletingCheckin ? 'Đang xóa...' : 'Xóa điểm danh'}
          cancelText="Hủy"
          confirmColor="error"
          highlightText={checkinToDelete?.slot?.studentName}
        />

        {/* Dialog xem chi tiết học sinh và người giám hộ */}
        <Dialog 
          open={studentDetailDialogOpen} 
          onClose={handleCloseStudentDetailDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 'var(--radius-xl)'
            }
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" component="div" sx={{ fontFamily: 'var(--font-family-heading)', fontWeight: 600 }}>
                Chi tiết học sinh
              </Typography>
              <IconButton onClick={handleCloseStudentDetailDialog} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
            {selectedStudent && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {selectedStudent.studentName || 'Chưa có tên'}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent>
            {selectedStudent ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                {/* Student Information */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person sx={{ fontSize: 24 }} />
                    Thông tin học sinh
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box mb={2}>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                          <Person sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                          Tên học sinh
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedStudent.studentName || studentDetail?.name || 'Chưa có tên'}
                        </Typography>
                      </Box>
                    </Grid>
                    {selectedStudent.parentName && (
                      <Grid item xs={12} sm={6}>
                        <Box mb={2}>
                          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                            <AccountCircleIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            Phụ huynh (từ đăng ký)
                          </Typography>
                          <Typography variant="body1">
                            {selectedStudent.parentName}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    {studentDetail?.dateOfBirth && (
                      <Grid item xs={12} sm={6}>
                        <Box mb={2}>
                          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                            <CalendarToday sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            Ngày sinh
                          </Typography>
                          <Typography variant="body1">
                            {formatDateOnlyUTC7(studentDetail.dateOfBirth)}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    {studentDetail?.schoolName && (
                      <Grid item xs={12} sm={6}>
                        <Box mb={2}>
                          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                            <SchoolIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            Trường học
                          </Typography>
                          <Typography variant="body1">
                            {studentDetail.schoolName || studentDetail.school?.name || 'Chưa có'}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    {(selectedStudent.parentNote || (studentDetail?.note && studentDetail.note !== 'string')) && (
                      <Grid item xs={12}>
                        <Box mb={2}>
                          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                            Ghi chú
                          </Typography>
                          <Typography variant="body1">
                            {selectedStudent.parentNote || studentDetail?.note || 'Chưa có ghi chú'}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>

                <Divider />

                {/* Guardians Information */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountCircleIcon sx={{ fontSize: 24 }} />
                    Người giám hộ ({guardians.length})
                  </Typography>
                  {loadingGuardians ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : guardians.length === 0 ? (
                    <Alert severity="info">
                      Chưa có thông tin người giám hộ.
                    </Alert>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {guardians.map((guardian, index) => (
                        <Card 
                          key={guardian.id || index}
                          sx={{ 
                            borderRadius: 'var(--radius-lg)', 
                            border: '1px solid var(--border-light)', 
                            backgroundColor: 'var(--bg-secondary)'
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                              {guardian.avatar && (
                                <Box
                                  component="img"
                                  src={guardian.avatar}
                                  alt={guardian.name || 'Người giám hộ'}
                                  sx={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '2px solid',
                                    borderColor: 'primary.light'
                                  }}
                                />
                              )}
                              <Box flex={1}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Typography variant="h6" fontWeight="bold">
                                    {guardian.name || 'Chưa có tên'}
                                  </Typography>
                                  {guardian.studentRela && (
                                    <Chip
                                      label={guardian.studentRela}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                    />
                                  )}
                                </Box>
                                {guardian.phone && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    <Typography variant="body2" color="text.secondary">
                                      {guardian.phone}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )}
                </Box>

                <Divider />

                {/* Services Information */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ServiceIcon sx={{ fontSize: 24 }} />
                    Dịch vụ ({services.length})
                  </Typography>
                  {loadingServices ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : services.length === 0 ? (
                    <Alert severity="info">
                      Chưa có dịch vụ nào được đăng ký.
                    </Alert>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {services.map((service, index) => {
                        // Ưu tiên các field ảnh quen thuộc; nếu không có thì tự tìm field string là URL
                        let serviceImage =
                          service.imageUrl ||
                          service.image ||
                          service.iconUrl ||
                          service.avatar ||
                          service.thumbnail ||
                          service.thumbnailUrl ||
                          null;

                        if (!serviceImage) {
                          try {
                            const stringValues = Object.values(service).filter(
                              (v) => typeof v === 'string'
                            );
                            const urlCandidate = stringValues.find((v) =>
                              /^https?:\/\//i.test(v)
                            );
                            if (urlCandidate) {
                              serviceImage = urlCandidate;
                            }
                          } catch {
                            // ignore parsing errors
                          }
                        }
                        const quantity =
                          service.quantity ??
                          service.qty ??
                          service.amount ??
                          service.totalQuantity ??
                          service.total ??
                          null;
                        
                        return (
                          <Card 
                            key={service.serviceId || service.id || index}
                            sx={{ 
                              borderRadius: 'var(--radius-lg)', 
                              border: '1px solid var(--border-light)', 
                              backgroundColor: 'var(--bg-secondary)'
                            }}
                          >
                            <CardContent sx={{ p: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                  {serviceImage ? (
                                    <Box
                                      component="img"
                                      src={serviceImage}
                                      alt={service.serviceName || service.name || 'Dịch vụ'}
                                      sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '12px',
                                        objectFit: 'cover',
                                        border: '1px solid',
                                        borderColor: 'primary.light',
                                        backgroundColor: 'white'
                                      }}
                                    />
                                  ) : (
                                    <ServiceIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                                  )}
                                  <Box flex={1}>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                                      {service.serviceName || service.name || 'Dịch vụ không tên'}
                                    </Typography>
                                    {service.description && (
                                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                        {service.description}
                                      </Typography>
                                    )}
                                    {service.price !== undefined && service.price !== null && (
                                      <Typography variant="body2" color="primary.main" fontWeight="medium">
                                        Giá: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                                {quantity !== null && quantity !== undefined && (
                                  <Chip 
                                    label={`x${quantity}`}
                                    color="primary"
                                    size="small"
                                    sx={{ fontWeight: 600, ml: 2 }}
                                  />
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </Box>
            ) : (
              <Alert severity="info">
                Không có thông tin học sinh.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseStudentDetailDialog} variant="contained">
              Đóng
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default AssignmentDetail;
