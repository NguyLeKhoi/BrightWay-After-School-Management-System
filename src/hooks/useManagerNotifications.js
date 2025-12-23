import { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notification.service';

/**
 * Hook để quản lý notifications cho Manager
 * Cung cấp các hàm lấy thông báo, đếm thông báo chưa đọc, và xử lý actionUrl
 */
const useManagerNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Lấy danh sách thông báo từ API
   */
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await notificationService.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
      
      // Tính toán số thông báo chưa đọc
      const unread = Array.isArray(data) 
        ? data.filter(notif => !notif.isRead).length 
        : 0;
      setUnreadCount(unread);
    } catch (err) {
      const errorMessage = err?.message || 'Không thể tải thông báo';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Lấy số lượng thông báo chưa đọc từ API
   */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count || 0);
    } catch (err) {
      // Silent fail for unread count
    }
  }, []);

  /**
   * Đánh dấu một thông báo là đã đọc
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Cập nhật state cục bộ
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      
      // Cập nhật số lượng thông báo chưa đọc
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      throw err;
    }
  }, []);

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Cập nhật state cục bộ
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      
      // Reset số lượng thông báo chưa đọc
      setUnreadCount(0);
    } catch (err) {
      throw err;
    }
  }, []);

  /**
   * Xử lý click trên thông báo - đánh dấu đã đọc và điều hướng
   */
  const handleNotificationClick = useCallback(async (notification, navigate) => {
    try {
      // Đánh dấu thông báo là đã đọc nếu chưa đọc
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }

      // Xử lý actionUrl nếu có
      if (notification.actionUrl) {
        notificationService.handleActionUrl(notification.actionUrl, navigate);
      }
    } catch (err) {
      // Silent fail for notification click
    }
  }, [markAsRead]);

  /**
   * Khởi tạo dữ liệu thông báo khi component mount
   */
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    handleNotificationClick
  };
};

export default useManagerNotifications;
