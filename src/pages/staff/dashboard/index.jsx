import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper } from '@mui/material';
import {
  Event as EventIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Today as TodayIcon,
  VisibilityOff as VisibilityOffIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  CalendarToday,
  AccessTime,
  MeetingRoom,
  EventAvailable as ScheduleIcon
} from '@mui/icons-material';
import activityService from '../../../services/activity.service';
import studentSlotService from '../../../services/studentSlot.service';
import useContentLoading from '../../../hooks/useContentLoading';
import ContentLoading from '../../../components/Common/ContentLoading';
import AnimatedCard from '../../../components/Common/AnimatedCard';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import { extractDateString, formatDateOnlyUTC7 } from '../../../utils/dateHelper';
import styles from './Dashboard.module.css';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showGlobalError } = useApp();
  const { isLoading, loadingText, showLoading, hideLoading } = useContentLoading();
  
  const [stats, setStats] = useState({
    totalActivities: 0,
    activitiesThisMonth: 0,
    totalSlots: 0,
    upcomingSlots: 0,
    unviewedActivities: 0,
    activitiesToday: 0,
    completedSlots: 0
  });

  const [upcomingAssignments, setUpcomingAssignments] = useState([]);


  useEffect(() => {
    loadDashboardStats();
  }, []);

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

  const loadUpcomingAssignments = async () => {
    try {
      // Load tất cả các trang
      let pageIndex = 1;
      const pageSize = 100;
      let hasMore = true;
      const allUpcomingSlots = [];
      
      while (hasMore) {
        const response = await studentSlotService.getStaffSlots({
          pageIndex: pageIndex,
          pageSize: pageSize
        });
        
        const items = response?.items || [];
        const totalCount = response?.totalCount || 0;
        const totalPages = response?.totalPages || Math.ceil(totalCount / pageSize);
        
        // Lọc lấy các slot (ca giữ trẻ) đang diễn ra và sắp tới (không lấy slot đã qua)
        const upcomingItems = items.filter(slot => {
          // Đảm bảo đây là slot, không phải hoạt động
          if (!slot.date && !slot.branchSlot?.date) return false;
          
          const timeType = getSlotTimeType(slot);
          const isUpcoming = timeType === 'upcoming' || timeType === 'current';
          return isUpcoming;
        });
        
        allUpcomingSlots.push(...upcomingItems);
        
        if (pageIndex >= totalPages || items.length < pageSize) {
          hasMore = false;
        } else {
          pageIndex++;
        }
      }
      
      // Sắp xếp theo thời gian (sớm nhất trước)
      allUpcomingSlots.sort((a, b) => {
        const dateA = new Date(a.branchSlot?.date || a.date || 0);
        const dateB = new Date(b.branchSlot?.date || b.date || 0);
        return dateA - dateB;
      });
      
      // Chỉ lấy 5 lịch sắp tới gần nhất
      setUpcomingAssignments(allUpcomingSlots.slice(0, 5));
    } catch (error) {
      setUpcomingAssignments([]);
    }
  };

  const loadDashboardStats = async () => {
    showLoading();
    try {
      // Load activities
      const activitiesResponse = await activityService.getActivitiesPaged({
        pageIndex: 1,
        pageSize: 100,
        CreatedById: user?.id
      });
      
      const activities = Array.isArray(activitiesResponse?.items) 
        ? activitiesResponse.items 
        : [];
      
      const totalActivities = activitiesResponse?.totalCount || 0;
      
      // Calculate activities this month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const activitiesThisMonth = activities.filter(activity => {
        const createdDate = new Date(activity.createdTime || activity.createdDate);
        return createdDate >= firstDayOfMonth;
      }).length;

      // Calculate activities today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activitiesToday = activities.filter(activity => {
        const createdDate = new Date(activity.createdTime || activity.createdDate);
        createdDate.setHours(0, 0, 0, 0);
        return createdDate.getTime() === today.getTime();
      }).length;

      // Count unviewed activities
      const unviewedActivities = activities.filter(
        activity => !activity.isViewed
      ).length;

      // Load student slots
      const slotsResponse = await studentSlotService.getStaffSlots({
        pageIndex: 1,
        pageSize: 100
      });

      const slots = Array.isArray(slotsResponse?.items) 
        ? slotsResponse.items 
        : [];
      
      const totalSlots = slotsResponse?.totalCount || 0;

      // Calculate upcoming slots (from today onwards)
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const upcomingSlots = slots.filter(slot => {
        if (!slot.date) return false;
        const slotDate = new Date(slot.date);
        slotDate.setHours(0, 0, 0, 0);
        return slotDate >= todayDate;
      }).length;

      // Calculate completed slots (past slots)
      const completedSlots = slots.filter(slot => {
        if (!slot.date) return false;
        const slotDate = new Date(slot.date);
        slotDate.setHours(0, 0, 0, 0);
        return slotDate < todayDate;
      }).length;

      setStats({
        totalActivities,
        activitiesThisMonth,
        totalSlots,
        upcomingSlots,
        unviewedActivities,
        activitiesToday,
        completedSlots
      });

      // Load upcoming assignments
      await loadUpcomingAssignments();
    } catch (error) {
      showGlobalError('Không thể tải dữ liệu dashboard');
    } finally {
      hideLoading();
    }
  };

  const statCards = [
    {
      title: 'Tổng Hoạt Động',
      value: stats.totalActivities.toLocaleString('vi-VN'),
      icon: EventIcon,
      color: 'primary',
      onClick: () => navigate('/staff/activities')
    },
    {
      title: 'Hoạt Động Tháng Này',
      value: stats.activitiesThisMonth.toLocaleString('vi-VN'),
      icon: TrendingUpIcon,
      color: 'success',
      onClick: () => navigate('/staff/activities')
    },
    {
      title: 'Slot Sắp Tới',
      value: stats.upcomingSlots.toLocaleString('vi-VN'),
      icon: CalendarIcon,
      color: 'warning',
      onClick: () => navigate('/staff/assignments')
    }
  ];

  const quickActions = [
    {
      text: 'Quản Lý Hoạt Động',
      icon: <EventIcon />,
      primary: true,
      onClick: () => navigate('/staff/activities')
    },
    {
      text: 'Xem Lịch Phân Công',
      icon: <AssignmentIcon />,
      primary: false,
      onClick: () => navigate('/staff/assignments')
    },
    {
      text: 'Loại Hoạt Động',
      icon: <PeopleIcon />,
      primary: false,
      onClick: () => navigate('/staff/activity-types')
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
            Chào mừng, {user?.name || 'Nhân viên'}! Tổng quan công việc của bạn
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

        {/* Upcoming Assignments */}
        <AnimatedCard delay={0.5} className={styles.infoCard}>
          <div className={styles.infoHeader}>
            <h2 className={styles.infoTitle}>
              Ca giữ trẻ sắp tới
            </h2>
            <button
              className={styles.viewAllButton}
              onClick={() => navigate('/staff/assignments')}
            >
              Xem tất cả
            </button>
          </div>
          {upcomingAssignments.length > 0 ? (
            <div className={styles.schedulesList}>
              {upcomingAssignments.map((slot) => {
                const dateValue = slot.branchSlot?.date || slot.date;
                const timeframe = slot.timeframe || slot.timeFrame;
                const roomName = slot.room?.roomName || slot.roomName || slot.branchSlot?.roomName || 'Chưa xác định';
                const startTime = timeframe?.startTime || '';
                const endTime = timeframe?.endTime || '';
                
                return (
                  <Paper
                    key={slot.id}
                    elevation={0}
                    sx={{
                      p: 3,
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-lg)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: 'var(--color-primary)',
                        boxShadow: 'var(--shadow-sm)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                    onClick={() => navigate(`/staff/assignments/${slot.id}`, {
                      state: { from: 'staff-dashboard' }
                    })}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '1 1 200px' }}>
                        <CalendarToday sx={{ fontSize: 20, color: 'var(--text-secondary)' }} />
                        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.125rem' }}>
                          {dateValue ? formatDateOnlyUTC7(dateValue) : 'Chưa xác định'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '1 1 150px' }}>
                        <MeetingRoom sx={{ fontSize: 20, color: 'var(--text-secondary)' }} />
                        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.125rem' }}>
                          {roomName}
                        </Typography>
                      </Box>
                      {startTime && endTime && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '1 1 150px' }}>
                          <AccessTime sx={{ fontSize: 20, color: 'var(--text-secondary)' }} />
                          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.9375rem' }}>
                            {startTime.substring(0, 5)} - {endTime.substring(0, 5)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </div>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <ScheduleIcon sx={{ fontSize: 48, color: 'var(--text-secondary)', mb: 2, opacity: 0.5 }} />
              <Typography variant="body1" color="text.secondary" fontWeight="medium">
                Chưa có ca giữ trẻ sắp tới
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Hiện tại không có ca giữ trẻ nào đang diễn ra hoặc sắp tới
              </Typography>
            </Box>
          )}
        </AnimatedCard>
      </motion.div>
    </>
  );
};

export default StaffDashboard;
