import axiosInstance from '../config/axios.config';

/**
 * Notification Service
 * Quản lý các API liên quan đến thông báo
 */
const notificationService = {
  /**
   * Lấy tất cả thông báo của user hiện tại
   * @returns {Promise<any>} Danh sách thông báo
   */
  getNotifications: async () => {
    try {
      const response = await axiosInstance.get('/Notification');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Lấy số lượng thông báo chưa đọc của user hiện tại
   * @returns {Promise<number>} Số lượng thông báo chưa đọc
   */
  getUnreadCount: async () => {
    try {
      const response = await axiosInstance.get('/Notification/unread-count');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Đánh dấu một thông báo cụ thể là đã đọc
   * @param {string} notificationId - ID của thông báo
   * @returns {Promise<any>} Kết quả từ API
   */
  markAsRead: async (notificationId) => {
    try {
      const response = await axiosInstance.put(`/Notification/${notificationId}/mark-read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Đánh dấu tất cả thông báo là đã đọc cho user hiện tại
   * @returns {Promise<any>} Kết quả từ API
   */
  markAllAsRead: async () => {
    try {
      const response = await axiosInstance.put('/Notification/mark-all-read');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Xử lý actionUrl từ notification
   * Điều hướng đến URL tương ứng dựa trên loại thông báo
   * @param {string} actionUrl - URL hành động từ thông báo
   * @param {Function} navigate - Hàm navigate từ react-router-dom
   */
  handleActionUrl: (actionUrl, navigate) => {
    if (!actionUrl || !navigate) return;

    try {
      // Xử lý các route khác nhau dựa trên actionUrl
      if (actionUrl.startsWith('/')) {
        // Là internal route
        navigate(actionUrl);
      } else if (actionUrl.startsWith('http://') || actionUrl.startsWith('https://')) {
        // Là external URL
        window.open(actionUrl, '_blank');
      } else {
        // Cố gắng điều hướng như internal route
        navigate('/' + actionUrl);
      }
    } catch (error) {
    }
  }
};

export default notificationService;

