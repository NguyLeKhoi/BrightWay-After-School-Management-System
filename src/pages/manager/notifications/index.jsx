import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Notifications as NotificationIcon
} from '@mui/icons-material';
import ContentLoading from '../../../components/Common/ContentLoading';
import useManagerNotifications from '../../../hooks/useManagerNotifications';
import styles from './ManagerNotifications.module.css';

const ManagerNotifications = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    handleNotificationClick
  } = useManagerNotifications();

  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredNotifications = notifications.filter(notif => {
    if (selectedFilter === 'unread') return !notif.isRead;
    if (selectedFilter === 'read') return notif.isRead;
    return true;
  });

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#dc3545';
      case 'medium':
        return '#ffc107';
      case 'low':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  const getChannelLabel = (channel) => {
    const channelMap = {
      'InApp': 'Trong ứng dụng',
      'Email': 'Email',
      'SMS': 'SMS',
      'Push': 'Thông báo đẩy'
    };
    return channelMap[channel] || channel;
  };

  const formatTimeAgo = (createdAt) => {
    try {
      const date = new Date(createdAt);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins}p trước`;
      if (diffHours < 24) return `${diffHours}h trước`;
      if (diffDays < 7) return `${diffDays}d trước`;
      
      return date.toLocaleDateString('vi-VN');
    } catch (error) {
      return '';
    }
  };

  if (isLoading) {
    return <ContentLoading isLoading={true} text="Đang tải thông báo..." />;
  }

  return (
    <motion.div 
      className={styles.notificationsPage}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Thông báo</h1>
          <div className={styles.headerActions}>
            {unreadCount > 0 && (
              <button 
                className={styles.markAllButton}
                onClick={markAllAsRead}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
            <span className={styles.unreadCount}>
              {unreadCount} chưa đọc
            </span>
          </div>
        </div>

        {error && (
          <div className={styles.errorState}>
            <p className={styles.errorMessage}>{error}</p>
            <button className={styles.retryButton} onClick={() => window.location.reload()}>
              Thử lại
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className={styles.filterContainer}>
          <button 
            className={`${styles.filterButton} ${selectedFilter === 'all' ? styles.active : ''}`}
            onClick={() => setSelectedFilter('all')}
          >
            Tất cả ({notifications.length})
          </button>
          <button 
            className={`${styles.filterButton} ${selectedFilter === 'unread' ? styles.active : ''}`}
            onClick={() => setSelectedFilter('unread')}
          >
            Chưa đọc ({unreadCount})
          </button>
          <button 
            className={`${styles.filterButton} ${selectedFilter === 'read' ? styles.active : ''}`}
            onClick={() => setSelectedFilter('read')}
          >
            Đã đọc ({notifications.filter(n => n.isRead).length})
          </button>
        </div>

        {/* Notifications List */}
        <div className={styles.notificationsList}>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : ''}`}
                onClick={() => handleNotificationClick(notification, navigate)}
              >
                <div 
                  className={styles.notificationIcon}
                  style={{ backgroundColor: getPriorityColor(notification.priority) }}
                >
                  <NotificationIcon sx={{ fontSize: 20, color: 'white' }} />
                </div>
                
                <div className={styles.notificationContent}>
                  <div className={styles.notificationHeader}>
                    <h3 className={styles.notificationTitle}>
                      {notification.title}
                    </h3>
                    <span className={styles.notificationTime}>
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                  
                  <p className={styles.notificationMessage}>
                    {notification.message}
                  </p>
                  
                  <div className={styles.tagContainer}>
                    {notification.priority && (
                      <span className={styles.priorityTag} style={{ borderColor: getPriorityColor(notification.priority), color: getPriorityColor(notification.priority) }}>
                        {notification.priority}
                      </span>
                    )}
                    
                    {notification.channels && (
                      <span className={styles.channelTag}>
                        {getChannelLabel(notification.channels)}
                      </span>
                    )}
                  </div>
                </div>
                
                {!notification.isRead && (
                  <div className={styles.unreadIndicator}></div>
                )}
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <NotificationIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
              </div>
              <h3>Không có thông báo</h3>
              <p>Bạn sẽ nhận được thông báo khi có hoạt động mới</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ManagerNotifications;
