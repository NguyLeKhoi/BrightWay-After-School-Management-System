import axiosInstance from '../config/axios.config';

const nfcCardService = {
  /**
   * Get all students with NFC cards in manager's branch
   */
  getChildrenWithNfc: async () => {
    try {
      const response = await axiosInstance.get('/nfc-cards/manager/children-with-nfc');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get NFC card by UID
   */
  getByUid: async (uid) => {
    try {
      const response = await axiosInstance.get(`/nfc-cards/uid/${uid}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get NFC card by student ID
   */
  getByStudentId: async (studentId) => {
    try {
      const response = await axiosInstance.get(`/nfc-cards/student/${studentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Create new NFC card
   */
  createCard: async (cardData) => {
    try {
      const response = await axiosInstance.post('/nfc-cards', cardData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update NFC card status
   */
  updateCard: async (cardId, status) => {
    try {
      const response = await axiosInstance.patch(`/nfc-cards/${cardId}`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete NFC card
   */
  deleteCard: async (cardId) => {
    try {
      const response = await axiosInstance.delete(`/nfc-cards/${cardId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Create and pay for NFC card
   */
  createAndPay: async (cardData) => {
    try {
      const response = await axiosInstance.post('/nfc-cards/create-and-pay', cardData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default nfcCardService;
