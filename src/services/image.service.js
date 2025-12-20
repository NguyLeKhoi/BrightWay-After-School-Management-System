import axiosInstance from '../config/axios.config';

/**
 * Image Service
 * Handles image upload operations
 */
const imageService = {
  /**
   * Upload an image file
   * @param {File} file - The image file to upload
   * @returns {Promise<string>} The URL of the uploaded image
   */
  uploadImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosInstance.post('/Image/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // API trả về thông tin ảnh đã upload
      // Có thể là URL trực tiếp hoặc object với các field khác nhau

      // Try different possible response formats
      if (typeof response.data === 'string') {
        return response.data; // Direct URL string
      }

      return response.data?.url ||
             response.data?.imageUrl ||
             response.data?.publicUrl ||
             response.data?.fileUrl ||
             response.data?.path ||
             response.data?.imagePath ||
             JSON.stringify(response.data); // Fallback to stringify
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default imageService;

