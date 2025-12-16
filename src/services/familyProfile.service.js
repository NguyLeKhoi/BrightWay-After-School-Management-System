import axiosInstance from '../config/axios.config';

/**
 * Family Profile Service
 * Handles all family profile-related API calls
 */
const familyProfileService = {
  /**
   * Get all family profiles of current user
   * @returns {Promise} List of family profiles
   */
  getMyProfiles: async () => {
    try {
      const response = await axiosInstance.get('/FamilyProfile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get family profile by ID
   * @param {string} id - Family profile ID
   * @returns {Promise} Family profile details
   */
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/FamilyProfile/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get family profiles (guardians) by student ID
   * @param {string} studentId - Student ID
   * @returns {Promise} List of family profiles related to a student
   */
  getByStudentId: async (studentId) => {
    try {
      const response = await axiosInstance.get(`/FamilyProfile/student/${studentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Create new family profile
   * @param {FormData|Object} data - Family profile data
   * @param {string} data.Name - Name (required)
   * @param {string} data.Phone - Phone number
   * @param {string} data.StudentRela - Relationship to student
   * @param {File} data.AvatarFile - Avatar image file (optional)
   * @returns {Promise} Created family profile
   */
  create: async (data) => {
    try {
      let formData;
      
      // If FormData, send directly (for multipart/form-data)
      if (data instanceof FormData) {
        formData = data;
      } else {
        // Otherwise, create FormData from object
        formData = new FormData();
        
        if (data.Name) {
          formData.append('Name', data.Name);
        }
        if (data.Phone) {
          formData.append('Phone', data.Phone);
        }
        if (data.StudentRela) {
          formData.append('StudentRela', data.StudentRela);
        }
        if (data.AvatarFile instanceof File) {
          formData.append('AvatarFile', data.AvatarFile);
        }
      }

      const response = await axiosInstance.post('/FamilyProfile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update family profile
   * @param {string} id - Family profile ID
   * @param {FormData|Object} data - Updated family profile data
   * @param {string} data.Id - Family profile ID (required for update)
   * @param {string} data.Name - Name (required)
   * @param {string} data.Phone - Phone number
   * @param {string} data.StudentRela - Relationship to student
   * @param {File} data.AvatarFile - Avatar image file (optional)
   * @returns {Promise} Updated family profile
   */
  update: async (id, data) => {
    try {
      let formData;
      
      // If FormData, send directly (for multipart/form-data)
      if (data instanceof FormData) {
        formData = data;
        // Ensure Id is in FormData if not already present
        if (!formData.has('Id')) {
          formData.append('Id', id);
        }
      } else {
        // Otherwise, create FormData from object
        formData = new FormData();
        
        // Id is required for update
        formData.append('Id', id);
        
        // Name is required
        if (data.Name) {
          formData.append('Name', data.Name);
        }
        
        // Phone is optional - append if provided (including empty string)
        if (data.Phone !== undefined && data.Phone !== null) {
          formData.append('Phone', data.Phone);
        }
        
        // StudentRela is optional - append if provided (including empty string)
        if (data.StudentRela !== undefined && data.StudentRela !== null) {
          formData.append('StudentRela', data.StudentRela);
        }
        
        // AvatarFile is optional - only append if provided as File
        if (data.AvatarFile instanceof File) {
          formData.append('AvatarFile', data.AvatarFile);
        }
      }

      const response = await axiosInstance.put(`/FamilyProfile/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete family profile (soft delete)
   * @param {string} id - Family profile ID
   * @returns {Promise} Deletion result
   */
  delete: async (id) => {
    try {
      const response = await axiosInstance.delete(`/FamilyProfile/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default familyProfileService;

