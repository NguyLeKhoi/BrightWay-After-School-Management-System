import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  Box, 
  Typography, 
  Alert, 
  Paper, 
  Button,
  Chip,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { 
  ArrowBack, 
  ViewList, 
  CalendarMonth, 
  CalendarToday,
  AccessTime,
  MeetingRoom,
  Person,
  CheckCircle
} from '@mui/icons-material';
import studentSlotService from '../../../services/studentSlot.service';
import { useLoading } from '../../../hooks/useLoading';
import Loading from '../../../components/Common/Loading';
import ContentLoading from '../../../components/Common/ContentLoading';
import DataTable from '../../../components/Common/DataTable';
import { useApp } from '../../../contexts/AppContext';
import { extractDateString, formatDateOnlyUTC7 } from '../../../utils/dateHelper';
import styles from './assignments.module.css';

const StaffAssignments = () => {
  const navigate = useNavigate();
  const [scheduleData, setScheduleData] = useState([]);
  const [rawSlots, setRawSlots] = useState({
    past: [],
    current: [],
    upcoming: [],
    all: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('schedule'); // 'card' or 'schedule' - default to calendar

  
  // Pagination states for each section
  const [pagination, setPagination] = useState({
    current: { page: 0, rowsPerPage: 10 },
    upcoming: { page: 0, rowsPerPage: 10 },
    past: { page: 0, rowsPerPage: 10 }
  });
  
  const { isLoading, showLoading, hideLoading } = useLoading();
  const { showGlobalError } = useApp();

  // Màu sắc cho các trạng thái
  const getStatusColor = (status) => {
    return 'var(--color-primary)';
  };

  // Xác định loại lịch: past, current, upcoming
  const getSlotTimeType = (slot) => {
    const dateValue = slot.branchSlot?.date || slot.date;
    const timeframe = slot.timeframe || slot.timeFrame;
    
    if (!dateValue || !timeframe) return 'upcoming';
    
    try {
      const dateStr = extractDateString(dateValue);
      const startTime = timeframe.startTime || '00:00:00';
      const endTime = timeframe.endTime || '00:00:00';
      
      const formatTime = (time) => {
        if (!time) return '00:00:00';
        if (time.length === 5) return time + ':00';
        return time;
      };
      
      const formattedStartTime = formatTime(startTime);
      const formattedEndTime = formatTime(endTime);
      
      // Parse date with UTC+7 timezone to ensure correct comparison
      const startDateTime = new Date(`${dateStr}T${formattedStartTime}+07:00`);
      const endDateTime = new Date(`${dateStr}T${formattedEndTime}+07:00`);
      const now = new Date();
      
      if (endDateTime < now) {
        return 'past';
      } else if (startDateTime <= now && now <= endDateTime) {
        return 'current';
      } else {
        return 'upcoming';
      }
    } catch (error) {
      return 'upcoming';
    }
  };

  // Màu sắc cho từng loại lịch
  const getTimeTypeColor = (timeType) => {
    switch (timeType) {
      case 'past':
        return '#9e9e9e'; // Gray - đã qua
      case 'current':
        return '#ff9800'; // Orange - đang diễn ra
      case 'upcoming':
        return 'var(--color-primary)'; // Teal - sắp tới
      default:
        return 'var(--color-primary)';
    }
  };

  // Chuyển đổi student slot từ API sang format FullCalendar (cho từng slot riêng lẻ)
  const transformSlotToEvent = (studentSlot) => {
    // studentSlot có thể có branchSlot bên trong hoặc đã được merge
    const branchSlot = studentSlot.branchSlot;
    const dateValue = studentSlot.date || branchSlot?.date; // Ưu tiên date từ studentSlot (ngày cụ thể của booking)
    if (!dateValue) {
      return null;
    }

    const timeframe = branchSlot?.timeframe || branchSlot?.timeFrame || studentSlot.timeframe || studentSlot.timeFrame;
    if (!timeframe) {
      return null;
    }

    const dateStr = extractDateString(dateValue);
    if (!dateStr) {
      return null;
    }
    
    const startTime = timeframe.startTime || '00:00:00';
    const endTime = timeframe.endTime || '00:00:00';
    
    const formatTime = (time) => {
      if (!time) return '00:00:00';
      if (time.length === 5) return time + ':00';
      return time;
    };
    
    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);
    
    // Format with UTC+7 timezone to ensure correct date/time display
    const startDateTime = `${dateStr}T${formattedStartTime}+07:00`;
    const endDateTime = `${dateStr}T${formattedEndTime}+07:00`;

    const status = studentSlot.status || 'Booked';
    const backgroundColor = getStatusColor(status);

    const roomName = branchSlot?.roomName || studentSlot.room?.roomName || studentSlot.roomName || 'Chưa xác định';
    const branchName = branchSlot?.branch?.branchName || branchSlot?.branchName || studentSlot.branchName || 'Chưa xác định';
    const timeframeName = timeframe.name || 'Chưa xác định';

    const formatTimeDisplay = (time) => {
      if (!time) return '00:00';
      return time.substring(0, 5);
    };

    const timeDisplay = `${formatTimeDisplay(startTime)}-${formatTimeDisplay(endTime)}`;
    const studentName = studentSlot.student?.name || studentSlot.studentName || 'Chưa xác định';

    // Sử dụng date từ studentSlot để xác định timeType
    const timeType = getSlotTimeType({
      date: dateValue,
      branchSlot: { date: dateValue },
      timeframe: timeframe
    });
    const timeTypeColor = getTimeTypeColor(timeType);

    // Lấy branchSlotId từ branchSlot
    const branchSlotId = branchSlot?.id || studentSlot.branchSlotId;
    const studentSlotId = studentSlot.studentSlotId || studentSlot.id;
    
    return {
      id: studentSlotId, // studentSlotId
      title: `${timeframeName} - ${roomName}`, // Bỏ studentName, chỉ hiển thị timeframe và room
      start: startDateTime,
      end: endDateTime,
      backgroundColor: timeTypeColor,
      borderColor: timeTypeColor,
      textColor: 'white',
      display: 'block',
      classNames: ['custom-event', `event-${timeType}`],
      extendedProps: {
        status: status,
        roomName: roomName,
        branchName: branchName,
        studentName: studentName, // Giữ lại để dùng trong detail, nhưng không hiển thị
        timeframe: timeframe,
        timeframeName: timeframeName,
        timeDisplay: timeDisplay,
        slotId: studentSlotId, // studentSlotId
        branchSlotId: branchSlotId, // branchSlotId để navigate
        timeType: timeType,
        studentCount: studentSlot.studentCount || 1, // Số lượng học sinh trong slot này
        studentSlots: studentSlot.studentSlots || [] // Danh sách studentSlots (nếu có)
      }
    };
  };

  // Hàm helper để load tất cả các trang
  const fetchAllStaffSlots = async () => {
    const allSlots = [];
    let pageIndex = 1;
    const pageSize = 100;
    let hasMore = true;
    let totalCount = 0;
    let totalPages = 0;

    while (hasMore) {
      const response = await studentSlotService.getStaffSlots({
        pageIndex: pageIndex,
        pageSize: pageSize,
        upcomingOnly: false
      });

      const items = response?.items || [];
      
      if (pageIndex === 1) {
        totalCount = response?.totalCount || 0;
        totalPages = response?.totalPages;
        
        if (!totalPages && totalCount > 0) {
          totalPages = Math.ceil(totalCount / pageSize);
        }
      }

      if (items.length > 0) {
        allSlots.push(...items);
      }

      if (totalPages > 0) {
        if (pageIndex >= totalPages) {
          hasMore = false;
        } else {
          pageIndex++;
        }
      } else {
        if (items.length < pageSize) {
          hasMore = false;
        } else {
          pageIndex++;
        }
      }
    }

    return allSlots;
  };

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      showLoading();

      // Lấy tất cả branch slots (API trả về BranchSlot với studentSlots array)
      const branchSlots = await fetchAllStaffSlots();
      
      // Transform BranchSlot thành format hiển thị
      // Mỗi BranchSlot có thể có nhiều studentSlots, nhưng ta hiển thị BranchSlot như một row
      const transformedSlots = branchSlots.map(branchSlot => {
        // Lấy thông tin từ branchSlot
        const dateValue = branchSlot.date || branchSlot.branchSlot?.date;
        const timeframe = branchSlot.timeframe || branchSlot.timeFrame;
        const roomName = branchSlot.roomName || branchSlot.room?.roomName || branchSlot.branchSlot?.roomName || 'Chưa xác định';
        const branchName = branchSlot.branch?.branchName || branchSlot.branchName || 'Chưa xác định';
        const status = branchSlot.status || 'Available';
        
        // Đếm số học sinh đã đăng ký (chỉ tính Booked và Completed)
        const studentSlots = branchSlot.studentSlots || [];
        const bookedCount = studentSlots.filter(ss => 
          ss.status === 'Booked' || ss.status === 'Completed'
        ).length;
        
        // Đếm tổng số studentSlots có status hợp lệ (không tính Cancelled, NoShow)
        // Đây là số học sinh thực tế đã từng đăng ký (bao gồm cả Completed)
        const validStudentSlotsCount = studentSlots.filter(ss => 
          ss.status !== 'Cancelled' && ss.status !== 'NoShow'
        ).length;
        
        return {
          id: branchSlot.id, // BranchSlot ID
          branchSlotId: branchSlot.id,
          date: dateValue,
          timeframe: timeframe,
          roomName: roomName,
          branchName: branchName,
          status: status,
          studentCount: bookedCount, // Số học sinh đã đăng ký (Booked/Completed)
          totalValidSlots: validStudentSlotsCount, // Tổng số slot hợp lệ (không tính Cancelled, NoShow)
          studentSlots: studentSlots, // Giữ lại để dùng trong detail
          // Giữ lại các field cũ để tương thích
          branchSlot: branchSlot
        };
      });
      
      // Phân loại slots theo thời gian
      const now = new Date();
      const pastSlots = [];
      const currentSlots = [];
      const upcomingSlots = [];

      transformedSlots.forEach(slot => {
        const timeType = getSlotTimeType(slot);
        if (timeType === 'past') {
          pastSlots.push(slot);
        } else if (timeType === 'current') {
          currentSlots.push(slot);
        } else {
          upcomingSlots.push(slot);
        }
      });

      // Sắp xếp: past (mới nhất trước), upcoming (sớm nhất trước)
      pastSlots.sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateB - dateA;
      });

      upcomingSlots.sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateA - dateB;
      });

      setRawSlots({
        past: pastSlots,
        current: currentSlots,
        upcoming: upcomingSlots,
        all: transformedSlots
      });

      // Transform slots to events for calendar
      // Group studentSlots theo branchSlot + date + room để tránh duplicate
      const events = [];
      const eventMap = new Map(); // Key: `${branchSlotId}_${dateStr}_${roomName}`
      
      branchSlots.forEach(branchSlot => {
        const studentSlots = branchSlot.studentSlots || [];
        const timeframe = branchSlot.timeframe || branchSlot.timeFrame;
        const roomName = branchSlot.roomName || 'Chưa xác định';
        
        // Group studentSlots theo date
        const slotsByDate = new Map();
        studentSlots.forEach(studentSlot => {
          const dateValue = studentSlot.date || branchSlot.date;
          if (!dateValue) return;
          
          const dateStr = extractDateString(dateValue);
          if (!dateStr) return;
          
          if (!slotsByDate.has(dateStr)) {
            slotsByDate.set(dateStr, []);
          }
          slotsByDate.get(dateStr).push(studentSlot);
        });
        
        // Tạo 1 event cho mỗi date (không tạo event riêng cho từng studentSlot)
        slotsByDate.forEach((slotsForDate, dateStr) => {
          const eventKey = `${branchSlot.id}_${dateStr}_${roomName}`;
          
          // Chỉ tạo event nếu chưa có (tránh duplicate)
          if (!eventMap.has(eventKey)) {
            // Lấy studentSlot đầu tiên để lấy thông tin date
            const firstSlot = slotsForDate[0];
            const event = transformSlotToEvent({
              ...firstSlot,
              branchSlot: branchSlot,
              timeframe: timeframe,
              room: { roomName: roomName },
              branch: branchSlot.branch,
              studentCount: slotsForDate.length // Thêm số lượng học sinh
            });
            
            if (event) {
              // Cập nhật extendedProps để lưu tất cả studentSlots cho ngày đó
              event.extendedProps.studentSlots = slotsForDate;
              event.extendedProps.studentCount = slotsForDate.length;
              eventMap.set(eventKey, event);
              events.push(event);
            }
          }
        });
      });

      setScheduleData(events);
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải lịch giữ trẻ';
      setError(errorMessage);
      showGlobalError(errorMessage);
      console.error('Error fetching schedule:', err);
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  useEffect(() => {
    fetchSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Event handlers cho FullCalendar
  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    // event.extendedProps.slotId là studentSlotId, nhưng ta cần branchSlotId
    // Lấy từ extendedProps hoặc tìm branchSlotId từ event data
    const branchSlotId = event.extendedProps.branchSlotId || event.extendedProps.slotId;
    
    if (branchSlotId) {
      navigate(`/staff/assignments/${branchSlotId}`);
    }
  };

  // Handler cho xem chi tiết
  const handleViewDetail = (slot) => {
    // slot.id là branchSlotId
    if (slot && slot.id) {
      navigate(`/staff/assignments/${slot.id}`);
    }
  };

  // Handler cho view mode change
  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // Pagination handlers
  const handlePageChange = (section, newPage) => {
    setPagination(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        page: newPage
      }
    }));
  };

  const handleRowsPerPageChange = (section, newRowsPerPage) => {
    setPagination(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        rowsPerPage: newRowsPerPage,
        page: 0 // Reset to first page when changing rows per page
      }
    }));
  };

  // Ngăn chặn drag & drop và các thao tác chỉnh sửa
  const handleDateSelect = () => {
    return false;
  };

  const handleEventDrop = (dropInfo) => {
    dropInfo.revert();
  };

  const handleEventResize = (resizeInfo) => {
    resizeInfo.revert();
  };

  // Define columns for DataTable
  const tableColumns = useMemo(() => {
    const statusLabels = {
      'Booked': 'Đã đăng ký',
      'Confirmed': 'Đã xác nhận',
      'Cancelled': 'Đã hủy',
      'Completed': 'Đã hoàn thành',
      'Pending': 'Chờ xử lý'
    };

    const formatTimeDisplay = (time) => {
      if (!time) return '00:00';
      return time.substring(0, 5);
    };

    const getTimeTypeLabel = (timeType) => {
      switch (timeType) {
        case 'past':
          return 'Đã qua';
        case 'current':
          return 'Đang diễn ra';
        case 'upcoming':
          return 'Sắp tới';
        default:
          return '';
      }
    };

    return [
      {
        key: 'date',
        header: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarToday fontSize="small" />
            <span>Ngày</span>
          </Box>
        ),
        render: (value, item) => {
          const dateValue = item.branchSlot?.date || item.date;
          const timeType = getSlotTimeType(item);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {dateValue ? formatDateOnlyUTC7(dateValue) : 'Chưa xác định'}
              <Chip
                label={getTimeTypeLabel(timeType)}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  backgroundColor: getTimeTypeColor(timeType),
                  color: 'white',
                  fontWeight: 600
                }}
              />
            </Box>
          );
        }
      },
      {
        key: 'time',
        header: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime fontSize="small" />
            <span>Giờ</span>
          </Box>
        ),
        render: (value, item) => {
          const timeframe = item.timeframe || item.timeFrame;
          if (!timeframe) return 'Chưa xác định';
          return `${formatTimeDisplay(timeframe.startTime)}-${formatTimeDisplay(timeframe.endTime)}`;
        }
      },
      {
        key: 'room',
        header: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MeetingRoom fontSize="small" />
            <span>Phòng</span>
          </Box>
        ),
        render: (value, item) => {
          return item.room?.roomName || item.roomName || item.branchSlot?.roomName || 'Chưa xác định';
        }
      },
      {
        key: 'students',
        header: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person fontSize="small" />
            <span>Số học sinh</span>
          </Box>
        ),
        render: (value, item) => {
          const studentCount = item.studentCount || 0;
          const totalValidSlots = item.totalValidSlots || 0;
          // Chỉ hiển thị "/ total" nếu có sự khác biệt và total > 0
          // totalValidSlots bao gồm cả Completed, nên có thể lớn hơn studentCount
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" fontWeight="medium">
                {studentCount}
              </Typography>
              {totalValidSlots > studentCount && totalValidSlots > 0 && (
                <Typography variant="caption" color="text.secondary">
                  / {totalValidSlots}
                </Typography>
              )}
            </Box>
          );
        }
      },
      {
        key: 'status',
        header: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle fontSize="small" />
            <span>Trạng thái</span>
          </Box>
        ),
        render: (value, item) => {
          const status = item.status || 'Available';
          return (
            <Chip
              label={status === 'Available' ? 'Có sẵn' : (statusLabels[status] || status)}
              size="small"
              sx={{
                backgroundColor: getStatusColor(status),
                color: 'white',
                fontWeight: 600
              }}
            />
          );
        }
      }
    ];
  }, []);

  if (loading) {
    return (
      <div className={styles.schedulePage}>
        <div className={styles.container}>
          <ContentLoading isLoading={true} text="Đang tải lịch giữ trẻ..." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.schedulePage}>
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/staff/dashboard')}
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
              <Box>
                <Typography 
                  variant="h4" 
                  component="h1"
                  sx={{
                    fontFamily: 'var(--font-family-heading)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--text-primary)',
                    marginBottom: 0.5
                  }}
                >
                  Lịch giữ trẻ
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'var(--font-family)' }}>
                  Xem và quản lý các ca giữ trẻ được phân công
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Action Buttons and View Mode Toggle */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="chế độ xem"
            size="small"
          >
            <ToggleButton value="schedule" aria-label="xem lịch">
              <CalendarMonth sx={{ mr: 1 }} />
              Lịch
            </ToggleButton>
            <ToggleButton value="card" aria-label="xem danh sách">
              <ViewList sx={{ mr: 1 }} />
              Danh sách
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Table List View */}
        {viewMode === 'card' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Lịch đang diễn ra */}
            <Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: 2,
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#ff9800',
                    boxShadow: '0 0 8px rgba(255, 152, 0, 0.6)'
                  }}
                />
                Đang diễn ra
              </Typography>
              <DataTable
                data={rawSlots.current.slice(
                  pagination.current.page * pagination.current.rowsPerPage,
                  pagination.current.page * pagination.current.rowsPerPage + pagination.current.rowsPerPage
                )}
                columns={tableColumns}
                loading={false}
                emptyMessage="Chưa có ca giữ trẻ đang diễn ra"
                showActions={rawSlots.current.length > 0}
                onView={handleViewDetail}
                onDelete={null}
                page={pagination.current.page}
                rowsPerPage={pagination.current.rowsPerPage}
                totalCount={rawSlots.current.length}
                onPageChange={(event, newPage) => handlePageChange('current', newPage)}
                onRowsPerPageChange={(event) => handleRowsPerPageChange('current', parseInt(event.target.value, 10))}
                getRowSx={(item) => {
                  return {
                    borderLeft: '4px solid #ff9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.05)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 152, 0, 0.1)'
                    }
                  };
                }}
              />
            </Box>

            {/* Lịch sắp tới */}
            <Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: 2,
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)'
                  }}
                />
                Sắp tới
              </Typography>
              <DataTable
                data={rawSlots.upcoming.slice(
                  pagination.upcoming.page * pagination.upcoming.rowsPerPage,
                  pagination.upcoming.page * pagination.upcoming.rowsPerPage + pagination.upcoming.rowsPerPage
                )}
                columns={tableColumns}
                loading={false}
                emptyMessage="Chưa có ca giữ trẻ sắp tới"
                showActions={rawSlots.upcoming.length > 0}
                onView={handleViewDetail}
                onDelete={null}
                page={pagination.upcoming.page}
                rowsPerPage={pagination.upcoming.rowsPerPage}
                totalCount={rawSlots.upcoming.length}
                onPageChange={(event, newPage) => handlePageChange('upcoming', newPage)}
                onRowsPerPageChange={(event) => handleRowsPerPageChange('upcoming', parseInt(event.target.value, 10))}
                getRowSx={(item) => {
                  return {
                    borderLeft: '4px solid var(--color-primary)',
                    '&:hover': {
                      backgroundColor: 'rgba(92, 189, 185, 0.1)'
                    }
                  };
                }}
              />
            </Box>

            {/* Lịch đã qua */}
            <Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: 2,
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#9e9e9e'
                  }}
                />
                Đã qua
              </Typography>
              <DataTable
                data={rawSlots.past.slice(
                  pagination.past.page * pagination.past.rowsPerPage,
                  pagination.past.page * pagination.past.rowsPerPage + pagination.past.rowsPerPage
                )}
                columns={tableColumns}
                loading={false}
                emptyMessage="Chưa có ca giữ trẻ đã qua"
                showActions={rawSlots.past.length > 0}
                onView={handleViewDetail}
                onDelete={null}
                page={pagination.past.page}
                rowsPerPage={pagination.past.rowsPerPage}
                totalCount={rawSlots.past.length}
                onPageChange={(event, newPage) => handlePageChange('past', newPage)}
                onRowsPerPageChange={(event) => handleRowsPerPageChange('past', parseInt(event.target.value, 10))}
                getRowSx={(item) => {
                  return {
                    borderLeft: '4px solid #9e9e9e',
                    backgroundColor: 'rgba(158, 158, 158, 0.05)',
                    opacity: 0.8,
                    '&:hover': {
                      backgroundColor: 'rgba(158, 158, 158, 0.1)',
                      opacity: 1
                    }
                  };
                }}
              />
            </Box>
          </Box>
        )}

        {/* Schedule View */}
        {viewMode === 'schedule' && (
          <Paper 
            elevation={0}
            sx={{
              padding: 2,
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'transparent'
            }}
          >
            <div className={styles.scheduleContainer}>
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={scheduleData}
                eventClick={handleEventClick}
                selectable={false}
                editable={false}
                droppable={false}
                select={handleDateSelect}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                height="auto"
                locale="vi"
                timeZone="Asia/Ho_Chi_Minh"
                buttonText={{
                  today: 'Hôm nay',
                  month: 'Tháng',
                  week: 'Tuần',
                  day: 'Ngày'
                }}
                dayMaxEvents={3}
                moreLinkClick="popover"
                eventDisplay="block"
                nowIndicator={true}
                allDaySlot={false}
                slotDuration="00:30:00"
                slotLabelInterval="01:00:00"
                slotLabelFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }}
                eventContent={(arg) => {
                  const props = arg.event.extendedProps;
                  const timeframeName = props.timeframeName || '';
                  const roomName = props.roomName || 'Chưa xác định';
                  const timeDisplay = props.timeDisplay || '';
                  const studentCount = props.studentCount || 1;
                  
                  return {
                    html: `
                      <div style="
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-start;
                        gap: 4px;
                        padding: 6px 8px;
                        width: 100%;
                        height: 100%;
                        box-sizing: border-box;
                        color: white;
                        font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
                        overflow: visible;
                      ">
                        <div style="
                          font-weight: 600;
                          font-size: 12px;
                          line-height: 1.3;
                          white-space: normal;
                          word-break: break-word;
                          overflow-wrap: break-word;
                        ">
                          ${timeframeName}
                        </div>
                        <div style="
                          font-size: 11px;
                          line-height: 1.3;
                          opacity: 0.95;
                          word-break: break-word;
                          overflow-wrap: break-word;
                          white-space: normal;
                        ">
                          ${timeDisplay}
                        </div>
                        <div style="
                          font-size: 10px;
                          line-height: 1.2;
                          opacity: 0.9;
                          word-break: break-word;
                          overflow-wrap: break-word;
                          white-space: normal;
                        ">
                          ${roomName}${studentCount > 1 ? ` (${studentCount})` : ''}
                        </div>
                      </div>
                    `
                  };
                }}
                views={{
                  timeGridWeek: {
                    slotMinTime: '12:00:00',
                    slotMaxTime: '21:00:00',
                    allDaySlot: false,
                    eventDisplay: 'block'
                  },
                  timeGridDay: {
                    slotMinTime: '12:00:00',
                    slotMaxTime: '21:00:00',
                    allDaySlot: false,
                    eventDisplay: 'block'
                  },
                  dayGridMonth: {
                    eventDisplay: 'block',
                    displayEventTime: true
                  }
                }}
              />
            </div>
          </Paper>
        )}

        {viewMode === 'schedule' && scheduleData.length === 0 && !loading && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Chưa có ca giữ trẻ nào được phân công.
          </Alert>
        )}
      </div>
    </div>
  );
};

export default StaffAssignments;
