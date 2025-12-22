import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Alert,
  Typography,
  Button,
  Divider,
  Paper,
  Chip,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ArrowBack,
  AccessTime,
  Business,
  CalendarToday,
  MeetingRoom,
  Person,
  School,
  Delete as DeleteIcon,
  ContentCopy,
  SwapHoriz,
  Event as EventIcon
} from '@mui/icons-material';
import { IconButton, Tooltip, InputAdornment } from '@mui/material';
import { PersonAdd as AssignStaffIcon, MeetingRoomOutlined as AssignRoomIcon, Add as AddIcon, Remove as RemoveIcon, Visibility as VisibilityIcon, Search as SearchIcon } from '@mui/icons-material';
import ContentLoading from '../../../../components/Common/ContentLoading';
import { formatDateToUTC7ISO } from '../../../../utils/dateHelper';
import ConfirmDialog from '../../../../components/Common/ConfirmDialog';
import ManagementFormDialog from '../../../../components/Management/FormDialog';
import Form from '../../../../components/Common/Form';
import DataTable from '../../../../components/Common/DataTable';
import branchSlotService from '../../../../services/branchSlot.service';
import studentSlotService from '../../../../services/studentSlot.service';
import useBranchSlotDependencies from '../../../../hooks/useBranchSlotDependencies';
import { assignStaffSchema } from '../../../../utils/validationSchemas/assignStaffSchemas';
import { assignRoomsSchema } from '../../../../utils/validationSchemas/assignRoomsSchemas';
import { toast } from 'react-toastify';
import { formatDateOnlyUTC7, formatDateTimeUTC7 } from '../../../../utils/dateHelper';

const WEEK_DAYS = [
  { value: 0, label: 'Chủ Nhật' },
  { value: 1, label: 'Thứ 2' },
  { value: 2, label: 'Thứ 3' },
  { value: 3, label: 'Thứ 4' },
  { value: 4, label: 'Thứ 5' },
  { value: 5, label: 'Thứ 6' },
  { value: 6, label: 'Thứ 7' }
];

const statusLabels = {
  'Available': 'Có sẵn',
  'Occupied': 'Đã đầy',
  'Cancelled': 'Đã hủy',
  'Maintenance': 'Bảo trì'
};

const statusColors = {
  'Available': 'success',
  'Occupied': 'warning',
  'Cancelled': 'error',
  'Maintenance': 'default'
};

const BranchSlotDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [branchSlot, setBranchSlot] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unassigning, setUnassigning] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: null, // 'staff' or 'room'
    item: null,
    onConfirm: null
  });

  // Dependencies for assign dialogs
  const {
    roomOptions,
    staffOptions,
    loading: dependenciesLoading,
    error: dependenciesError,
    fetchDependencies
  } = useBranchSlotDependencies();

  // Assign staff dialog state
  const [assignStaffDialog, setAssignStaffDialog] = useState({
    open: false,
    rooms: [],
    staffByRoom: null,
    selectedRoomId: '',
    roomsWithStaff: null,
    allAssignedStaffIds: null
  });
  const [assignStaffLoading, setAssignStaffLoading] = useState(false);
  const [slotRooms, setSlotRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Assign rooms dialog state
  const [assignRoomsDialog, setAssignRoomsDialog] = useState({
    open: false
  });
  const [assignRoomsLoading, setAssignRoomsLoading] = useState(false);
  const [assignedRooms, setAssignedRooms] = useState([]);
  const [loadingAssignedRooms, setLoadingAssignedRooms] = useState(false);

  // Duplicate dialog state
  const [duplicateDialog, setDuplicateDialog] = useState({
    open: false,
    dates: [null] // Array of dates to duplicate to
  });
  const [duplicateLoading, setDuplicateLoading] = useState(false);

  // Change room dialog state
  const [changeRoomDialog, setChangeRoomDialog] = useState({
    open: false,
    oldRoom: null, // Room to change from
    newRoomId: '' // New room ID to change to
  });
  const [changeRoomLoading, setChangeRoomLoading] = useState(false);

  // Student list dialog state
  const [studentListDialog, setStudentListDialog] = useState({
    open: false,
    room: null, // Selected room
    branchSlotId: null
  });
  const [students, setStudents] = useState([]);
  const [studentListLoading, setStudentListLoading] = useState(false);
  const [studentListPage, setStudentListPage] = useState(0);
  const [studentListRowsPerPage, setStudentListRowsPerPage] = useState(10);
  const [studentListTotalCount, setStudentListTotalCount] = useState(0);
  const [studentListKeyword, setStudentListKeyword] = useState('');
  const [studentListDate, setStudentListDate] = useState(null);


  const loadData = useCallback(async () => {
    if (!id) {
      setError('Thiếu thông tin cần thiết');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load branch slot details - this includes rooms and staff in rooms
      const slotData = await branchSlotService.getBranchSlotById(id);
      setBranchSlot(slotData);

      // Extract rooms from branch slot response
      // Rooms already contain staff information inside each room object
      const roomsData = slotData?.rooms || [];
      setRooms(roomsData);
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải thông tin ca giữ trẻ';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [id, loadData]);

  const handleBack = () => {
    navigate('/manager/branch-slots');
  };

  const handleUnassignStaff = (staff) => {
    const staffId = staff.staffId || staff.userId || staff.id;
    const staffName = staff.staffName || staff.fullName || 'Nhân viên';
    
    setConfirmDialog({
      open: true,
      type: 'staff',
      item: { id: staffId, name: staffName },
      onConfirm: async () => {
        setUnassigning(true);
        try {
          await branchSlotService.unassignStaff(id, staffId);
          toast.success(`Đã gỡ nhân viên "${staffName}" khỏi ca giữ trẻ!`, {
            position: "top-right",
            autoClose: 3000,
          });
          // Reload data
          await loadData();
        } catch (err) {
          const errorMessage = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi gỡ nhân viên';
          toast.error(errorMessage, {
            position: "top-right",
            autoClose: 4000,
          });
        } finally {
          setUnassigning(false);
          setConfirmDialog({ open: false, type: null, item: null, onConfirm: null });
        }
      }
    });
  };

  const handleUnassignRoom = (room) => {
    const roomId = room.id || room.roomId;
    const roomName = room.roomName || room.name || 'Phòng';
    
    setConfirmDialog({
      open: true,
      type: 'room',
      item: { id: roomId, name: roomName },
      onConfirm: async () => {
        setUnassigning(true);
        try {
          await branchSlotService.unassignRoom(id, roomId);
          toast.success(`Đã gỡ phòng "${roomName}" khỏi ca giữ trẻ!`, {
            position: "top-right",
            autoClose: 3000,
          });
          // Reload data
          await loadData();
        } catch (err) {
          const errorMessage = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi gỡ phòng';
          toast.error(errorMessage, {
            position: "top-right",
            autoClose: 4000,
          });
        } finally {
          setUnassigning(false);
          setConfirmDialog({ open: false, type: null, item: null, onConfirm: null });
        }
      }
    });
  };

  // Fetch dependencies when assign dialogs open
  useEffect(() => {
    if (assignStaffDialog.open || assignRoomsDialog.open) {
      if (staffOptions.length === 0 || roomOptions.length === 0) {
        fetchDependencies();
      }
    }
  }, [assignStaffDialog.open, assignRoomsDialog.open, staffOptions.length, roomOptions.length, fetchDependencies]);

  const handleAssignStaff = useCallback(async () => {
    if (!branchSlot || !id) return;
    
    setAssignStaffDialog({ open: true, rooms: [], staffByRoom: null, selectedRoomId: '', roomsWithStaff: null, allAssignedStaffIds: null });
    setSlotRooms([]);
    setLoadingRooms(true);
    
    try {
      // Use current branchSlot data (already loaded)
      const roomsData = branchSlot?.rooms || [];
      
      // Get all staff assignments (from rooms and from slot.staff)
      const allAssignedStaffIds = new Set();
      const roomsWithStaff = new Set();
      
      // Extract staff assigned to each room
      const staffByRoom = new Map();
      roomsData.forEach(room => {
        const roomId = room.id || room.roomId;
        if (roomId) {
          const staffList = [];
          if (room.staff) {
            if (Array.isArray(room.staff)) {
              staffList.push(...room.staff.map(s => s.staffId || s.userId || s.id));
            } else if (typeof room.staff === 'object') {
              const staffId = room.staff.staffId || room.staff.userId || room.staff.id;
              if (staffId) staffList.push(staffId);
            }
          }
          if (staffList.length > 0) {
            const roomIdStr = String(roomId);
            staffByRoom.set(roomIdStr, new Set(staffList.map(String)));
            roomsWithStaff.add(roomIdStr);
            staffList.forEach(id => allAssignedStaffIds.add(String(id)));
          }
        }
      });
      
      // Also get staff from branchSlot.staff (staff without room assignment)
      const slotStaffList = branchSlot?.staff || [];
      slotStaffList.forEach(staff => {
        const staffId = staff.staffId || staff.userId || staff.id;
        if (staffId) {
          allAssignedStaffIds.add(String(staffId));
        }
      });
      
      setSlotRooms(roomsData);
      setAssignStaffDialog(prev => ({ 
        ...prev, 
        rooms: roomsData,
        staffByRoom,
        roomsWithStaff,
        allAssignedStaffIds
      }));
    } catch (err) {

    } finally {
      setLoadingRooms(false);
    }
  }, [branchSlot, id]);

  const handleAssignStaffSubmit = useCallback(async (data) => {
    if (!id) return;

    setAssignStaffLoading(true);
    try {
      const submitData = {
        branchSlotId: id,
        userId: data.userId,
        roomId: data.roomId || null,
        name: data.name || null
      };

      await branchSlotService.assignStaff(submitData);
      
      toast.success('Gán nhân viên thành công!', {
        position: "top-right",
        autoClose: 3000,
      });

      setAssignStaffDialog({ open: false, rooms: [], staffByRoom: null, selectedRoomId: '', roomsWithStaff: null, allAssignedStaffIds: null });
      await loadData();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi gán nhân viên';
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setAssignStaffLoading(false);
    }
  }, [id, loadData]);

  const handleAssignRooms = useCallback(async () => {
    if (!branchSlot || !id) return;
    
    setAssignRoomsDialog({ open: true });
    setAssignedRooms([]);
    setLoadingAssignedRooms(true);
    
    try {
      // Use current rooms data (already loaded)
      const roomsData = branchSlot?.rooms || [];
      setAssignedRooms(roomsData.map(room => room.id || room.roomId).filter(Boolean));
    } catch (err) {

      setAssignedRooms([]);
    } finally {
      setLoadingAssignedRooms(false);
    }
  }, [branchSlot, id]);

  const handleAssignRoomsSubmit = useCallback(async (data) => {
    if (!id) return;

    setAssignRoomsLoading(true);
    try {
      const submitData = {
        branchSlotId: id,
        roomIds: Array.isArray(data.roomIds) ? data.roomIds : []
      };

      await branchSlotService.assignRooms(submitData);
      
      toast.success('Gán phòng thành công!', {
        position: "top-right",
        autoClose: 3000,
      });

      setAssignRoomsDialog({ open: false });
      setAssignedRooms([]);
      await loadData();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi gán phòng';
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setAssignRoomsLoading(false);
    }
  }, [id, loadData]);

  const handleDuplicate = useCallback(() => {
    if (!id) return;
    setDuplicateDialog({
      open: true,
      dates: [null] // Start with one empty date field
    });
  }, [id]);

  const handleDuplicateSubmit = useCallback(async () => {
    if (!id) return;

    // Filter out null/empty dates and convert to ISO strings with UTC+7 timezone
    const datesToSend = duplicateDialog.dates
      .filter(date => date !== null && date !== undefined && date !== '')
      .map(date => {
        // Convert to ISO string format as expected by BE with UTC+7 timezone
        if (date instanceof Date) {
          // For Date objects from date picker, use local date components to avoid timezone issues
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          // Format as ISO string with UTC+7 timezone at noon to avoid day boundary issues
          return `${year}-${month}-${day}T12:00:00.000+07:00`;
        }
        if (typeof date === 'string') {
          // If already ISO string with timezone, use it
          if (date.includes('T') && (date.includes('+') || date.includes('Z'))) {
            return date;
          }
          // If YYYY-MM-DD format, convert to ISO with UTC+7 at noon
          if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return `${date}T12:00:00.000+07:00`;
          }
          // Try to parse other formats
          const parsedDate = new Date(date);
          if (!isNaN(parsedDate.getTime())) {
            const year = parsedDate.getFullYear();
            const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
            const day = String(parsedDate.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}T12:00:00.000+07:00`;
          }
        }
        return null;
      })
      .filter(Boolean);

    // If no dates provided, API will create one duplicate with source slot's date
    setDuplicateLoading(true);
    try {
      await branchSlotService.duplicateBranchSlot(id, datesToSend);
      
      const dateCount = datesToSend.length || 1;
      toast.success(`Đã sao chép ca giữ trẻ thành công! ${dateCount > 1 ? `Tạo ${dateCount} bản sao.` : 'Tạo 1 bản sao.'}`, {
        position: "top-right",
        autoClose: 3000,
      });

      setDuplicateDialog({ open: false, dates: [null] });
      // Navigate back to list to see the duplicated slots
      setTimeout(() => {
        navigate('/manager/branch-slots');
      }, 1000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi sao chép ca giữ trẻ';
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setDuplicateLoading(false);
    }
  }, [id, duplicateDialog.dates, navigate]);

  const handleChangeRoom = useCallback((room) => {
    if (!id || !room) return;
    const roomId = room.id || room.roomId;
    setChangeRoomDialog({
      open: true,
      oldRoom: room,
      newRoomId: ''
    });
  }, [id]);

  const handleChangeRoomSubmit = useCallback(async () => {
    if (!id || !changeRoomDialog.oldRoom || !changeRoomDialog.newRoomId) {
      toast.error('Vui lòng chọn phòng mới', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    const oldRoomId = changeRoomDialog.oldRoom.id || changeRoomDialog.oldRoom.roomId;
    if (oldRoomId === changeRoomDialog.newRoomId) {
      toast.error('Phòng mới phải khác phòng hiện tại', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setChangeRoomLoading(true);
    try {
      await branchSlotService.changeRoom(id, oldRoomId, changeRoomDialog.newRoomId);
      
      const oldRoomName = changeRoomDialog.oldRoom.roomName || changeRoomDialog.oldRoom.name || 'phòng cũ';
      const newRoom = roomOptions.find(r => r.id === changeRoomDialog.newRoomId);
      const newRoomName = newRoom?.name || 'phòng mới';
      
      toast.success(`Đã đổi phòng từ "${oldRoomName}" sang "${newRoomName}" thành công!`, {
        position: "top-right",
        autoClose: 3000,
      });

      setChangeRoomDialog({ open: false, oldRoom: null, newRoomId: '' });
      await loadData(); // Reload data to show updated room
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi đổi phòng';
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setChangeRoomLoading(false);
    }
  }, [id, changeRoomDialog, roomOptions, loadData]);

  // Load student list for a room
  const loadStudentList = useCallback(async () => {
    if (!studentListDialog.room || !studentListDialog.branchSlotId) return;

    setStudentListLoading(true);
    try {
      const roomId = studentListDialog.room.id || studentListDialog.room.roomId;
      const response = await studentSlotService.getManagerSlots({
        branchSlotId: studentListDialog.branchSlotId,
        roomId: roomId,
        pageIndex: studentListPage + 1, // API uses 1-based indexing
        pageSize: studentListRowsPerPage,
        date: studentListDate ? (studentListDate instanceof Date ? studentListDate.toLocaleDateString('sv-SE') : typeof studentListDate === 'string' ? studentListDate.split('T')[0] : studentListDate) : null,
        upcomingOnly: false
      });

      // API response structure: items is array of branch slots, each has studentSlots array
      // We need to flatten all studentSlots from all branch slots
      const branchSlots = response?.items || [];
      
      // Flatten all studentSlots from all branch slots
      const allStudentSlots = [];
      branchSlots.forEach(branchSlot => {
        const studentSlots = branchSlot.studentSlots || [];
        studentSlots.forEach(studentSlot => {
          allStudentSlots.push({
            ...studentSlot,
            // Add branch slot info for reference if needed
            branchSlotId: branchSlot.id || branchSlot.Id,
            branchSlotDate: branchSlot.date || branchSlot.Date,
            roomId: branchSlot.roomId || branchSlot.RoomId,
            roomName: branchSlot.roomName || branchSlot.RoomName
          });
        });
      });
      
      // Transform student slots to flat structure for display
      const transformedStudents = allStudentSlots.map((studentSlot, index) => {
        // Get student name
        const studentName = studentSlot.student?.name || 'Chưa có tên';
        
        // Get parent name
        const parentName = studentSlot.parent?.name || 'Chưa có thông tin';
        
        // Get date
        const date = studentSlot.date || studentSlot.Date || null;
        
        // Get status
        const status = studentSlot.status || studentSlot.Status || 'Booked';
        
        // Get parent note
        const parentNote = studentSlot.parentNote || studentSlot.ParentNote || null;
        
        return {
          // Keep original data
          ...studentSlot,
          // Override with transformed/flattened values
          id: studentSlot.studentSlotId || studentSlot.id || `slot-${index}`,
          studentSlotId: studentSlot.studentSlotId || studentSlot.id,
          studentName: studentName,
          studentId: studentSlot.student?.id || studentSlot.studentId,
          parentName: parentName,
          parentId: studentSlot.parent?.id || studentSlot.parentId,
          date: date,
          status: status,
          parentNote: parentNote
        };
      });

      setStudents(transformedStudents);
      // Use totalCount from response, or count all flattened student slots
      setStudentListTotalCount(response?.totalCount || transformedStudents.length);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tải danh sách học sinh';
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 4000,
      });
      setStudents([]);
      setStudentListTotalCount(0);
    } finally {
      setStudentListLoading(false);
    }
  }, [studentListDialog, studentListPage, studentListRowsPerPage, studentListDate]);

  // Open student list dialog
  const handleViewStudents = useCallback((room) => {
    if (!id || !room) return;
    const roomId = room.id || room.roomId;
    setStudentListDialog({
      open: true,
      room: room,
      branchSlotId: id
    });
    setStudentListPage(0);
    setStudentListRowsPerPage(10);
    setStudentListKeyword('');
    setStudentListDate(null);
    setStudents([]);
    setStudentListTotalCount(0);
  }, [id]);

  // Reload student list when dialog opens or pagination changes
  useEffect(() => {
    if (studentListDialog.open) {
      loadStudentList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentListDialog.open, studentListPage, studentListRowsPerPage, studentListDate]);

  // Form fields and options for assign dialogs
  const staffSelectOptions = useMemo(
    () => {
      const options = [{ value: '', label: 'Chọn nhân viên' }];
      
      // Get all staff IDs that are already assigned
      const allAssignedStaffIds = assignStaffDialog.allAssignedStaffIds || new Set();
      
      // Filter out all staff that are already assigned
      const availableStaff = staffOptions.filter(staff => {
        return !allAssignedStaffIds.has(String(staff.id));
      });
      
      options.push(...availableStaff.map((staff) => ({
        value: staff.id,
        label: `${staff.name}${staff.email ? ` (${staff.email})` : ''}`
      })));
      
      return options;
    },
    [staffOptions, assignStaffDialog.allAssignedStaffIds]
  );

  const roomSelectOptions = useMemo(
    () => {
      const options = [{ value: '', label: 'Không chọn phòng (tùy chọn)' }];
      const roomsWithStaff = assignStaffDialog.roomsWithStaff || new Set();
      if (slotRooms.length > 0) {
        const availableRooms = slotRooms.filter(room => {
          const roomId = room.id || room.roomId;
          if (!roomId) return false;
          const roomIdStr = String(roomId);
          return !roomsWithStaff.has(roomIdStr);
        });
        
        options.push(...availableRooms.map((room) => ({
          value: room.id || room.roomId,
          label: room.facilityName 
            ? `${room.roomName || room.name || 'N/A'} - ${room.facilityName}` 
            : room.roomName || room.name || 'N/A'
        })));
      }
      return options;
    },
    [slotRooms, assignStaffDialog.roomsWithStaff]
  );

  const assignRoomsSelectOptions = useMemo(
    () => {
      return roomOptions
        .filter((room) => room && room.id)
        .map((room) => ({
          value: room.id,
          label: room.facilityName 
            ? `${room.name || 'N/A'} - ${room.facilityName}` 
            : room.name || 'N/A'
        }));
    },
    [roomOptions]
  );

  // Options for change room dialog - exclude current room
  const changeRoomSelectOptions = useMemo(
    () => {
      if (!changeRoomDialog.oldRoom) return [];
      const currentRoomId = changeRoomDialog.oldRoom.id || changeRoomDialog.oldRoom.roomId;
      return roomOptions
        .filter((room) => room && room.id && room.id !== currentRoomId)
        .map((room) => ({
          value: room.id,
          label: room.facilityName 
            ? `${room.name || 'N/A'} - ${room.facilityName}` 
            : room.name || 'N/A'
        }));
    },
    [roomOptions, changeRoomDialog.oldRoom]
  );

  const assignStaffFormFields = useMemo(
    () => [
      {
        section: 'Thông tin gán nhân viên',
        sectionDescription: 'Chọn nhân viên và phòng (nếu có) để gán vào ca giữ trẻ này.',
        name: 'roomId',
        label: 'Phòng (tùy chọn)',
        type: 'select',
        options: roomSelectOptions,
        gridSize: 12,
        disabled: assignStaffLoading || loadingRooms || roomSelectOptions.length === 0,
        helperText: slotRooms.length === 0 && !loadingRooms
          ? 'Ca giữ trẻ chưa có phòng nào được gán. Vui lòng gán phòng trước.'
          : assignStaffDialog.roomsWithStaff && assignStaffDialog.roomsWithStaff.size > 0
            ? 'Các phòng đã có nhân viên được gán sẽ không hiển thị. Chỉ hiển thị các phòng còn trống.'
            : 'Chọn phòng nếu nhân viên sẽ làm việc tại phòng cụ thể',
        onChange: (value) => {
          setAssignStaffDialog(prev => ({ ...prev, selectedRoomId: value || '' }));
        }
      },
      {
        name: 'userId',
        label: 'Nhân viên',
        type: 'select',
        required: true,
        options: staffSelectOptions,
        gridSize: 12,
        disabled: assignStaffLoading || dependenciesLoading || staffSelectOptions.length === 0,
        helperText: assignStaffDialog.allAssignedStaffIds && assignStaffDialog.allAssignedStaffIds.size > 0
          ? 'Các nhân viên đã được gán vào ca giữ trẻ này sẽ không hiển thị.'
          : undefined
      },
      {
        name: 'name',
        label: 'Tên vai trò (tùy chọn)',
        type: 'text',
        placeholder: 'Ví dụ: Nhân viên chăm sóc chính, Nhân viên hỗ trợ...',
        gridSize: 12,
        disabled: assignStaffLoading
      }
    ],
    [assignStaffLoading, dependenciesLoading, loadingRooms, staffSelectOptions, roomSelectOptions, slotRooms, assignStaffDialog.selectedRoomId, assignStaffDialog.roomsWithStaff, assignStaffDialog.allAssignedStaffIds]
  );

  const assignStaffDefaultValues = useMemo(
    () => ({
      userId: '',
      roomId: assignStaffDialog.selectedRoomId || '',
      name: ''
    }),
    [assignStaffDialog.selectedRoomId]
  );

  const assignRoomsFormFields = useMemo(
    () => [
      {
        section: 'Gán phòng cho ca giữ trẻ',
        sectionDescription: 'Chọn một hoặc nhiều phòng để gán vào ca giữ trẻ này.',
        name: 'roomIds',
        label: 'Phòng',
        type: 'multiselect',
        required: true,
        options: assignRoomsSelectOptions,
        gridSize: 12,
        disabled: assignRoomsLoading || dependenciesLoading || assignRoomsSelectOptions.length === 0,
        placeholder: 'Chọn phòng',
        helperText: 'Chọn ít nhất một phòng để gán vào ca giữ trẻ'
      }
    ],
    [assignRoomsLoading, dependenciesLoading, assignRoomsSelectOptions]
  );

  const assignRoomsDefaultValues = useMemo(
    () => ({
      roomIds: assignedRooms || []
    }),
    [assignedRooms]
  );

  // Calculate derived values safely (even if branchSlot is null)
  const weekDayLabel = branchSlot 
    ? (WEEK_DAYS.find(day => day.value === branchSlot.weekDate)?.label || `Ngày ${branchSlot.weekDate}`)
    : '';
  const status = branchSlot?.status || 'Available';
  const staffList = branchSlot?.staff || [];

  // Group staff by room - staff info is already in each room object
  const roomsWithStaff = useMemo(() => {
    if (!branchSlot || !rooms || rooms.length === 0) return [];
    
    // Map rooms to include staff from room.staff
    const roomsWithStaffList = rooms.map(room => {
      const roomId = room.roomId || room.id;
      
      // Extract staff from room object - can be object or array
      let staffArray = [];
      if (room.staff) {
        // If staff is an object, convert to array
        if (Array.isArray(room.staff)) {
          staffArray = room.staff;
        } else if (typeof room.staff === 'object') {
          // Single staff object - convert to array
          staffArray = [room.staff];
        }
      }
      
      return {
        room: {
          id: roomId,
          roomId: roomId,
          roomName: room.roomName || room.name,
          facilityName: room.facilityName,
          capacity: room.capacity,
          ...room
        },
        staff: staffArray
      };
    });
    
    // Also handle staff from staffList that are not in any room
    const staffInRooms = new Set();
    roomsWithStaffList.forEach(item => {
      item.staff.forEach(staff => {
        const staffId = staff.staffId || staff.id;
        if (staffId) {
          staffInRooms.add(String(staffId).trim());
        }
      });
    });
    
    // Find staff without room assignment
    const unassignedStaff = staffList.filter(staff => {
      const staffId = String(staff.staffId || staff.id || '').trim();
      const hasRoom = staff.roomId || staff.room?.id;
      return staffId && !hasRoom && !staffInRooms.has(staffId);
    });
    
    // Add unassigned staff if any
    if (unassignedStaff.length > 0) {
      roomsWithStaffList.push({
        room: null,
        staff: unassignedStaff
      });
    }
    
    // Sort rooms by name for consistency
    const assigned = roomsWithStaffList.filter(item => item.room);
    const unassigned = roomsWithStaffList.find(item => !item.room);
    
    assigned.sort((a, b) => {
      const nameA = (a.room.roomName || a.room.name || '').toLowerCase();
      const nameB = (b.room.roomName || b.room.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
    
    // Build final result
    const finalResult = unassigned && unassigned.staff.length > 0 
      ? [...assigned, unassigned] 
      : assigned;
    
    return finalResult;
  }, [rooms, staffList, branchSlot]);

  if (loading) {
    return (
      <ContentLoading isLoading={true} text="Đang tải thông tin ca giữ trẻ..." />
    );
  }

  if (error || !branchSlot) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Quay lại
        </Button>
        <Alert severity="error">
          {error || 'Không tìm thấy thông tin ca giữ trẻ'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
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
              color: 'var(--text-primary)',
              flex: 1
            }}
          >
            Chi tiết Ca Giữ Trẻ
          </Typography>
          <Button
            startIcon={<ContentCopy />}
            onClick={handleDuplicate}
            variant="outlined"
            disabled={loading || !branchSlot}
            sx={{
              borderRadius: 'var(--radius-lg)',
              textTransform: 'none',
              fontFamily: 'var(--font-family)',
              borderColor: 'var(--color-primary)',
              color: 'var(--color-primary)',
              '&:hover': {
                borderColor: 'var(--color-primary-dark)',
                backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)'
              }
            }}
          >
            Sao chép
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Thông tin Cơ bản
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Business sx={{ color: 'var(--text-secondary)', fontSize: 24, mt: 0.5 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                        Chi Nhánh
                      </Typography>
                      <Typography variant="h6" fontWeight="medium">
                        {branchSlot.branch?.branchName || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                        Trạng Thái
                      </Typography>
                      <Chip
                        label={statusLabels[status] || status}
                        color={statusColors[status] || 'default'}
                        size="small"
                        sx={{ width: 'fit-content' }}
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <AccessTime sx={{ color: 'var(--text-secondary)', fontSize: 24, mt: 0.5 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                        Khung Giờ
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {branchSlot.timeframe?.name || 'N/A'}
                        {branchSlot.timeframe?.startTime && branchSlot.timeframe?.endTime && (
                          <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                            ({branchSlot.timeframe.startTime} - {branchSlot.timeframe.endTime})
                          </Typography>
                        )}
                      </Typography>
                      {branchSlot.timeframe?.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {branchSlot.timeframe.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                        Loại Ca Giữ Trẻ
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {branchSlot.slotType?.name || 'N/A'}
                      </Typography>
                      {branchSlot.slotType?.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {branchSlot.slotType.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <CalendarToday sx={{ color: 'var(--text-secondary)', fontSize: 24, mt: 0.5 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                        Ngày Trong Tuần
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {weekDayLabel}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {branchSlot.date && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <CalendarToday sx={{ color: 'var(--text-secondary)', fontSize: 24, mt: 0.5 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                          Ngày Cụ Thể
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formatDateOnlyUTC7(branchSlot.date)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <School sx={{ color: 'var(--text-secondary)', fontSize: 24, mt: 0.5 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                        Cấp Độ Học Sinh
                      </Typography>
                      {(() => {
                        const explicitLevels = Array.isArray(branchSlot?.allowedStudentLevels)
                          ? branchSlot.allowedStudentLevels
                              .map(l => l?.name || l?.levelName || l)
                              .filter(Boolean)
                          : [];
                        const packageLevels = Array.isArray(branchSlot?.slotType?.assignedPackages)
                          ? branchSlot.slotType.assignedPackages
                              .map(p => p?.studentLevel?.name || p?.studentLevel?.levelName)
                              .filter(Boolean)
                          : [];
                        const levelNames = Array.from(new Set([...(explicitLevels || []), ...(packageLevels || [])]));
                        return levelNames.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {levelNames.map((name, idx) => (
                              <Chip key={`${name}-${idx}`} label={name} size="small" variant="outlined" />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">N/A</Typography>
                        );
                      })()}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Rooms and Staff Combined Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MeetingRoom sx={{ fontSize: 24, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Phòng và Nhân Viên ({rooms.length} phòng, {roomsWithStaff.reduce((total, item) => total + (item.staff?.length || 0), 0)} nhân viên)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<AssignRoomIcon />}
                    onClick={handleAssignRooms}
                    disabled={loading || !branchSlot}
                    size="small"
                  >
                    Gán Phòng
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AssignStaffIcon />}
                    onClick={handleAssignStaff}
                    disabled={loading || !branchSlot}
                    size="small"
                  >
                    Gán Nhân Viên
                  </Button>
                </Box>
              </Box>
              {(rooms.length > 0 || roomsWithStaff.length > 0) ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Tên Phòng</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Cơ Sở</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Sức Chứa</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Nhân Viên Được Phân Công</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 100 }}>Thao Tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {roomsWithStaff.map((item, index) => {
                        if (!item.room) {
                          // Staff without room
                          return (
                            <TableRow key="unassigned" hover>
                              <TableCell colSpan={3}>
                                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                  Chưa gán phòng
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {item.staff.length > 0 ? (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {item.staff.map((staff, idx) => (
                                      <Box 
                                        key={staff.staffId || staff.id || idx} 
                                        sx={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          gap: 1,
                                          p: 1,
                                          borderRadius: 1,
                                          backgroundColor: 'rgba(255, 152, 0, 0.1)',
                                          '&:hover': {
                                            backgroundColor: 'rgba(255, 152, 0, 0.15)'
                                          }
                                        }}
                                      >
                                        <Person sx={{ fontSize: 18, color: 'warning.main' }} />
                                        <Box sx={{ flex: 1 }}>
                                          <Typography variant="body2" fontWeight="medium">
                                            {staff.staffName || staff.fullName || 'N/A'}
                                          </Typography>
                                          {staff.staffRole || staff.roleName ? (
                                            <Chip
                                              label={staff.staffRole || staff.roleName}
                                              size="small"
                                              variant="outlined"
                                              sx={{ mt: 0.5, height: 22, fontSize: '0.75rem' }}
                                            />
                                          ) : null}
                                        </Box>
                                        <Tooltip title="Gỡ nhân viên">
                                          <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleUnassignStaff(staff)}
                                            disabled={unassigning}
                                            sx={{ ml: 1 }}
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      </Box>
                                    ))}
                                  </Box>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    Không có
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          );
                        }
                        
                        return (
                          <TableRow key={item.room.id || item.room.roomId || index} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MeetingRoom sx={{ fontSize: 18, color: 'text.secondary' }} />
                                <Typography variant="body2" fontWeight="medium">
                                  {item.room.roomName || item.room.name || 'N/A'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {item.room.facilityName || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {item.room.capacity || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {item.staff.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  {item.staff.map((staff, idx) => (
                                    <Box 
                                      key={staff.staffId || staff.id || idx} 
                                      sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 1,
                                        p: 1,
                                        borderRadius: 1,
                                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                        '&:hover': {
                                          backgroundColor: 'rgba(0, 0, 0, 0.05)'
                                        }
                                      }}
                                    >
                                      <Person sx={{ fontSize: 18, color: 'primary.main' }} />
                                      <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" fontWeight="medium">
                                          {staff.staffName || staff.fullName || 'N/A'}
                                        </Typography>
                                        {staff.staffRole || staff.roleName ? (
                                          <Chip
                                            label={staff.staffRole || staff.roleName}
                                            size="small"
                                            variant="outlined"
                                            sx={{ mt: 0.5, height: 22, fontSize: '0.75rem' }}
                                          />
                                        ) : null}
                                      </Box>
                                      <Tooltip title="Gỡ nhân viên">
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => handleUnassignStaff(staff)}
                                          disabled={unassigning}
                                          sx={{ ml: 1 }}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  ))}
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                  Chưa có nhân viên được phân công
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                <Tooltip title="Xem danh sách học sinh">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleViewStudents(item.room)}
                                    disabled={unassigning || changeRoomLoading}
                                  >
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Đổi phòng">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleChangeRoom(item.room)}
                                    disabled={unassigning || changeRoomLoading}
                                  >
                                    <SwapHoriz fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Gỡ phòng">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleUnassignRoom(item.room)}
                                    disabled={unassigning || changeRoomLoading}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  Chưa có phòng nào được gán
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Assign Staff Dialog */}
      <ManagementFormDialog
        open={assignStaffDialog.open}
        onClose={() => setAssignStaffDialog({ open: false, rooms: [], staffByRoom: null, selectedRoomId: '', roomsWithStaff: null, allAssignedStaffIds: null })}
        mode="create"
        title="Gán Nhân Viên"
        icon={AssignStaffIcon}
        loading={assignStaffLoading || loadingRooms || dependenciesLoading}
        maxWidth="sm"
      >
        <Form
          key={`assign-staff-${id || 'new'}-${assignStaffDialog.selectedRoomId || 'no-room'}`}
          schema={assignStaffSchema}
          defaultValues={assignStaffDefaultValues}
          onSubmit={handleAssignStaffSubmit}
          submitText="Gán Nhân Viên"
          loading={assignStaffLoading || loadingRooms || dependenciesLoading}
          disabled={assignStaffLoading || loadingRooms || dependenciesLoading}
          fields={assignStaffFormFields}
        />
      </ManagementFormDialog>

      {/* Assign Rooms Dialog */}
      <ManagementFormDialog
        open={assignRoomsDialog.open}
        onClose={() => {
          setAssignRoomsDialog({ open: false });
          setAssignedRooms([]);
        }}
        mode="create"
        title="Gán Phòng"
        icon={AssignRoomIcon}
        loading={assignRoomsLoading || loadingAssignedRooms || dependenciesLoading}
        maxWidth="sm"
      >
        <Form
          key={`assign-rooms-${id || 'new'}`}
          schema={assignRoomsSchema}
          defaultValues={assignRoomsDefaultValues}
          onSubmit={handleAssignRoomsSubmit}
          submitText="Gán Phòng"
          loading={assignRoomsLoading || loadingAssignedRooms || dependenciesLoading}
          disabled={assignRoomsLoading || loadingAssignedRooms || dependenciesLoading}
          fields={assignRoomsFormFields}
        />
      </ManagementFormDialog>

      {/* Duplicate Dialog */}
      <ManagementFormDialog
        open={duplicateDialog.open}
        onClose={() => setDuplicateDialog({ open: false, dates: [null] })}
        mode="create"
        title="Sao chép Ca Giữ Trẻ"
        icon={ContentCopy}
        loading={duplicateLoading}
        maxWidth="sm"
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Chọn các ngày để tạo bản sao của ca giữ trẻ này. Nếu không chọn ngày nào, sẽ tạo một bản sao với ngày của ca gốc.
          </Typography>
          
          {duplicateDialog.dates.map((date, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
              <TextField
                type="date"
                label={`Ngày ${index + 1} (DD/MM/YYYY)`}
                value={date ? (date instanceof Date ? (() => {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  return `${year}-${month}-${day}`;
                })() : typeof date === 'string' ? date.split('T')[0] : '') : ''}
                onChange={(e) => {
                  const newDates = [...duplicateDialog.dates];
                  const value = e.target.value;

                  if (value) {
                    try {
                      // Handle YYYY-MM-DD format from calendar picker
                      if (value.includes('-') && value.length === 10) {
                        const parts = value.split('-');
                        if (parts.length === 3) {
                          const year = parseInt(parts[0], 10);
                          const month = parseInt(parts[1], 10) - 1; // 0-based
                          const day = parseInt(parts[2], 10);

                          // Create date at local timezone
                          const dateObj = new Date(year, month, day);

                          // Validate the date
                          if (dateObj.getFullYear() === year &&
                              dateObj.getMonth() === month &&
                              dateObj.getDate() === day) {
                            newDates[index] = dateObj;
                          } else {
                            newDates[index] = null;
                          }
                        } else {
                          newDates[index] = null;
                        }
                      } else {
                        newDates[index] = null;
                      }
                    } catch (error) {
                      newDates[index] = null;
                    }
                  } else {
                    newDates[index] = null;
                  }

                  setDuplicateDialog({ ...duplicateDialog, dates: newDates });
                }}
                fullWidth
                variant="standard"
                InputLabelProps={{
                  shrink: true
                }}
                inputProps={{
                  min: '1900-01-01',
                  max: '2099-12-31'
                }}
                helperText="Chọn từ lịch hoặc nhập ngày theo format YYYY-MM-DD"
              />
              {duplicateDialog.dates.length > 1 && (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => {
                    const newDates = duplicateDialog.dates.filter((_, i) => i !== index);
                    setDuplicateDialog({ ...duplicateDialog, dates: newDates });
                  }}
                  sx={{ flexShrink: 0, mt: 1 }}
                >
                  <RemoveIcon />
                </IconButton>
              )}
            </Box>
          ))}
          
          <Button
            startIcon={<AddIcon />}
            onClick={() => {
              setDuplicateDialog({
                ...duplicateDialog,
                dates: [...duplicateDialog.dates, null]
              });
            }}
            variant="outlined"
            size="small"
            sx={{ mb: 3, width: '100%' }}
          >
            Thêm ngày khác
          </Button>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              onClick={() => setDuplicateDialog({ open: false, dates: [null] })}
              disabled={duplicateLoading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleDuplicateSubmit}
              variant="contained"
              disabled={duplicateLoading}
              startIcon={<ContentCopy />}
            >
              {duplicateLoading ? 'Đang sao chép...' : 'Sao chép'}
            </Button>
          </Box>
        </Box>
      </ManagementFormDialog>

      {/* Change Room Dialog */}
      <ManagementFormDialog
        open={changeRoomDialog.open}
        onClose={() => setChangeRoomDialog({ open: false, oldRoom: null, newRoomId: '' })}
        mode="create"
        title="Đổi Phòng"
        icon={SwapHoriz}
        loading={changeRoomLoading || dependenciesLoading}
        maxWidth="sm"
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Đổi phòng từ "{changeRoomDialog.oldRoom?.roomName || changeRoomDialog.oldRoom?.name || 'N/A'}" sang phòng mới. Tất cả học sinh và nhân viên sẽ được chuyển sang phòng mới.
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Phòng mới</InputLabel>
            <Select
              value={changeRoomDialog.newRoomId || ''}
              onChange={(e) => {
                setChangeRoomDialog({
                  ...changeRoomDialog,
                  newRoomId: e.target.value
                });
              }}
              label="Phòng mới"
              disabled={changeRoomLoading || dependenciesLoading || changeRoomSelectOptions.length === 0}
            >
              <MenuItem value="">
                <em>Chọn phòng mới</em>
              </MenuItem>
              {changeRoomSelectOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {changeRoomSelectOptions.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Không có phòng nào khả dụng để chuyển đổi
              </Typography>
            )}
          </FormControl>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              onClick={() => setChangeRoomDialog({ open: false, oldRoom: null, newRoomId: '' })}
              disabled={changeRoomLoading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleChangeRoomSubmit}
              variant="contained"
              disabled={changeRoomLoading || !changeRoomDialog.newRoomId || changeRoomSelectOptions.length === 0}
              startIcon={<SwapHoriz />}
            >
              {changeRoomLoading ? 'Đang đổi...' : 'Đổi phòng'}
            </Button>
          </Box>
        </Box>
      </ManagementFormDialog>

      {/* Student List Dialog */}
      <ManagementFormDialog
        open={studentListDialog.open}
        onClose={() => {
          setStudentListDialog({ open: false, room: null, branchSlotId: null });
          setStudents([]);
          setStudentListPage(0);
          setStudentListRowsPerPage(10);
          setStudentListKeyword('');
          setStudentListDate(null);
        }}
        mode="view"
        title={`Danh sách học sinh - ${studentListDialog.room?.roomName || studentListDialog.room?.name || 'Phòng'}`}
        icon={Person}
        loading={studentListLoading}
        maxWidth="lg"
      >
        <Box sx={{ p: 2 }}>
          {/* Search and Filter Section */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Tìm kiếm theo tên học sinh..."
              value={studentListKeyword}
              onChange={(e) => setStudentListKeyword(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setStudentListPage(0);
                }
              }}
            />
            <TextField
              type="date"
              label="Lọc theo ngày"
              value={studentListDate ? (studentListDate instanceof Date ? studentListDate.toLocaleDateString('sv-SE') : typeof studentListDate === 'string' ? studentListDate.split('T')[0] : '') : ''}
              onChange={(e) => {
                if (e.target.value) {
                  // Create date in local timezone
                  setStudentListDate(new Date(e.target.value + 'T00:00:00'));
                } else {
                  setStudentListDate(null);
                }
                setStudentListPage(0);
              }}
              InputLabelProps={{
                shrink: true,
              }}
              size="small"
              sx={{ minWidth: 200 }}
            />
            {(studentListKeyword || studentListDate) && (
              <Button
                variant="outlined"
                onClick={() => {
                  setStudentListKeyword('');
                  setStudentListDate(null);
                  setStudentListPage(0);
                }}
                size="small"
              >
                Xóa bộ lọc
              </Button>
            )}
          </Box>

          {/* Student List Table */}
          <DataTable
            data={students.filter(student => {
              // Client-side filtering by keyword
              if (studentListKeyword && studentListKeyword.trim()) {
                const keyword = studentListKeyword.toLowerCase().trim();
                const studentName = (student.studentName || '').toLowerCase();
                const parentName = (student.parentName || '').toLowerCase();
                if (!studentName.includes(keyword) && !parentName.includes(keyword)) {
                  return false;
                }
              }
              return true;
            })}
            columns={[
              {
                key: 'studentName',
                header: 'Tên Học Sinh',
                render: (value, item) => {
                  const studentName = value || item?.studentName || 'Chưa có tên';
                  return (
                    <Typography variant="body1" fontWeight="medium">
                      {studentName}
                    </Typography>
                  );
                }
              },
              {
                key: 'parentName',
                header: 'Phụ Huynh',
                render: (value, item) => {
                  const parentName = value || item?.parentName || 'Chưa có thông tin';
                  return (
                    <Typography variant="body2" color="text.secondary">
                      {parentName}
                    </Typography>
                  );
                }
              },
              {
                key: 'date',
                header: 'Ngày',
                render: (value) => (
                  <Typography variant="body2" color="text.secondary">
                    {value ? formatDateOnlyUTC7(value) : 'N/A'}
                  </Typography>
                )
              },
              {
                key: 'status',
                header: 'Trạng Thái',
                render: (value) => {
                  const statusLower = (value || '').toLowerCase();
                  const statusMap = {
                    'booked': { label: 'Đã đăng ký', color: 'success' },
                    'attended': { label: 'Đã tham gia', color: 'primary' },
                    'absent': { label: 'Vắng mặt', color: 'error' },
                    'cancelled': { label: 'Đã hủy', color: 'default' },
                    'available': { label: 'Có sẵn', color: 'info' },
                    'completed': { label: 'Hoàn thành', color: 'success' }
                  };
                  const status = statusMap[statusLower] || { label: value || 'N/A', color: 'default' };
                  return (
                    <Chip
                      label={status.label}
                      color={status.color}
                      size="small"
                    />
                  );
                }
              },
              {
                key: 'parentNote',
                header: 'Ghi Chú',
                render: (value, item) => {
                  const note = value || item?.parentNote || null;
                  return (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {note || '-'}
                    </Typography>
                  );
                }
              }
            ]}
            loading={studentListLoading}
            page={studentListPage}
            rowsPerPage={studentListRowsPerPage}
            totalCount={students.filter(student => {
              // Client-side filtering by keyword for total count
              if (studentListKeyword && studentListKeyword.trim()) {
                const keyword = studentListKeyword.toLowerCase().trim();
                const studentName = (student.studentName || '').toLowerCase();
                const parentName = (student.parentName || '').toLowerCase();
                if (!studentName.includes(keyword) && !parentName.includes(keyword)) {
                  return false;
                }
              }
              return true;
            }).length}
            onPageChange={(event, newPage) => setStudentListPage(newPage)}
            onRowsPerPageChange={(e) => {
              setStudentListRowsPerPage(parseInt(e.target.value, 10));
              setStudentListPage(0);
            }}
            emptyMessage="Không có học sinh nào trong phòng này."
            showActions={false}
          />
        </Box>
      </ManagementFormDialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, type: null, item: null, onConfirm: null })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.type === 'staff' ? 'Gỡ Nhân Viên' : 'Gỡ Phòng'}
        description={
          confirmDialog.type === 'staff'
            ? `Bạn có chắc chắn muốn gỡ nhân viên "${confirmDialog.item?.name}" khỏi ca giữ trẻ này?`
            : `Bạn có chắc chắn muốn gỡ phòng "${confirmDialog.item?.name}" khỏi ca giữ trẻ này? Tất cả nhân viên trong phòng này cũng sẽ bị gỡ.`
        }
        confirmText="Gỡ"
        cancelText="Hủy"
        confirmColor="error"
      />
    </Box>
  );
};

export default BranchSlotDetail;


