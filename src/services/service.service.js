import axiosInstance from '../config/axios.config';

const serviceService = {
  /**
   * Get all services in the system (Admin only)
   * @returns {Promise<Array>} List of all services
   */
  getAllServices: async () => {
    try {
      const response = await axiosInstance.get('/Service');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  /**
   * Get all services for the manager's current branch (Manager)
   * @returns {Promise<Array>} List of services for current branch
   */
  getServicesForCurrentBranch: async () => {
    try {
      const response = await axiosInstance.get('/Service/branch/current');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Create a new service (Admin only)
   * @param {FormData|Object} serviceData - Service data as FormData (multipart/form-data) or Object
   * FormData should include: Name, Description, Price, Status, ServiceType, imageFile (optional), SlotTypeIds (optional, send empty)
   * @returns {Promise} Created service
   */
  createService: async (serviceData) => {
    try {
      let formData;
      
      // If serviceData is already FormData, use it directly
      if (serviceData instanceof FormData) {
        formData = serviceData;
      } else {
        // Otherwise, create FormData from object
        formData = new FormData();
        formData.append('Name', serviceData.name || '');
        formData.append('Description', serviceData.description || '');
        formData.append('Price', serviceData.price ? String(serviceData.price) : '0');
        formData.append('Stock', serviceData.stock !== undefined ? String(serviceData.stock) : '0');
        formData.append('Status', serviceData.status !== undefined ? String(serviceData.status) : 'true');
        formData.append('ServiceType', serviceData.serviceType || 'AddOn');
        
        // Image file (optional)
        if (serviceData.imageFile && serviceData.imageFile instanceof File) {
          formData.append('imageFile', serviceData.imageFile);
        }
        
        // SlotTypeIds - send empty as per user requirement
        // Don't append if empty or null
      }
      
      const response = await axiosInstance.post('/Service', formData, {
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
   * Lấy danh sách dịch vụ add-on dành cho phụ huynh (branch dựa trên claim)
   */
  getMyAddOns: async () => {
    try {
      const response = await axiosInstance.get('/Service/me/add-ons');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Lấy tất cả Add-on service theo branch của một học sinh (student).
   * Parent chỉ gọi được với student thuộc tài khoản của mình.
   * @param {string} studentId - UUID của student
   * @returns {Promise<Array>} Danh sách add-on services
   */
  getAddOnsForStudent: async (studentId) => {
    try {
      const response = await axiosInstance.get(`/Service/student/${studentId}/add-ons`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Lấy tất cả Course service cho một slot cụ thể,
   * dựa trên branch của student (student phải thuộc về user hiện tại).
   * @param {string} studentId - UUID của student
   * @param {string} branchSlotId - UUID của branch slot
   * @returns {Promise<Array>} Danh sách course services
   */
  getCoursesForStudentInSlot: async (studentId, branchSlotId) => {
    try {
      const response = await axiosInstance.get(`/Service/student/${studentId}/slots/${branchSlotId}/courses`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get service by ID (Admin only)
   * @param {string} id - Service ID (UUID)
   * @returns {Promise} Service details
   */
  getServiceById: async (id) => {
    try {
      const response = await axiosInstance.get(`/Service/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update an existing service (Admin only)
   * @param {FormData|Object} serviceData - Service data as FormData (multipart/form-data) or Object
   * FormData should include: Id, Name, Description, Price, Status, ServiceType, imageFile (optional), SlotTypeIds (optional)
   * @returns {Promise} Updated service
   */
  updateService: async (serviceData) => {
    try {
      let formData;
      
      // If serviceData is already FormData, use it directly
      if (serviceData instanceof FormData) {
        formData = serviceData;
      } else {
        // Otherwise, create FormData from object
        formData = new FormData();
        formData.append('Id', serviceData.id || serviceData.Id || '');
        formData.append('Name', serviceData.name || serviceData.Name || '');
        formData.append('Description', serviceData.description || serviceData.Description || '');
        formData.append('Price', serviceData.price !== undefined ? String(serviceData.price) : (serviceData.Price !== undefined ? String(serviceData.Price) : '0'));
        formData.append('Stock', serviceData.stock !== undefined ? String(serviceData.stock) : (serviceData.Stock !== undefined ? String(serviceData.Stock) : '0'));
        formData.append('Status', serviceData.status !== undefined ? String(serviceData.status) : (serviceData.Status !== undefined ? String(serviceData.Status) : 'true'));
        formData.append('ServiceType', serviceData.serviceType || serviceData.ServiceType || 'AddOn');
        
        // Image file (optional)
        if (serviceData.imageFile && serviceData.imageFile instanceof File) {
          formData.append('imageFile', serviceData.imageFile);
        }
        
        // SlotTypeIds - send empty as per user requirement
        // Don't append if empty or null
      }
      
      const response = await axiosInstance.put('/Service', formData, {
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
   * Delete (soft-delete) a service (Admin only)
   * @param {string} id - Service ID (UUID)
   * @returns {Promise} Deleted service
   */
  deleteService: async (id) => {
    try {
      const response = await axiosInstance.delete(`/Service/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Assign a service to multiple branches (Admin only)
   * @param {string} serviceId - Service ID (UUID)
   * @param {Array<string>} branchIds - Array of branch IDs (UUIDs)
   * @returns {Promise} Assignment result
   */
  assignServiceToBranches: async (serviceId, branchIds) => {
    try {
      const response = await axiosInstance.post(`/Service/${serviceId}/assign`, branchIds, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Unassign a service from multiple branches (Admin only)
   * @param {string} serviceId - Service ID (UUID)
   * @param {Array<string>} branchIds - Array of branch IDs (UUIDs)
   * @returns {Promise} Unassignment result
   */
  unassignServiceFromBranches: async (serviceId, branchIds) => {
    try {
      const response = await axiosInstance.post(`/Service/${serviceId}/unassign`, branchIds, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default serviceService;

