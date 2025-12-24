import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Button,
  Paper
} from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  ChildCare as ChildIcon,
  AccountBalanceWallet as WalletIcon,
  Notifications as NotificationIcon,
  Add as AddIcon,
  ShoppingCart as ShoppingIcon,
  EventAvailable as ScheduleIcon,
  CalendarToday,
  AccessTime,
  MeetingRoom,
  Business,
  ChevronLeft,
  ChevronRight,
  Person
} from '@mui/icons-material';
import AnimatedCard from '../../../components/Common/AnimatedCard';
import Card from '../../../components/Common/Card';
import ContentLoading from '../../../components/Common/ContentLoading';
import { useApp } from '../../../contexts/AppContext';
import useContentLoading from '../../../hooks/useContentLoading';
import studentService from '../../../services/student.service';
import walletService from '../../../services/wallet.service';
import notificationService from '../../../services/notification.service';
import studentSlotService from '../../../services/studentSlot.service';
import { extractDateString, formatDateOnlyUTC7 } from '../../../utils/dateHelper';
import styles from './Dashboard.module.css';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { showGlobalError } = useApp();
  const { isLoading, loadingText, showLoading, hideLoading } = useContentLoading();

  const [stats, setStats] = useState({
    childrenCount: 0,
    walletBalance: 0,
    unreadNotifications: 0
  });

  const [calendarSchedules, setCalendarSchedules] = useState([]);
  const [childrenList, setChildrenList] = useState([]);
  const [currentChildIndex, setCurrentChildIndex] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load calendar when current child changes
  useEffect(() => {
    if (childrenList.length > 0 && currentChildIndex < childrenList.length) {
      loadCalendarSchedules(childrenList[currentChildIndex]);
    }
  }, [currentChildIndex, childrenList]);

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


  const loadCalendarSchedules = async (child) => {
    if (!child) {
      setCalendarSchedules([]);
      return;
    }

    try {
      const allSlots = [];

      // Load tất cả các trang cho child hiện tại
      let pageIndex = 1;
      const pageSize = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await studentSlotService.getStudentSlots({
          StudentId: child.id,
          pageIndex: pageIndex,
          pageSize: pageSize
        });

        const items = response?.items || [];
        const totalCount = response?.totalCount || 0;
        const totalPages = response?.totalPages || Math.ceil(totalCount / pageSize);

        // Thêm thông tin child vào mỗi slot
        items.forEach(slot => {
          allSlots.push({
            ...slot,
            childName: child.name || child.userName || 'Chưa có tên',
            childId: child.id
          });
        });

        if (pageIndex >= totalPages || items.length < pageSize) {
          hasMore = false;
        } else {
          pageIndex++;
        }
      }

      // Transform slots to calendar events
      const events = allSlots.map(slot => {
        const dateValue = slot.branchSlot?.date || slot.date;
        const timeframe = slot.timeframe || slot.timeFrame;

        if (!dateValue || !timeframe) return null;

        const dateStr = extractDateString(dateValue);
        if (!dateStr) return null;

        const startTime = timeframe.startTime || '00:00:00';
        const endTime = timeframe.endTime || '00:00:00';

        const formatTime = (time) => {
          if (!time) return '00:00:00';
          if (time.length === 5) return time + ':00';
          return time;
        };

        const formattedStartTime = formatTime(startTime);
        const formattedEndTime = formatTime(endTime);

        // Format with UTC+7 timezone
        const startDateTime = `${dateStr}T${formattedStartTime}+07:00`;
        const endDateTime = `${dateStr}T${formattedEndTime}+07:00`;

        const timeType = getSlotTimeType(slot);
        const backgroundColor = timeType === 'past' ? '#9e9e9e' :
                               timeType === 'current' ? '#ff9800' : 'var(--color-primary)';

        const formatTimeDisplay = (time) => {
          if (!time) return '00:00';
          return time.substring(0, 5);
        };

        const timeDisplay = `${formatTimeDisplay(startTime)}-${formatTimeDisplay(endTime)}`;

        return {
          id: `${slot.id}_${slot.childId}`,
          title: timeDisplay, // Chỉ hiển thị giờ vì đã biết tên con từ header
          start: startDateTime,
          end: endDateTime,
          backgroundColor: backgroundColor,
          borderColor: backgroundColor,
          textColor: 'white',
          display: 'block',
          classNames: ['custom-event', `event-${timeType}`],
          extendedProps: {
            childName: slot.childName,
            childId: slot.childId,
            timeDisplay: timeDisplay,
            slotId: slot.id,
            timeType: timeType,
            roomName: slot.room?.roomName || slot.roomName || 'Chưa xác định',
            branchName: slot.branchSlot?.branch?.branchName || slot.branchSlot?.branchName || slot.branchName || 'Chưa xác định',
            timeframeName: timeframe.name || 'Chưa xác định',
            studentCount: slot.studentCount || 1
          }
        };
      }).filter(event => event !== null);

      setCalendarSchedules(events);
    } catch (error) {
      setCalendarSchedules([]);
    }
  };

  const loadDashboardData = async () => {
    showLoading();
    try {
      // Load children
      const childrenResponse = await studentService.getMyChildren();
      const children = Array.isArray(childrenResponse) 
        ? childrenResponse 
        : (Array.isArray(childrenResponse?.items) ? childrenResponse.items : []);
      
      setStats(prev => ({ ...prev, childrenCount: children.length }));
      setChildrenList(children);

      // Load wallet balance
      try {
        const wallet = await walletService.getCurrentWallet();
        const balance = wallet?.balance ?? 0;
        setStats(prev => ({ ...prev, walletBalance: balance }));
      } catch (error) {
        setStats(prev => ({ ...prev, walletBalance: 0 }));
      }

      // Load unread notifications count
      try {
        const notifications = await notificationService.getNotifications();
        const notifs = Array.isArray(notifications) 
          ? notifications 
          : (Array.isArray(notifications?.items) ? notifications.items : []);
        const unreadCount = notifs.filter(n => !n.isRead).length;
        setStats(prev => ({ ...prev, unreadNotifications: unreadCount }));
      } catch (error) {
        // Silent fail
      }

      // Load calendar schedules for first child
      if (children && children.length > 0) {
        await loadCalendarSchedules(children[0]);
      } else {
        setCalendarSchedules([]);
      }
    } catch (error) {
      showGlobalError('Không thể tải dữ liệu dashboard');
    } finally {
      hideLoading();
    }
  };

  // Navigation functions for child switching
  const handlePrevChild = () => {
    if (childrenList.length > 1) {
      setCurrentChildIndex(prev => (prev > 0 ? prev - 1 : childrenList.length - 1));
    }
  };

  const handleNextChild = () => {
    if (childrenList.length > 1) {
      setCurrentChildIndex(prev => (prev < childrenList.length - 1 ? prev + 1 : 0));
    }
  };

  // Format số tiền ngắn gọn
  const formatCurrencyShort = (amount) => {
    if (amount === 0) return '0 VNĐ';
    
    const billions = amount / 1000000000;
    const millions = amount / 1000000;
    const thousands = amount / 1000;
    
    if (billions >= 1) {
      // Hiển thị tỷ
      if (billions >= 10) {
        return `${Math.floor(billions)} tỷ VNĐ`;
      } else {
        return `${billions.toFixed(1)} tỷ VNĐ`;
      }
    } else if (millions >= 1) {
      // Hiển thị triệu
      if (millions >= 10) {
        return `${Math.floor(millions)} triệu VNĐ`;
      } else {
        return `${millions.toFixed(1)} triệu VNĐ`;
      }
    } else if (thousands >= 1) {
      // Hiển thị nghìn
      return `${Math.floor(thousands)}K VNĐ`;
    } else {
      return `${amount.toLocaleString('vi-VN')} VNĐ`;
    }
  };

  const statCards = [
    {
      title: 'Con cái',
      value: stats.childrenCount,
      icon: ChildIcon,
      color: 'primary',
      onClick: () => navigate('/user/management/children')
    },
    {
      title: 'Số dư ví',
      value: formatCurrencyShort(stats.walletBalance),
      icon: WalletIcon,
      color: 'warning',
      onClick: () => navigate('/user/finance/wallet')
    },
    {
      title: 'Thông báo',
      value: stats.unreadNotifications,
      icon: NotificationIcon,
      color: 'info',
      onClick: () => navigate('/user/notifications')
    }
  ];

  const quickActions = [
    {
      text: 'Thêm con mới',
      icon: <AddIcon />,
      primary: true,
      onClick: () => navigate('/user/management/children/create')
    },
    {
      text: 'Mua gói dịch vụ',
      icon: <ShoppingIcon />,
      primary: false,
      onClick: () => navigate('/user/management/packages')
    },
    {
      text: 'Nạp tiền ví',
      icon: <WalletIcon />,
      primary: false,
      onClick: () => navigate('/user/finance/wallet')
    },
    {
      text: 'Xem lịch giữ trẻ',
      icon: <ScheduleIcon />,
      primary: false,
      onClick: () => navigate('/user/management/schedule')
    }
  ];

  return (
    <>
      {isLoading && <ContentLoading isLoading={isLoading} text={loadingText} />}
      <motion.div 
        className={styles.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className={styles.title}>
            Tổng quan
          </h1>
          <p className={styles.subtitle}>
            Tổng quan tài khoản của bạn
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <AnimatedCard key={index} delay={index * 0.1} className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statTitle}>
                    {stat.title}
                  </span>
                  <div className={`${styles.statIcon} ${styles[stat.color]}`}>
                    <Icon />
                  </div>
                </div>
                <p className={styles.statValue} onClick={stat.onClick} style={{ cursor: 'pointer' }}>
                  {stat.value}
                </p>
              </AnimatedCard>
            );
          })}
        </div>

        {/* Quick Actions */}
        <AnimatedCard delay={0.4} className={styles.quickActionsCard}>
          <h3 className={styles.quickActionsTitle}>
            Thao tác nhanh
          </h3>
          <div className={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <button
                key={index}
                className={styles.quickActionButton}
                onClick={action.onClick}
                style={{
                  background: action.primary ? 'var(--color-primary)' : 'var(--bg-primary)',
                  color: action.primary ? 'white' : 'var(--text-primary)',
                  borderColor: action.primary ? 'var(--color-primary)' : 'var(--border-light)'
                }}
              >
                <span className={styles.quickActionIcon}>
                  {action.icon}
                </span>
                <span className={styles.quickActionText}>
                  {action.text}
                </span>
              </button>
            ))}
          </div>
        </AnimatedCard>

        {/* Calendar Overview */}
        <AnimatedCard delay={0.5} className={styles.infoCard}>
          <div className={styles.infoHeader}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Person sx={{ color: 'var(--color-primary)', fontSize: 28 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    Lịch giữ trẻ của {childrenList[currentChildIndex]?.name || childrenList[currentChildIndex]?.userName || 'Chưa có tên'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: 0.5 }}>
                    {childrenList.length > 1 ? `${currentChildIndex + 1} / ${childrenList.length} con` : '1 con'}
                  </Typography>
                </Box>
              </Box>
              {childrenList.length > 1 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    onClick={handlePrevChild}
                    variant="outlined"
                    size="small"
                    sx={{
                      minWidth: 36,
                      height: 36,
                      borderRadius: '50%',
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-secondary)',
                      '&:hover': {
                        borderColor: 'var(--color-primary)',
                        backgroundColor: 'rgba(var(--color-primary-rgb), 0.04)'
                      }
                    }}
                  >
                    <ChevronLeft fontSize="small" />
                  </Button>
                  <Button
                    onClick={handleNextChild}
                    variant="outlined"
                    size="small"
                    sx={{
                      minWidth: 36,
                      height: 36,
                      borderRadius: '50%',
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-secondary)',
                      '&:hover': {
                        borderColor: 'var(--color-primary)',
                        backgroundColor: 'rgba(var(--color-primary-rgb), 0.04)'
                      }
                    }}
                  >
                    <ChevronRight fontSize="small" />
                  </Button>
                </Box>
              )}
            </Box>
          </div>
          <Box sx={{ mt: 2 }}>
            <Paper
              elevation={0}
              sx={{
                padding: 2,
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-light)',
                backgroundColor: 'transparent'
              }}
            >
              <div style={{ height: '1000px' }}>
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="timeGridWeek"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'timeGridWeek,dayGridMonth'
                  }}
                  events={calendarSchedules}
                  height="100%"
                  locale="vi"
                  timeZone="Asia/Ho_Chi_Minh"
                  buttonText={{
                    today: 'Hôm nay',
                    week: 'Tuần',
                    month: 'Tháng'
                  }}
                  views={{
                    timeGridWeek: {
                      slotMinTime: '05:00:00',
                      slotMaxTime: '23:00:00',
                      allDaySlot: false,
                      eventDisplay: 'block',
                      slotDuration: '00:30:00',
                      slotLabelInterval: '01:00:00'
                    }
                  }}
                  dayMaxEvents={5}
                  moreLinkClick="popover"
                  eventDisplay="block"
                  eventContent={(arg) => {
                    const props = arg.event.extendedProps;
                    const timeDisplay = props.timeDisplay || '';
                    const roomName = props.roomName || 'Chưa xác định';
                    const branchName = props.branchName || 'Chưa xác định';
                    const timeframeName = props.timeframeName || 'Chưa xác định';

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
                            ${roomName}
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
                            ${timeframeName} • ${branchName}
                          </div>
                        </div>
                      `
                    };
                  }}
                  eventClick={(clickInfo) => {
                    const event = clickInfo.event;
                    const props = event.extendedProps;
                    // Navigate to child's schedule detail with source page info
                    navigate(`/user/management/schedule/${props.childId}/${props.slotId}`, {
                      state: { from: 'dashboard' }
                    });
                  }}
                />
              </div>
            </Paper>
            <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
                <Typography variant="caption" color="text.secondary">Sắp tới</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff9800' }} />
                <Typography variant="caption" color="text.secondary">Đang diễn ra</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#9e9e9e' }} />
                <Typography variant="caption" color="text.secondary">Đã qua</Typography>
              </Box>
            </Box>
          </Box>
        </AnimatedCard>

        {/* Empty State */}
        {stats.childrenCount === 0 && (
          <AnimatedCard delay={0.7} className={styles.infoCard}>
            <div className={styles.emptyState}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <ChildIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
              </Box>
              <h3 className={styles.emptyTitle}>
                Chưa có con nào được đăng ký
              </h3>
              <p className={styles.emptyText}>
                Bắt đầu bằng cách thêm con của bạn vào hệ thống
              </p>
              <button
                className={styles.emptyButton}
                onClick={() => navigate('/user/management/children/create')}
              >
                <AddIcon sx={{ fontSize: 20 }} />
                Thêm con mới
              </button>
            </div>
          </AnimatedCard>
        )}
      </motion.div>
    </>
  );
};

export default UserDashboard;
